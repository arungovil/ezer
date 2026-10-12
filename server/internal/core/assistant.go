package core

import (
	"encoding/json"
	"fmt"
	"strings"

	"ezer/internal/llm"
	"ezer/models"
)

const (
	retrievalLimit        = 40
	historyCharLimit      = 500
	notesContextCharLimit = 8000
	answerTemperature     = 0.3
)

const (
	intentSpecific   = "specific"
	intentSummary    = "summary"
	intentOutOfScope = "out_of_scope"
)

const refusalReply = "I can only answer from the notes you've saved on this page. Ask me whether " +
	"you saved something about a topic, or ask me to summarise a topic."

// quoteStripper removes quote characters that would end an FTS5 phrase early.
var quoteStripper = strings.NewReplacer(`"`, "", `'`, "")

// classification is the router's reading of a chat message.
type classification struct {
	Intent          string
	StandaloneQuery string
	Topic           string
	Keywords        []string
}

// assistantState is persisted on the ezer message so the next turn's classifier can see which
// topic the conversation was on.
type assistantState struct {
	Intent   string   `json:"intent"`
	Topic    string   `json:"topic"`
	Keywords []string `json:"keywords"`
}

// assistantReply is the outcome of one assistant turn.
type assistantReply struct {
	Reply    string
	Rejected bool
	State    *assistantState
}

// answerFromNotes classifies the message, retrieves notes with FTS5 (falling back to the broad
// topic, then to listing everything for "show me my notes"), and has the model answer from them.
func (c *Core) answerFromNotes(
	originID, userID, message string,
	history []models.Chat,
) (assistantReply, error) {
	class, err := c.classify(message, history)
	if err != nil {
		return assistantReply{}, err
	}

	if class.Intent == intentOutOfScope {
		return assistantReply{Reply: refusalReply, Rejected: true}, nil
	}

	state := &assistantState{Intent: class.Intent, Topic: class.Topic, Keywords: class.Keywords}
	hasTopic := len(class.Keywords) > 0

	var hits []models.Task
	if hasTopic {
		hits, err = c.searchTasks(originID, userID, class.Keywords, retrievalLimit)
	} else {
		hits, err = c.selectTasks(originID, userID, "")
	}
	if err != nil {
		return assistantReply{}, err
	}

	usedFallback := false
	if len(hits) == 0 && hasTopic {
		anchor := class.Topic
		differs := anchor != "" && !(len(class.Keywords) == 1 && class.Keywords[0] == anchor)
		if differs {
			hits, err = c.searchTasks(originID, userID, []string{anchor}, retrievalLimit)
			if err != nil {
				return assistantReply{}, err
			}
			usedFallback = len(hits) > 0
		}
	}

	if len(hits) == 0 {
		reply := emptyNotesReply(class.Intent)
		if hasTopic {
			reply = nothingFoundReply(class.Topic)
		}
		return assistantReply{Reply: reply, State: state}, nil
	}

	if class.Intent == intentSpecific && !hasTopic {
		return assistantReply{Reply: formatAllNotes(hits), State: state}, nil
	}

	reply, err := c.answer(class, hits, history, usedFallback)
	if err != nil {
		return assistantReply{}, err
	}
	return assistantReply{Reply: reply, State: state}, nil
}

// searchTasks runs a BM25-ranked FTS5 match over an origin's tasks.
func (c *Core) searchTasks(originID, userID string, keywords []string, limit int) ([]models.Task, error) {
	out := []models.Task{}
	match := makeMatchQuery(keywords)
	if match == "" {
		return out, nil
	}

	err := c.q.SearchTasks.Select(&out, match, originID, userID, limit)
	return out, err
}

// makeMatchQuery turns keywords into an FTS5 MATCH expression. Each keyword becomes a quoted
// phrase so user or model text can never be parsed as FTS5 operators.
func makeMatchQuery(keywords []string) string {
	terms := make([]string, 0, len(keywords))
	for _, keyword := range keywords {
		keyword = strings.TrimSpace(quoteStripper.Replace(keyword))
		if keyword != "" {
			terms = append(terms, `"`+keyword+`"`)
		}
	}
	return strings.Join(terms, " OR ")
}

// classify asks the model to route the message. A reply that isn't the requested shape is
// treated as out of scope rather than a server error.
func (c *Core) classify(message string, history []models.Chat) (classification, error) {
	turns := make([]string, 0, len(history))
	for _, turn := range history {
		role := "user"
		if turn.Role == models.ChatRoleEzer {
			role = "assistant"
		}
		state := ""
		if turn.AgentState != nil {
			state = " [state: " + *turn.AgentState + "]"
		}
		turns = append(turns, role+": "+truncateRunes(turn.Content, historyCharLimit)+state)
	}

	conversation := strings.Join(turns, "\n")
	if conversation == "" {
		conversation = "(none)"
	}

	temperature := 0.0
	content, err := c.llm.Complete(llm.Request{
		Temperature: &temperature,
		JSONObject:  true,
		Messages: []llm.Message{
			{Role: "system", Content: classifierSystemPrompt},
			{
				Role: "user",
				Content: "Conversation so far:\n" + conversation +
					"\n\nLatest message: " + message,
			},
		},
	})
	if err != nil {
		return classification{}, err
	}

	parsed, ok := parseClassification(content)
	if !ok {
		return classification{
			Intent:          intentOutOfScope,
			StandaloneQuery: message,
			Keywords:        []string{},
		}, nil
	}

	parsed.StandaloneQuery = strings.TrimSpace(parsed.StandaloneQuery)
	if parsed.StandaloneQuery == "" {
		parsed.StandaloneQuery = message
	}
	parsed.Topic = strings.TrimSpace(parsed.Topic)

	keywords := make([]string, 0, len(parsed.Keywords))
	for _, keyword := range parsed.Keywords {
		if keyword = strings.TrimSpace(keyword); keyword != "" {
			keywords = append(keywords, keyword)
		}
	}
	parsed.Keywords = keywords

	return parsed, nil
}

// parseClassification validates the classifier's JSON. It accepts standalone_query as an alias
// because models drift between camelCase and snake_case.
func parseClassification(raw string) (classification, bool) {
	var payload struct {
		Intent               *string   `json:"intent"`
		StandaloneQuery      *string   `json:"standaloneQuery"`
		StandaloneQuerySnake *string   `json:"standalone_query"`
		Topic                *string   `json:"topic"`
		Keywords             *[]string `json:"keywords"`
	}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return classification{}, false
	}

	standalone := payload.StandaloneQuery
	if standalone == nil {
		standalone = payload.StandaloneQuerySnake
	}

	if payload.Intent == nil || standalone == nil || payload.Topic == nil || payload.Keywords == nil {
		return classification{}, false
	}

	switch *payload.Intent {
	case intentSpecific, intentSummary, intentOutOfScope:
	default:
		return classification{}, false
	}

	return classification{
		Intent:          *payload.Intent,
		StandaloneQuery: *standalone,
		Topic:           *payload.Topic,
		Keywords:        *payload.Keywords,
	}, true
}

// answer has the model reply from the retrieved notes only.
func (c *Core) answer(
	class classification,
	hits []models.Task,
	history []models.Chat,
	usedFallback bool,
) (string, error) {
	messages := make([]llm.Message, 0, len(history)+2)
	messages = append(messages, llm.Message{Role: "system", Content: answerSystemPrompt})
	for _, turn := range history {
		role := "user"
		if turn.Role == models.ChatRoleEzer {
			role = "assistant"
		}
		messages = append(messages, llm.Message{Role: role, Content: turn.Content})
	}
	messages = append(messages, llm.Message{
		Role:    "user",
		Content: buildAnswerUserPrompt(class, buildNotesContext(hits), usedFallback),
	})

	temperature := answerTemperature
	content, err := c.llm.Complete(llm.Request{Messages: messages, Temperature: &temperature})
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(content), nil
}

// buildNotesContext packs notes until the character budget is hit, so one huge note can't push
// the rest out silently: the model is told when some were omitted.
func buildNotesContext(hits []models.Task) string {
	sections := make([]string, 0, len(hits))
	total := 0

	for _, hit := range hits {
		section := formatNote(hit)
		length := len([]rune(section))
		if len(sections) > 0 && total+length > notesContextCharLimit {
			break
		}
		sections = append(sections, section)
		total += length
	}

	joined := strings.Join(sections, "\n\n")
	if len(sections) < len(hits) {
		joined += "\n\n(Some notes were omitted to keep this concise.)"
	}
	return joined
}

// formatNote renders one note for the prompt: title and kind, then the fullest text we have.
func formatNote(note models.Task) string {
	meta := []string{note.Kind}
	if note.DueAt != nil && *note.DueAt != "" {
		meta = append(meta, "due "+*note.DueAt)
	}

	body := note.Title
	if note.Summary != nil && strings.TrimSpace(*note.Summary) != "" {
		body = strings.TrimSpace(*note.Summary)
	}
	if note.Body != nil && strings.TrimSpace(*note.Body) != "" {
		body = strings.TrimSpace(*note.Body)
	}

	return fmt.Sprintf("[%s — %s]\n%s", note.Title, strings.Join(meta, ", "), body)
}

// buildAnswerUserPrompt is the final user turn: request type, question and the notes block.
func buildAnswerUserPrompt(class classification, notesContext string, usedFallback bool) string {
	fallbackNote := ""
	if usedFallback {
		fallbackNote = "\n(The notes below are the closest match for the broader topic; they may " +
			"not cover this specific question.)"
	}

	return strings.TrimSpace(strings.Join([]string{
		"Request type: " + class.Intent,
		"Question: " + class.StandaloneQuery,
		fallbackNote,
		"",
		"<notes>",
		notesContext,
		"</notes>",
	}, "\n"))
}

func nothingFoundReply(topic string) string {
	if topic != "" {
		return fmt.Sprintf("I couldn't find any notes about %q on this page.", topic)
	}
	return "I couldn't find any notes about that on this page."
}

func emptyNotesReply(intent string) string {
	if intent == intentSummary {
		return "There aren't any notes on this page to summarise yet. " +
			"Highlight text on the page to save one."
	}
	return "You haven't saved any notes on this page yet. Highlight text on the page to save one."
}

func formatAllNotes(tasks []models.Task) string {
	lines := make([]string, 0, len(tasks))
	for _, task := range tasks {
		kind := "Note"
		if task.Kind == models.TaskKindReminder {
			kind = "Reminder"
		}
		due := ""
		if task.DueAt != nil && *task.DueAt != "" {
			due = " — due " + *task.DueAt
		}
		lines = append(lines, fmt.Sprintf("- %s (%s%s)", task.Title, kind, due))
	}

	count := fmt.Sprintf("%d saved items", len(tasks))
	if len(tasks) == 1 {
		count = "1 saved item"
	}
	return fmt.Sprintf("You've got **%s** here:\n%s", count, strings.Join(lines, "\n"))
}
