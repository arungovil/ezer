package models

// Task is a captured note or reminder. Origin comes from a JOIN, not the task table.
type Task struct {
	ID          string  `db:"id" json:"id"`
	OriginID    string  `db:"origin_id" json:"originId"`
	Origin      string  `db:"origin" json:"origin"`
	UserID      string  `db:"user_id" json:"-"`
	ChatID      *string `db:"chat_id" json:"chatId"`
	Kind        string  `db:"kind" json:"kind"`
	Title       string  `db:"title" json:"title"`
	Summary     *string `db:"summary" json:"summary"`
	Body        *string `db:"body" json:"-"`
	DueAt       *string `db:"due_at" json:"dueAt"`
	Status      string  `db:"status" json:"status"`
	SourceURL   *string `db:"source_url" json:"sourceUrl"`
	SourceTitle *string `db:"source_title" json:"sourceTitle"`
	CreatedAt   string  `db:"created_at" json:"createdAt"`
}

// TaskCreateRequest is the body of POST /task.
type TaskCreateRequest struct {
	Kind        string  `json:"kind"`
	Title       string  `json:"title"`
	TabURL      string  `json:"tabUrl"`
	Summary     *string `json:"summary"`
	DueAt       *string `json:"dueAt"`
	SourceURL   *string `json:"sourceUrl"`
	SourceTitle *string `json:"sourceTitle"`
}

// TaskUpdateRequest is the body of PATCH /task/:id. Absent keys are left alone; an explicit null
// clears summary and dueAt.
type TaskUpdateRequest struct {
	Status  Optional[string] `json:"status"`
	Kind    Optional[string] `json:"kind"`
	Title   Optional[string] `json:"title"`
	Summary Optional[string] `json:"summary"`
	DueAt   Optional[string] `json:"dueAt"`
}

// TaskListResponse is the body of GET /task. OriginID and Origin are null for a site with no
// saved notes yet.
type TaskListResponse struct {
	OriginID *string `json:"originId"`
	Origin   *string `json:"origin"`
	TabURL   string  `json:"tabUrl"`
	Tasks    []Task  `json:"tasks"`
}
