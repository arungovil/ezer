package models

// Chat is one message in a site's thread.
type Chat struct {
	ID          string  `db:"id" json:"id"`
	OriginID    string  `db:"origin_id" json:"-"`
	Role        string  `db:"role" json:"role"`
	MessageType string  `db:"message_type" json:"messageType"`
	Content     string  `db:"content" json:"content"`
	AgentState  *string `db:"agent_state" json:"-"`
	CreatedAt   string  `db:"created_at" json:"createdAt"`
}

// ChatRequest is the body of POST /chat. A non-empty Action is a quick action and never calls
// the LLM.
type ChatRequest struct {
	Message string `json:"message"`
	TabURL  string `json:"tabUrl"`
	Action  string `json:"action"`
}

// ChatListResponse is the body of GET /chat.
type ChatListResponse struct {
	OriginID *string `json:"originId"`
	Origin   *string `json:"origin"`
	TabURL   string  `json:"tabUrl"`
	Messages []Chat  `json:"messages"`
}

// ChatResponse is the body of POST /chat. Content is set only for quick actions.
type ChatResponse struct {
	OriginID      string      `json:"originId"`
	Origin        string      `json:"origin"`
	Reply         string      `json:"reply"`
	Rejected      bool        `json:"rejected"`
	UserMessageID string      `json:"userMessageId"`
	EzerMessageID string      `json:"ezerMessageId"`
	Content       ChatContent `json:"content,omitempty"`
}

// ChatContent is the structured body of a quick-action reply: MarkdownContent or
// TaskListContent.
type ChatContent interface {
	isChatContent()
}

// MarkdownContent is a plain markdown reply (the help text).
type MarkdownContent struct {
	Format string `json:"format"`
	Text   string `json:"text"`
}

// TaskListItem is one row of a TaskListContent.
type TaskListItem struct {
	ID      string  `json:"id"`
	Title   string  `json:"title"`
	Summary *string `json:"summary"`
	DueAt   *string `json:"dueAt"`
}

// TaskListContent is a reply listing notes or reminders.
type TaskListContent struct {
	Format string         `json:"format"`
	Kind   string         `json:"kind"`
	Intro  string         `json:"intro"`
	Items  []TaskListItem `json:"items"`
}

func (MarkdownContent) isChatContent() {}

func (TaskListContent) isChatContent() {}
