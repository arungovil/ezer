package models

// CaptureRequest is the body of POST /captures: a selection the user highlighted.
type CaptureRequest struct {
	Text     string `json:"text"`
	TabURL   string `json:"tabUrl"`
	URL      string `json:"url"`
	Title    string `json:"title"`
	Timezone string `json:"timezone"`
}

// CaptureItem is the saved task as shown in the confirmation.
type CaptureItem struct {
	ID      string  `json:"id"`
	Kind    string  `json:"kind"`
	Title   string  `json:"title"`
	DueAt   *string `json:"dueAt"`
	Summary *string `json:"summary"`
}

// CaptureResponse is the body of POST /captures.
type CaptureResponse struct {
	TaskID        string      `json:"taskId"`
	OriginID      string      `json:"originId"`
	Origin        string      `json:"origin"`
	Item          CaptureItem `json:"item"`
	Reply         string      `json:"reply"`
	UserMessageID string      `json:"userMessageId"`
	EzerMessageID string      `json:"ezerMessageId"`
}
