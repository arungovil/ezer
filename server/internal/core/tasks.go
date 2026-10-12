package core

import (
	"database/sql"
	"errors"
	"net/http"

	"ezer/models"
)

// CreateTask saves a task for the page the tab is on.
func (c *Core) CreateTask(userID string, req models.TaskCreateRequest) (models.Task, error) {
	pageOrigin, err := parsePageOrigin(req.TabURL)
	if err != nil {
		return models.Task{}, newHTTPError(http.StatusBadRequest, errInvalidTabURL)
	}

	origin, err := c.getOrCreateOrigin(userID, pageOrigin)
	if err != nil {
		return models.Task{}, c.serverError(http.StatusInternalServerError, errTaskPersistFailed,
			"creating origin", err)
	}

	id, err := c.insertTask(models.Task{
		OriginID:    origin.ID,
		UserID:      userID,
		Kind:        req.Kind,
		Title:       req.Title,
		Summary:     req.Summary,
		DueAt:       req.DueAt,
		SourceURL:   req.SourceURL,
		SourceTitle: req.SourceTitle,
	})
	if err != nil {
		return models.Task{}, c.serverError(http.StatusInternalServerError, errTaskPersistFailed,
			"creating task", err)
	}

	return c.GetTask(userID, id)
}

// GetTask gets a task by ID. It is scoped to the user, so another user's task is not found.
func (c *Core) GetTask(userID, id string) (models.Task, error) {
	var out models.Task
	if err := c.q.GetTask.Get(&out, id, userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Task{}, newHTTPError(http.StatusNotFound, errTaskNotFound)
		}
		return models.Task{}, c.serverError(http.StatusInternalServerError, errRequestFailed,
			"fetching task", err)
	}

	return out, nil
}

// QueryTasks gets the tasks saved on the site of tabURL, newest first, optionally filtered by
// status. A site with no saved notes yet is an empty result, not an error.
func (c *Core) QueryTasks(userID, tabURL, status string) (models.TaskListResponse, error) {
	pageOrigin, err := parsePageOrigin(tabURL)
	if err != nil {
		return models.TaskListResponse{}, newHTTPError(http.StatusBadRequest, errInvalidTabURL)
	}

	out := models.TaskListResponse{TabURL: tabURL, Tasks: []models.Task{}}

	var origin models.Origin
	if err := c.q.GetOrigin.Get(&origin, userID, pageOrigin); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return out, nil
		}
		return models.TaskListResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "fetching origin", err)
	}

	tasks, err := c.selectTasks(origin.ID, userID, status)
	if err != nil {
		return models.TaskListResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "fetching tasks", err)
	}

	out.OriginID, out.Origin, out.Tasks = &origin.ID, &origin.Origin, tasks
	return out, nil
}

// UpdateTask patches a task. The handler has validated and trimmed the fields.
func (c *Core) UpdateTask(userID, id string, req models.TaskUpdateRequest) (models.Task, error) {
	res, err := c.q.UpdateTask.Exec(id, userID, req.Kind.Value, req.Title.Value, req.Status.Value,
		req.Summary.Set, req.Summary.Value, req.DueAt.Set, req.DueAt.Value)
	if err != nil {
		return models.Task{}, c.serverError(http.StatusInternalServerError, errRequestFailed,
			"updating task", err)
	}

	if n, _ := res.RowsAffected(); n == 0 {
		return models.Task{}, newHTTPError(http.StatusNotFound, errTaskNotFound)
	}

	return c.GetTask(userID, id)
}

// insertTask stores a new active task and returns its ID.
func (c *Core) insertTask(t models.Task) (string, error) {
	id, err := newUUID()
	if err != nil {
		return "", err
	}

	_, err = c.q.InsertTask.Exec(id, t.OriginID, t.UserID, t.ChatID, t.Kind, t.Title, t.Summary,
		t.Body, t.DueAt, t.SourceURL, t.SourceTitle, now())
	return id, err
}

// selectTasks returns an origin's tasks newest first. An empty status means any status.
func (c *Core) selectTasks(originID, userID, status string) ([]models.Task, error) {
	out := []models.Task{}
	err := c.q.QueryTasks.Select(&out, originID, userID, status)
	return out, err
}
