package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"ezer/models"
)

// GetChats retrieves one page of the conversation for the site of the tabUrl query param. The
// newest `limit` messages are returned by default; `before` (a message ID) pages backwards.
func (a *App) GetChats(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	tabURL := strings.TrimSpace(q.Get("tabUrl"))
	if tabURL == "" {
		writeError(w, http.StatusBadRequest, msgTabURLRequired)
		return
	}

	// Validate. An oversized limit is clamped, a malformed one is an error.
	limit := defaultChatPageSize
	if raw := strings.TrimSpace(q.Get("limit")); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 {
			writeError(w, http.StatusBadRequest, msgInvalidLimit)
			return
		}
		limit = min(n, maxChatPageSize)
	}

	before := strings.TrimSpace(q.Get("before"))
	if !strHasLen(before, 0, stdInputMaxLen) {
		writeError(w, http.StatusBadRequest, msgInputTooLong)
		return
	}

	// TEMP(skeleton-demo): remove this sleep (and the "time" import) once the loader is checked.
	if before != "" {
		time.Sleep(2 * time.Second)
	}

	out, err := a.core.GetChats(getUserID(r), tabURL, before, limit)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// PostChat handles one chat turn. With an action it is answered from the database; without,
// the assistant answers from the user's notes on the site.
func (a *App) PostChat(w http.ResponseWriter, r *http.Request) {
	var req models.ChatRequest
	if !bindJSON(w, r, &req, msgChatRequired) {
		return
	}

	req.Message = strings.TrimSpace(req.Message)
	req.TabURL = strings.TrimSpace(req.TabURL)

	// Validate.
	if req.Message == "" || req.TabURL == "" {
		writeError(w, http.StatusBadRequest, msgChatRequired)
		return
	}
	if req.Action != "" && !models.IsQuickAction(req.Action) {
		writeError(w, http.StatusBadRequest, msgChatRequired)
		return
	}
	if !strHasLen(req.Message, 1, textMaxLen) || !strHasLen(req.TabURL, 1, stdInputMaxLen) {
		writeError(w, http.StatusBadRequest, msgInputTooLong)
		return
	}

	out, err := a.core.Chat(getUserID(r), req)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// DeleteChat soft-deletes a chat message the user owns.
func (a *App) DeleteChat(w http.ResponseWriter, r *http.Request) {
	id := trimmedParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, msgChatIDRequired)
		return
	}

	if err := a.core.DeleteChat(getUserID(r), id); err != nil {
		a.respondErr(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
