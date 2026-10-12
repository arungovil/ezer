// Package models holds the types shared across layers: database rows, request bodies and
// responses. Where the wire shape and the row are the same, one struct carries both `db` and
// `json` tags; fields that must not leave the server are tagged `json:"-"`.
package models

import "encoding/json"

const (
	TaskKindNote     = "note"
	TaskKindReminder = "reminder"

	TaskStatusActive    = "active"
	TaskStatusDone      = "done"
	TaskStatusDismissed = "dismissed"

	ChatRoleUser = "user"
	ChatRoleEzer = "ezer"

	ChatTypeText        = "TEXT"
	ChatTypeCapture     = "CAPTURE"
	ChatTypeQuickAction = "QUICK_ACTION"

	ActionNotes     = "notes"
	ActionReminders = "reminders"
	ActionHelp      = "help"
)

// IsTaskKind reports whether v is a valid task kind.
func IsTaskKind(v string) bool {
	return v == TaskKindNote || v == TaskKindReminder
}

// IsTaskStatus reports whether v is a valid task status.
func IsTaskStatus(v string) bool {
	return v == TaskStatusActive || v == TaskStatusDone || v == TaskStatusDismissed
}

// IsQuickAction reports whether v is a valid chat quick action.
func IsQuickAction(v string) bool {
	return v == ActionNotes || v == ActionReminders || v == ActionHelp
}

// Optional is a JSON patch value that tells an absent key (Set=false) from an explicit null
// (Set=true, Value=nil) from a value.
type Optional[T any] struct {
	Set   bool
	Value *T
}

// UnmarshalJSON records that the key was present and decodes null as a nil Value.
func (o *Optional[T]) UnmarshalJSON(b []byte) error {
	o.Set = true
	if string(b) == "null" {
		o.Value = nil
		return nil
	}

	var v T
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}
	o.Value = &v
	return nil
}
