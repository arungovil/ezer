package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/go-chi/chi/v5"
)

const (
	userID  = "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b"
	otherID = "9a8b7c6d-1e2f-4a3b-8c4d-5e6f7a8b9c0d"
	tabURL  = "https://example.com/articles/dams?ref=1"
)

// fakeLLM answers chat completions by looking at the system prompt, so tests control what the
// "model" says for capture, classification and answering independently.
type fakeLLM struct {
	mu       sync.Mutex
	capture  string
	classify string
	answer   string
	fail     bool
	calls    int
}

func (f *fakeLLM) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.calls++

	if f.fail {
		http.Error(w, `{"error":"boom"}`, http.StatusInternalServerError)
		return
	}

	var req struct {
		Messages []struct {
			Content string `json:"content"`
		} `json:"messages"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	system := req.Messages[0].Content
	reply := f.answer
	switch {
	case strings.Contains(system, "You save text the user selected"):
		reply = f.capture
	case strings.Contains(system, "You route requests"):
		reply = f.classify
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"choices": []any{map[string]any{"message": map[string]any{"content": reply}}},
	})
}

type env struct {
	t      *testing.T
	server *httptest.Server
	llm    *fakeLLM
}

func newEnv(t *testing.T, withLLM bool) *env {
	t.Helper()

	cfg := &Config{DBPath: filepath.Join(t.TempDir(), "ezer.sqlite")}

	fake := &fakeLLM{}
	if withLLM {
		llmServer := httptest.NewServer(fake)
		t.Cleanup(llmServer.Close)
		cfg.LLMAPIKey, cfg.LLMBaseURL, cfg.LLMModel = "test-key", llmServer.URL, "test-model"
	}

	app, err := initApp(cfg)
	if err != nil {
		t.Fatalf("initApp: %v", err)
	}
	t.Cleanup(func() { app.db.Close() })

	router := chi.NewRouter()
	initHTTPHandlers(router, app)
	server := httptest.NewServer(router)
	t.Cleanup(server.Close)

	return &env{t: t, server: server, llm: fake}
}

func (e *env) do(method, path, user string, body any) (int, map[string]any) {
	e.t.Helper()

	var reader io.Reader
	if body != nil {
		switch value := body.(type) {
		case string:
			reader = strings.NewReader(value)
		default:
			encoded, _ := json.Marshal(value)
			reader = strings.NewReader(string(encoded))
		}
	}

	req, err := http.NewRequest(method, e.server.URL+path, reader)
	if err != nil {
		e.t.Fatal(err)
	}
	if user != "" {
		req.Header.Set("X-Ezer-User-Id", user)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		e.t.Fatal(err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var decoded map[string]any
	_ = json.Unmarshal(raw, &decoded)
	return resp.StatusCode, decoded
}

func expectStatus(t *testing.T, got, want int, body map[string]any) {
	t.Helper()
	if got != want {
		t.Fatalf("status = %d, want %d (body %v)", got, want, body)
	}
}

func TestHealthAndAuth(t *testing.T) {
	e := newEnv(t, false)

	status, body := e.do("GET", "/health", "", nil)
	expectStatus(t, status, 200, body)

	for _, path := range []string{"/chat?tabUrl=" + tabURL, "/task?tabUrl=" + tabURL, "/user"} {
		status, body = e.do("GET", path, "", nil)
		expectStatus(t, status, 401, body)
		status, _ = e.do("GET", path, "not-a-uuid", nil)
		expectStatus(t, status, 401, nil)
	}

	status, body = e.do("GET", "/nope", userID, nil)
	expectStatus(t, status, 404, body)
}

func TestUserLifecycle(t *testing.T) {
	e := newEnv(t, false)

	status, body := e.do("GET", "/user", userID, nil)
	expectStatus(t, status, 404, body)

	status, body = e.do("PUT", "/user", userID, nil)
	expectStatus(t, status, 200, body)
	if body["id"] != userID {
		t.Fatalf("id = %v", body["id"])
	}

	status, body = e.do("GET", "/user", userID, nil)
	expectStatus(t, status, 200, body)

	status, _ = e.do("DELETE", "/user", userID, nil)
	expectStatus(t, status, 204, nil)
	status, body = e.do("DELETE", "/user", userID, nil)
	expectStatus(t, status, 404, body)
}

func TestCaptureUsesModelResult(t *testing.T) {
	e := newEnv(t, true)
	e.llm.capture = `{"kind":"reminder","title":"Submit report","dueAt":"2026-10-14T15:00:00+05:30",` +
		`"summary":"Report due Friday.","reply":"⏰ **Reminder set**"}`

	status, body := e.do("POST", "/captures", userID, map[string]any{
		"text": "  submit the report Friday 3pm ", "tabUrl": tabURL, "title": "Work", "timezone": "Asia/Kolkata",
	})
	expectStatus(t, status, 200, body)

	item := body["item"].(map[string]any)
	if item["kind"] != "reminder" || item["title"] != "Submit report" ||
		item["dueAt"] != "2026-10-14T15:00:00+05:30" {
		t.Fatalf("item = %v", item)
	}
	if body["origin"] != "https://example.com" {
		t.Fatalf("origin = %v", body["origin"])
	}

	// The capture shows up in history and as a task for the same site, under another path.
	status, body = e.do("GET", "/chat?tabUrl=https://example.com/other", userID, nil)
	expectStatus(t, status, 200, body)
	messages := body["messages"].([]any)
	if len(messages) != 2 || messages[0].(map[string]any)["messageType"] != "CAPTURE" {
		t.Fatalf("messages = %v", messages)
	}

	status, body = e.do("GET", "/task?tabUrl="+tabURL+"&status=active", userID, nil)
	expectStatus(t, status, 200, body)
	tasks := body["tasks"].([]any)
	if len(tasks) != 1 || tasks[0].(map[string]any)["sourceUrl"] != tabURL {
		t.Fatalf("tasks = %v", tasks)
	}
}

func TestCaptureFallsBackToNoteWhenModelFails(t *testing.T) {
	cases := map[string]func(*fakeLLM){
		"http error":       func(f *fakeLLM) { f.fail = true },
		"not json":         func(f *fakeLLM) { f.capture = "sure! here you go" },
		"bad kind":         func(f *fakeLLM) { f.capture = `{"kind":"todo","title":"x","dueAt":null,"summary":"s","reply":"r"}` },
		"missing dueAt":    func(f *fakeLLM) { f.capture = `{"kind":"note","title":"x","summary":"s","reply":"r"}` },
		"blank reply":      func(f *fakeLLM) { f.capture = `{"kind":"note","title":"x","dueAt":null,"summary":"s","reply":" "}` },
		"wrong field type": func(f *fakeLLM) { f.capture = `{"kind":"note","title":7,"dueAt":null,"summary":"s","reply":"r"}` },
	}

	for name, configure := range cases {
		t.Run(name, func(t *testing.T) {
			e := newEnv(t, true)
			configure(e.llm)

			status, body := e.do("POST", "/captures", userID,
				map[string]any{"text": "Dams hold back water.", "tabUrl": tabURL})
			expectStatus(t, status, 200, body)

			item := body["item"].(map[string]any)
			if item["kind"] != "note" || item["title"] != "Dams hold back water." {
				t.Fatalf("item = %v", item)
			}
			if !strings.Contains(body["reply"].(string), "Noted") {
				t.Fatalf("reply = %v", body["reply"])
			}
		})
	}
}

func TestCaptureValidation(t *testing.T) {
	e := newEnv(t, true)

	for name, body := range map[string]any{
		"empty body":  "",
		"not json":    "{",
		"array":       "[]",
		"no text":     map[string]any{"tabUrl": tabURL},
		"blank text":  map[string]any{"text": "  ", "tabUrl": tabURL},
		"number text": map[string]any{"text": 5, "tabUrl": tabURL},
		"missing tab": map[string]any{"text": "hi"},
	} {
		t.Run(name, func(t *testing.T) {
			status, resp := e.do("POST", "/captures", userID, body)
			expectStatus(t, status, 400, resp)
		})
	}

	status, body := e.do("POST", "/captures", userID, map[string]any{"text": "hi", "tabUrl": "nonsense"})
	expectStatus(t, status, 400, body)
	if body["error"] != "tabUrl must be a valid page URL" {
		t.Fatalf("error = %v", body["error"])
	}

	// Oversized input is rejected instead of being sent to the model.
	status, body = e.do("POST", "/captures", userID,
		map[string]any{"text": "hi", "tabUrl": tabURL, "title": strings.Repeat("x", 2001)})
	expectStatus(t, status, 400, body)
}

func TestWithoutLLMKey(t *testing.T) {
	e := newEnv(t, false)

	status, body := e.do("POST", "/captures", userID, map[string]any{"text": "hi", "tabUrl": tabURL})
	expectStatus(t, status, 503, body)

	status, body = e.do("POST", "/chat", userID, map[string]any{"message": "hi", "tabUrl": tabURL})
	expectStatus(t, status, 503, body)

	// Quick actions never need the model.
	status, body = e.do("POST", "/chat", userID,
		map[string]any{"message": "/notes", "tabUrl": tabURL, "action": "notes"})
	expectStatus(t, status, 200, body)
}

func TestQuickActions(t *testing.T) {
	e := newEnv(t, false)

	post := func(action string) map[string]any {
		status, body := e.do("POST", "/chat", userID,
			map[string]any{"message": "/" + action, "tabUrl": tabURL, "action": action})
		expectStatus(t, status, 200, body)
		return body
	}

	empty := post("notes")
	if !strings.HasPrefix(empty["reply"].(string), "No notes saved") {
		t.Fatalf("reply = %v", empty["reply"])
	}
	content := empty["content"].(map[string]any)
	if content["format"] != "taskList" || len(content["items"].([]any)) != 0 {
		t.Fatalf("content = %v", content)
	}

	e.do("POST", "/task", userID, map[string]any{"kind": "note", "title": "Dam basics", "tabUrl": tabURL})
	e.do("POST", "/task", userID,
		map[string]any{"kind": "reminder", "title": "Pay bill", "tabUrl": tabURL, "dueAt": "2026-03-04T10:00:00Z"})

	notes := post("notes")
	if want := "You've got **1 note** here:\n\n- **Dam basics**"; notes["reply"] != want {
		t.Fatalf("reply = %q, want %q", notes["reply"], want)
	}

	reminders := post("reminders")
	reply := reminders["reply"].(string)
	if !strings.Contains(reply, "- **Pay bill** — due 3/4/2026") {
		t.Fatalf("reply = %q", reply)
	}

	help := post("help")
	if help["content"].(map[string]any)["format"] != "markdown" {
		t.Fatalf("help = %v", help)
	}

	status, body := e.do("POST", "/chat", userID,
		map[string]any{"message": "x", "tabUrl": tabURL, "action": "bogus"})
	expectStatus(t, status, 400, body)
}

func TestChatGroundedAnswer(t *testing.T) {
	e := newEnv(t, true)
	e.do("POST", "/task", userID, map[string]any{
		"kind": "note", "title": "Hoover Dam", "summary": "Built in 1936.", "tabUrl": tabURL,
	})

	e.llm.classify = `{"intent":"specific","standaloneQuery":"When was Hoover Dam built?",` +
		`"topic":"Hoover Dam","keywords":["hoover dam","dams"]}`
	e.llm.answer = "It was built in 1936 (from *Hoover Dam*)."

	status, body := e.do("POST", "/chat", userID,
		map[string]any{"message": "when was it built?", "tabUrl": tabURL})
	expectStatus(t, status, 200, body)
	if body["reply"] != e.llm.answer || body["rejected"] != false {
		t.Fatalf("body = %v", body)
	}

	// FTS5 uses porter stemming, so "damming" must still retrieve "Dam" notes; and nothing
	// matching means a deterministic "couldn't find" reply with no answer call.
	e.llm.classify = `{"intent":"specific","standaloneQuery":"q","topic":"volcanoes","keywords":["volcanoes"]}`
	callsBefore := e.llm.calls
	status, body = e.do("POST", "/chat", userID, map[string]any{"message": "volcanoes?", "tabUrl": tabURL})
	expectStatus(t, status, 200, body)
	if body["reply"] != `I couldn't find any notes about "volcanoes" on this page.` {
		t.Fatalf("reply = %v", body["reply"])
	}
	if e.llm.calls-callsBefore != 1 {
		t.Fatalf("expected only the classifier call, got %d", e.llm.calls-callsBefore)
	}

	// Another user's notes are invisible.
	e.llm.classify = `{"intent":"specific","standaloneQuery":"q","topic":"dam","keywords":["dam"]}`
	status, body = e.do("POST", "/chat", otherID, map[string]any{"message": "dam?", "tabUrl": tabURL})
	expectStatus(t, status, 200, body)
	if !strings.Contains(body["reply"].(string), "couldn't find") {
		t.Fatalf("other user saw notes: %v", body["reply"])
	}
}

func TestChatOutOfScopeAndBadClassification(t *testing.T) {
	e := newEnv(t, true)

	e.llm.classify = `{"intent":"out_of_scope","standaloneQuery":"joke","topic":"","keywords":[]}`
	status, body := e.do("POST", "/chat", userID, map[string]any{"message": "tell a joke", "tabUrl": tabURL})
	expectStatus(t, status, 200, body)
	if body["rejected"] != true {
		t.Fatalf("body = %v", body)
	}

	// Unparseable classification degrades to a refusal, not a 5xx.
	e.llm.classify = "I think this is about dams"
	status, body = e.do("POST", "/chat", userID, map[string]any{"message": "dams", "tabUrl": tabURL})
	expectStatus(t, status, 200, body)
	if body["rejected"] != true {
		t.Fatalf("body = %v", body)
	}

	// A model outage is a 502 and persists nothing.
	e.llm.fail = true
	status, body = e.do("POST", "/chat", userID, map[string]any{"message": "again", "tabUrl": tabURL})
	expectStatus(t, status, 502, body)

	status, body = e.do("GET", "/chat?tabUrl="+tabURL, userID, nil)
	expectStatus(t, status, 200, body)
	if n := len(body["messages"].([]any)); n != 4 {
		t.Fatalf("messages = %d, want 4", n)
	}
}

func TestTaskCreateGetPatch(t *testing.T) {
	e := newEnv(t, false)

	status, body := e.do("POST", "/task", userID, map[string]any{"kind": "note", "title": "x"})
	expectStatus(t, status, 400, body)

	status, body = e.do("POST", "/task", userID, map[string]any{
		"kind": "reminder", "title": "  Call Sam ", "tabUrl": tabURL, "summary": " s ",
		"dueAt": "2026-10-20T09:00:00Z",
	})
	expectStatus(t, status, 201, body)
	id := body["id"].(string)
	if body["title"] != "Call Sam" || body["summary"] != "s" || body["status"] != "active" {
		t.Fatalf("task = %v", body)
	}

	status, body = e.do("GET", "/task/"+id, userID, nil)
	expectStatus(t, status, 200, body)
	status, _ = e.do("GET", "/task/"+id, otherID, nil)
	expectStatus(t, status, 404, nil)

	// null clears, absent leaves alone.
	status, body = e.do("PATCH", "/task/"+id, userID, `{"dueAt":null,"status":"done"}`)
	expectStatus(t, status, 200, body)
	if body["dueAt"] != nil || body["status"] != "done" || body["summary"] != "s" {
		t.Fatalf("patched = %v", body)
	}

	for name, payload := range map[string]string{
		"empty":        `{}`,
		"bad status":   `{"status":"archived"}`,
		"blank title":  `{"title":"  "}`,
		"bad due type": `{"dueAt":5}`,
		"bad kind":     `{"kind":"todo"}`,
		"null status":  `{"status":null}`,
	} {
		t.Run(name, func(t *testing.T) {
			status, body := e.do("PATCH", "/task/"+id, userID, payload)
			expectStatus(t, status, 400, body)
		})
	}

	status, _ = e.do("PATCH", "/task/missing", userID, `{"status":"done"}`)
	expectStatus(t, status, 404, nil)
}

func TestDeleteChat(t *testing.T) {
	e := newEnv(t, true)
	e.llm.capture = `{"kind":"note","title":"t","dueAt":null,"summary":"s","reply":"r"}`

	status, capture := e.do("POST", "/captures", userID, map[string]any{"text": "hi", "tabUrl": tabURL})
	expectStatus(t, status, 200, capture)

	// The capture's user message owns a task, so it cannot be removed.
	status, body := e.do("DELETE", "/chat/"+capture["userMessageId"].(string), userID, nil)
	expectStatus(t, status, 409, body)

	// The assistant's confirmation can; someone else cannot delete it.
	ezerID := capture["ezerMessageId"].(string)
	status, _ = e.do("DELETE", "/chat/"+ezerID, otherID, nil)
	expectStatus(t, status, 404, nil)
	status, _ = e.do("DELETE", "/chat/"+ezerID, userID, nil)
	expectStatus(t, status, 204, nil)
	status, _ = e.do("DELETE", "/chat/"+ezerID, userID, nil)
	expectStatus(t, status, 404, nil)
}

func TestFTSKeywordsCannotInjectSyntax(t *testing.T) {
	e := newEnv(t, true)
	e.do("POST", "/task", userID, map[string]any{"kind": "note", "title": "Dam", "tabUrl": tabURL})

	e.llm.classify = `{"intent":"specific","standaloneQuery":"q","topic":"t",` +
		`"keywords":["dam\" OR *","NEAR(","a:b","'"]}`
	e.llm.answer = "ok"
	status, body := e.do("POST", "/chat", userID, map[string]any{"message": "dam", "tabUrl": tabURL})
	expectStatus(t, status, 200, body)
}

func TestConcurrentCapturesOnNewSite(t *testing.T) {
	e := newEnv(t, true)
	e.llm.capture = `{"kind":"note","title":"t","dueAt":null,"summary":"s","reply":"r"}`

	var wg sync.WaitGroup
	failures := make(chan string, 20)
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			status, body := e.do("POST", "/captures", userID,
				map[string]any{"text": "same site", "tabUrl": "https://race.example.org/a"})
			if status != 200 {
				failures <- body["error"].(string)
			}
		}()
	}
	wg.Wait()
	close(failures)

	for failure := range failures {
		t.Errorf("concurrent capture failed: %s", failure)
	}

	status, body := e.do("GET", "/task?tabUrl=https://race.example.org/", userID, nil)
	expectStatus(t, status, 200, body)
	if n := len(body["tasks"].([]any)); n != 20 {
		t.Fatalf("tasks = %d, want 20", n)
	}
}

func TestPreflight(t *testing.T) {
	e := newEnv(t, false)

	req, _ := http.NewRequest(http.MethodOptions, e.server.URL+"/captures", nil)
	req.Header.Set("Origin", "chrome-extension://abc")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "content-type,x-ezer-user-id")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 204 {
		t.Fatalf("preflight status = %d", resp.StatusCode)
	}
	if resp.Header.Get("Access-Control-Allow-Origin") == "" ||
		!strings.Contains(strings.ToLower(resp.Header.Get("Access-Control-Allow-Headers")), "x-ezer-user-id") {
		t.Fatalf("headers = %v", resp.Header)
	}
}

func TestChatPagination(t *testing.T) {
	e := newEnv(t, false)

	// 4 quick actions = 8 messages (a user/ezer pair each), inserted back to back.
	for i := 0; i < 4; i++ {
		status, body := e.do("POST", "/chat", userID,
			map[string]any{"message": "/help", "tabUrl": tabURL, "action": "help"})
		expectStatus(t, status, 200, body)
	}

	ids := func(body map[string]any) []string {
		var out []string
		for _, m := range body["messages"].([]any) {
			out = append(out, m.(map[string]any)["id"].(string))
		}
		return out
	}

	status, all := e.do("GET", "/chat?limit=100&tabUrl="+tabURL, userID, nil)
	expectStatus(t, status, 200, all)
	want := ids(all)
	if len(want) != 8 || all["hasMore"] != false {
		t.Fatalf("full list = %d messages, hasMore = %v", len(want), all["hasMore"])
	}

	// Walk backwards three at a time. Pages are oldest-first, newest page first.
	var got []string
	before := ""
	for page := 0; page < 10; page++ {
		path := "/chat?limit=3&tabUrl=" + tabURL
		if before != "" {
			path += "&before=" + before
		}
		status, body := e.do("GET", path, userID, nil)
		expectStatus(t, status, 200, body)

		pageIDs := ids(body)
		got = append(pageIDs, got...)

		if page == 0 {
			// A new message arriving mid-scroll must not shift the older pages.
			e.do("POST", "/chat", userID,
				map[string]any{"message": "/help", "tabUrl": tabURL, "action": "help"})
		}

		if body["hasMore"] != true {
			break
		}
		before = pageIDs[0]
	}

	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("paged = %v\n want  = %v", got, want)
	}
}

func TestChatPaginationEdges(t *testing.T) {
	e := newEnv(t, false)
	e.do("POST", "/chat", userID,
		map[string]any{"message": "/help", "tabUrl": tabURL, "action": "help"})

	for _, q := range []string{"limit=0", "limit=-2", "limit=abc"} {
		status, body := e.do("GET", "/chat?tabUrl="+tabURL+"&"+q, userID, nil)
		expectStatus(t, status, 400, body)
	}

	// Oversized limits are clamped, not rejected.
	status, body := e.do("GET", "/chat?tabUrl="+tabURL+"&limit=100000", userID, nil)
	expectStatus(t, status, 200, body)

	// An unknown cursor, or one from another user's thread, yields an empty page (no probing).
	status, body = e.do("GET", "/chat?tabUrl="+tabURL+"&before=nope", userID, nil)
	expectStatus(t, status, 200, body)
	if n := len(body["messages"].([]any)); n != 0 || body["hasMore"] != false {
		t.Fatalf("unknown cursor: %d messages, hasMore %v", n, body["hasMore"])
	}

	_, mine := e.do("GET", "/chat?tabUrl="+tabURL, userID, nil)
	foreign := mine["messages"].([]any)[1].(map[string]any)["id"].(string)
	e.do("POST", "/chat", otherID,
		map[string]any{"message": "/help", "tabUrl": tabURL, "action": "help"})
	status, body = e.do("GET", "/chat?tabUrl="+tabURL+"&before="+foreign, otherID, nil)
	expectStatus(t, status, 200, body)
	if n := len(body["messages"].([]any)); n != 0 {
		t.Fatalf("foreign cursor returned %d messages", n)
	}
}
