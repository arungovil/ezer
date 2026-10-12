package core

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"ezer/internal/llm"
	"ezer/models"
)

const fallbackTitleLimit = 80

var errInvalidExtraction = errors.New("LLM capture response has an invalid shape")

// captureExtraction is what the model returns for a selection.
type captureExtraction struct {
	Kind    string
	Title   string
	DueAt   *string
	Summary string
	Reply   string
}

// Capture stores the selection as a chat turn, asks the model to classify it, and saves a task.
// If the model fails or answers off-schema the selection is still saved as a plain note: a
// user's highlight must never be lost to an LLM outage.
func (c *Core) Capture(userID string, req models.CaptureRequest) (models.CaptureResponse, error) {
	pageOrigin, err := parsePageOrigin(req.TabURL)
	if err != nil {
		return models.CaptureResponse{}, newHTTPError(http.StatusBadRequest, errInvalidTabURL)
	}

	if c.llm == nil {
		return models.CaptureResponse{}, newHTTPError(http.StatusServiceUnavailable,
			errLLMNotConfigured)
	}

	fail := func(what string, err error) (models.CaptureResponse, error) {
		return models.CaptureResponse{}, c.serverError(http.StatusInternalServerError,
			errCapturePersistFail, what, err)
	}

	origin, err := c.getOrCreateOrigin(userID, pageOrigin)
	if err != nil {
		return fail("creating origin", err)
	}

	userMsgID, err := newUUID()
	if err != nil {
		return fail("generating UUID", err)
	}
	ezerMsgID, err := newUUID()
	if err != nil {
		return fail("generating UUID", err)
	}

	// A map marshals with sorted keys, which is fine: the extension reads this back by key.
	selection := map[string]string{"text": req.Text}
	if req.URL != "" {
		selection["url"] = req.URL
	}
	if req.Title != "" {
		selection["title"] = req.Title
	}
	encoded, err := json.Marshal(selection)
	if err != nil {
		return fail("encoding capture", err)
	}

	if err := c.insertChat(userMsgID, origin.ID, models.ChatRoleUser, models.ChatTypeCapture,
		string(encoded), nil); err != nil {
		return fail("saving capture message", err)
	}

	extracted, err := c.extractCapture(req)
	if err != nil {
		c.log.Printf("capture: model extraction failed, saving as note: %v", err)
		extracted = fallbackCapture(req.Text)
	}

	sourceURL := req.URL
	if sourceURL == "" {
		sourceURL = req.TabURL
	}
	body := req.Text
	summary := strings.TrimSpace(extracted.Summary)

	taskID, err := c.insertTask(models.Task{
		OriginID:    origin.ID,
		UserID:      userID,
		ChatID:      &userMsgID,
		Kind:        extracted.Kind,
		Title:       strings.TrimSpace(extracted.Title),
		Summary:     &summary,
		Body:        &body,
		DueAt:       extracted.DueAt,
		SourceURL:   &sourceURL,
		SourceTitle: nonEmpty(req.Title),
	})
	if err != nil {
		return fail("saving task", err)
	}

	reply := strings.TrimSpace(extracted.Reply)
	if err := c.insertChat(ezerMsgID, origin.ID, models.ChatRoleEzer, models.ChatTypeText, reply,
		nil); err != nil {
		return fail("saving reply", err)
	}

	task, err := c.GetTask(userID, taskID)
	if err != nil {
		return models.CaptureResponse{}, err
	}

	return models.CaptureResponse{
		TaskID:   task.ID,
		OriginID: origin.ID,
		Origin:   origin.Origin,
		Item: models.CaptureItem{
			ID:      task.ID,
			Kind:    task.Kind,
			Title:   task.Title,
			DueAt:   task.DueAt,
			Summary: task.Summary,
		},
		Reply:         reply,
		UserMessageID: userMsgID,
		EzerMessageID: ezerMsgID,
	}, nil
}

// extractCapture asks the model to classify the selection and validates the JSON it returns.
func (c *Core) extractCapture(req models.CaptureRequest) (captureExtraction, error) {
	content, err := c.llm.Complete(llm.Request{
		JSONObject: true,
		Messages: []llm.Message{
			{Role: "system", Content: captureSystemPrompt},
			{Role: "user", Content: buildCapturePrompt(req)},
		},
	})
	if err != nil {
		return captureExtraction{}, err
	}

	return parseCaptureExtraction(content)
}

// buildCapturePrompt is the user turn for the capture classifier.
func buildCapturePrompt(req models.CaptureRequest) string {
	pageURL := req.URL
	if pageURL == "" {
		pageURL = req.TabURL
	}

	parts := []string{"Selected text:\n" + req.Text, "Page URL: " + pageURL}
	if req.Title != "" {
		parts = append(parts, "Page title: "+req.Title)
	}
	if req.Timezone != "" {
		parts = append(parts, "User timezone: "+req.Timezone)
	}
	parts = append(parts, "Captured at: "+now())

	return strings.Join(parts, "\n\n")
}

// parseCaptureExtraction validates the model's JSON; dueAt must be present, as a string or an
// explicit null.
func parseCaptureExtraction(raw string) (captureExtraction, error) {
	var payload struct {
		Kind    *string         `json:"kind"`
		Title   *string         `json:"title"`
		DueAt   json.RawMessage `json:"dueAt"`
		Summary *string         `json:"summary"`
		Reply   *string         `json:"reply"`
	}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return captureExtraction{}, err
	}

	if payload.Kind == nil || !models.IsTaskKind(*payload.Kind) ||
		payload.Title == nil || strings.TrimSpace(*payload.Title) == "" ||
		payload.Summary == nil ||
		payload.Reply == nil || strings.TrimSpace(*payload.Reply) == "" ||
		len(payload.DueAt) == 0 {
		return captureExtraction{}, errInvalidExtraction
	}

	var dueAt *string
	if err := json.Unmarshal(payload.DueAt, &dueAt); err != nil {
		return captureExtraction{}, err
	}

	return captureExtraction{
		Kind:    *payload.Kind,
		Title:   *payload.Title,
		DueAt:   dueAt,
		Summary: *payload.Summary,
		Reply:   *payload.Reply,
	}, nil
}

// fallbackCapture is the plain note saved when the model is unavailable.
func fallbackCapture(text string) captureExtraction {
	title := text
	if runes := []rune(text); len(runes) > fallbackTitleLimit {
		title = string(runes[:fallbackTitleLimit-3]) + "..."
	}

	return captureExtraction{
		Kind:    models.TaskKindNote,
		Title:   title,
		Summary: "Saved your selection as a note.",
		Reply:   "📌 **Noted.** I saved this as a note:\n\n> " + title,
	}
}
