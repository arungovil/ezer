package main

import (
	"net/http"
	"strings"

	"ezer/models"
)

// PostCapture handles a highlighted selection: the model classifies it and it is saved as a
// note or a reminder. If the model fails it is still saved, as a plain note.
func (a *App) PostCapture(w http.ResponseWriter, r *http.Request) {
	var req models.CaptureRequest
	if !bindJSON(w, r, &req, msgCaptureRequired) {
		return
	}

	req.Text = strings.TrimSpace(req.Text)
	req.TabURL = strings.TrimSpace(req.TabURL)
	req.URL = strings.TrimSpace(req.URL)
	req.Title = strings.TrimSpace(req.Title)
	req.Timezone = strings.TrimSpace(req.Timezone)

	// Validate.
	if req.Text == "" || req.TabURL == "" {
		writeError(w, http.StatusBadRequest, msgCaptureRequired)
		return
	}
	if !strHasLen(req.Text, 1, textMaxLen) || !strHasLen(req.TabURL, 1, stdInputMaxLen) ||
		!strHasLen(req.URL, 0, stdInputMaxLen) || !strHasLen(req.Title, 0, stdInputMaxLen) ||
		!strHasLen(req.Timezone, 0, stdInputMaxLen) {
		writeError(w, http.StatusBadRequest, msgInputTooLong)
		return
	}

	out, err := a.core.Capture(getUserID(r), req)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}
