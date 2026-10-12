package main

import (
	"net/http"
	"strings"

	"ezer/models"
)

// GetChats retrieves the conversation for the site of the tabUrl query param.
func (a *App) GetChats(w http.ResponseWriter, r *http.Request) {
	tabURL := strings.TrimSpace(r.URL.Query().Get("tabUrl"))
	if tabURL == "" {
		writeError(w, http.StatusBadRequest, msgTabURLRequired)
		return
	}

	out, err := a.core.GetChats(getUserID(r), tabURL)
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
