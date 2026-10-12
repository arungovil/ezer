package core

import (
	"fmt"
	"strings"
	"time"

	"ezer/models"
)

const helpReply = "I'm Ezer — your side-panel assistant for this **site**.\n" +
	"\n" +
	"- **Highlight** text on the page while this panel is open. I'll save a **note**, or a " +
	"**reminder** if it's something to do.\n" +
	"- **Ask** about what you've saved here. I only answer from your notes on this page, not " +
	"general knowledge.\n" +
	"- Type **/** in the input for shortcuts like listing notes or reminders."

// quickActionContent builds the structured reply for a /notes, /reminders or /help action.
func (c *Core) quickActionContent(
	userID string,
	origin models.Origin,
	action string,
) (models.ChatContent, error) {
	if action == models.ActionHelp {
		return models.MarkdownContent{Format: "markdown", Text: helpReply}, nil
	}

	tasks, err := c.selectTasks(origin.ID, userID, models.TaskStatusActive)
	if err != nil {
		return nil, err
	}

	kind := models.TaskKindReminder
	if action == models.ActionNotes {
		kind = models.TaskKindNote
	}

	items := make([]models.TaskListItem, 0, len(tasks))
	for _, t := range tasks {
		if t.Kind == kind {
			items = append(items, models.TaskListItem{
				ID: t.ID, Title: t.Title, Summary: t.Summary, DueAt: t.DueAt,
			})
		}
	}

	return models.TaskListContent{
		Format: "taskList",
		Kind:   kind,
		Intro:  listIntro(kind, len(items)),
		Items:  items,
	}, nil
}

// plainText is the `reply` string for clients that only read the text field.
func plainText(content models.ChatContent) string {
	switch v := content.(type) {
	case models.MarkdownContent:
		return v.Text
	case models.TaskListContent:
		if len(v.Items) == 0 {
			return v.Intro
		}

		lines := make([]string, 0, len(v.Items))
		for _, item := range v.Items {
			line := "- **" + item.Title + "**"
			if v.Kind == models.TaskKindReminder && item.DueAt != nil {
				if due, ok := formatDueDate(*item.DueAt); ok {
					line += " — due " + due
				}
			}
			lines = append(lines, line)
		}
		return v.Intro + "\n\n" + strings.Join(lines, "\n")
	}

	return ""
}

// listIntro is the sentence above a notes/reminders list, including the empty state.
func listIntro(kind string, count int) string {
	switch {
	case count == 0:
		return fmt.Sprintf(
			"No %ss saved for this page yet. Highlight text on the page to capture one.", kind)
	case count == 1:
		return fmt.Sprintf("You've got **1 %s** here:", kind)
	default:
		return fmt.Sprintf("Here are your **%d %ss**:", count, kind)
	}
}

// formatDueDate renders like JavaScript's toLocaleDateString("en-US") (M/D/YYYY). The model
// sometimes omits the UTC offset, so zone-less layouts are accepted too.
func formatDueDate(raw string) (string, bool) {
	layouts := []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02T15:04", "2006-01-02"}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, raw); err == nil {
			return parsed.Local().Format("1/2/2006"), true
		}
	}
	return "", false
}
