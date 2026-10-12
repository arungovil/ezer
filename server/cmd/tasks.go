package main

import (
	"net/http"
	"strings"

	"ezer/models"
)

// GetTasks retrieves the tasks saved on the site of the tabUrl query param, optionally
// filtered by status. An unknown status filter is ignored, not rejected.
func (a *App) GetTasks(w http.ResponseWriter, r *http.Request) {
	tabURL := strings.TrimSpace(r.URL.Query().Get("tabUrl"))
	if tabURL == "" {
		writeError(w, http.StatusBadRequest, msgTabURLRequired)
		return
	}

	status := strings.TrimSpace(r.URL.Query().Get("status"))
	if !models.IsTaskStatus(status) {
		status = ""
	}

	out, err := a.core.QueryTasks(getUserID(r), tabURL, status)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// GetTask retrieves a single task by ID.
func (a *App) GetTask(w http.ResponseWriter, r *http.Request) {
	id := trimmedParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, msgTaskIDRequired)
		return
	}

	out, err := a.core.GetTask(getUserID(r), id)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// PostTask handles task creation.
func (a *App) PostTask(w http.ResponseWriter, r *http.Request) {
	var req models.TaskCreateRequest
	if !bindJSON(w, r, &req, msgTaskRequired) {
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.TabURL = strings.TrimSpace(req.TabURL)
	req.Summary = trimmedPtr(req.Summary, true)
	req.SourceURL = trimmedPtr(req.SourceURL, false)
	req.SourceTitle = trimmedPtr(req.SourceTitle, false)

	// Validate.
	if !models.IsTaskKind(req.Kind) || req.Title == "" || req.TabURL == "" {
		writeError(w, http.StatusBadRequest, msgTaskRequired)
		return
	}
	if !strHasLen(req.Title, 1, stdInputMaxLen) || !strHasLen(req.TabURL, 1, stdInputMaxLen) ||
		(req.Summary != nil && !strHasLen(*req.Summary, 0, textMaxLen)) ||
		(req.SourceURL != nil && !strHasLen(*req.SourceURL, 0, stdInputMaxLen)) ||
		(req.SourceTitle != nil && !strHasLen(*req.SourceTitle, 0, stdInputMaxLen)) {
		writeError(w, http.StatusBadRequest, msgInputTooLong)
		return
	}

	out, err := a.core.CreateTask(getUserID(r), req)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, out)
}

// PatchTask handles a partial task update.
func (a *App) PatchTask(w http.ResponseWriter, r *http.Request) {
	id := trimmedParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, msgTaskIDRequired)
		return
	}

	var req models.TaskUpdateRequest
	if !bindJSON(w, r, &req, msgTaskUpdate) {
		return
	}

	if !validTaskUpdate(&req) {
		writeError(w, http.StatusBadRequest, msgTaskUpdate)
		return
	}

	out, err := a.core.UpdateTask(getUserID(r), id, req)
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// validTaskUpdate validates and normalizes a patch in place. Any present-but-invalid value
// rejects the whole request, and so does a patch that changes nothing. An explicit null is only
// allowed for summary and dueAt.
func validTaskUpdate(req *models.TaskUpdateRequest) bool {
	changed := false

	if req.Status.Set {
		if req.Status.Value == nil || !models.IsTaskStatus(*req.Status.Value) {
			return false
		}
		changed = true
	}

	if req.Kind.Set {
		if req.Kind.Value == nil || !models.IsTaskKind(*req.Kind.Value) {
			return false
		}
		changed = true
	}

	if req.Title.Set {
		if req.Title.Value == nil {
			return false
		}
		title := strings.TrimSpace(*req.Title.Value)
		if !strHasLen(title, 1, stdInputMaxLen) {
			return false
		}
		req.Title.Value = &title
		changed = true
	}

	if req.Summary.Set {
		req.Summary.Value = trimmedPtr(req.Summary.Value, true)
		if req.Summary.Value != nil && !strHasLen(*req.Summary.Value, 0, textMaxLen) {
			return false
		}
		changed = true
	}

	if req.DueAt.Set {
		if req.DueAt.Value != nil && !strHasLen(*req.DueAt.Value, 0, stdInputMaxLen) {
			return false
		}
		changed = true
	}

	return changed
}

// trimmedPtr trims the string behind p. With keepEmpty the empty string is preserved,
// otherwise an empty result becomes nil (store NULL).
func trimmedPtr(p *string, keepEmpty bool) *string {
	if p == nil {
		return nil
	}

	s := strings.TrimSpace(*p)
	if s == "" && !keepEmpty {
		return nil
	}
	return &s
}
