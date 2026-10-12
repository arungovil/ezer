package core

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"slices"

	"ezer/models"
)

// chatHistoryLimit is how many recent text turns are fed back to the model.
const chatHistoryLimit = 6

// GetChats gets the full visible conversation for the site of tabURL, oldest first.
func (c *Core) GetChats(userID, tabURL string) (models.ChatListResponse, error) {
	pageOrigin, err := parsePageOrigin(tabURL)
	if err != nil {
		return models.ChatListResponse{}, newHTTPError(http.StatusBadRequest, errInvalidTabURL)
	}

	out := models.ChatListResponse{TabURL: tabURL, Messages: []models.Chat{}}

	var origin models.Origin
	if err := c.q.GetOrigin.Get(&origin, userID, pageOrigin); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return out, nil
		}
		return models.ChatListResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "fetching origin", err)
	}

	if err := c.q.QueryChats.Select(&out.Messages, origin.ID); err != nil {
		return models.ChatListResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "fetching chats", err)
	}

	out.OriginID, out.Origin = &origin.ID, &origin.Origin
	return out, nil
}

// Chat handles one turn. With an action it renders a server-side reply and never touches the
// LLM; otherwise it runs the classify -> retrieve -> answer pipeline. Turns are persisted only
// after the assistant succeeds, so a failed model call leaves no orphaned user message.
func (c *Core) Chat(userID string, req models.ChatRequest) (models.ChatResponse, error) {
	pageOrigin, err := parsePageOrigin(req.TabURL)
	if err != nil {
		return models.ChatResponse{}, newHTTPError(http.StatusBadRequest, errInvalidTabURL)
	}

	if req.Action == "" && c.llm == nil {
		return models.ChatResponse{}, newHTTPError(http.StatusServiceUnavailable,
			errLLMNotConfigured)
	}

	origin, err := c.getOrCreateOrigin(userID, pageOrigin)
	if err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "creating origin", err)
	}

	userMsgID, err := newUUID()
	if err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "generating UUID", err)
	}
	ezerMsgID, err := newUUID()
	if err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "generating UUID", err)
	}

	if req.Action != "" {
		return c.chatQuickAction(userID, origin, req, userMsgID, ezerMsgID)
	}

	var history []models.Chat
	if err := c.q.QueryRecentTextChats.Select(&history, origin.ID, chatHistoryLimit); err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "fetching chat history", err)
	}
	slices.Reverse(history)

	reply, err := c.answerFromNotes(origin.ID, userID, req.Message, history)
	if err != nil {
		// Model or retrieval failure: nothing was saved, so the client can retry the message.
		return models.ChatResponse{}, c.serverError(http.StatusBadGateway, errLLMFailed,
			"answering chat", err)
	}

	var agentState *string
	if reply.State != nil {
		encoded, err := json.Marshal(reply.State)
		if err != nil {
			return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
				errRequestFailed, "encoding agent state", err)
		}
		agentState = nonEmpty(string(encoded))
	}

	if err := c.insertChatPair(origin.ID, models.ChatTypeText, userMsgID, req.Message,
		ezerMsgID, reply.Reply, agentState); err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "saving chat", err)
	}

	return models.ChatResponse{
		OriginID:      origin.ID,
		Origin:        origin.Origin,
		Reply:         reply.Reply,
		Rejected:      reply.Rejected,
		UserMessageID: userMsgID,
		EzerMessageID: ezerMsgID,
	}, nil
}

// chatQuickAction answers /notes, /reminders and /help straight from the database.
func (c *Core) chatQuickAction(
	userID string,
	origin models.Origin,
	req models.ChatRequest,
	userMsgID, ezerMsgID string,
) (models.ChatResponse, error) {
	content, err := c.quickActionContent(userID, origin, req.Action)
	if err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "building quick action", err)
	}

	serialized, err := json.Marshal(content)
	if err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "encoding quick action", err)
	}

	if err := c.insertChatPair(origin.ID, models.ChatTypeQuickAction, userMsgID, req.Message,
		ezerMsgID, string(serialized), nil); err != nil {
		return models.ChatResponse{}, c.serverError(http.StatusInternalServerError,
			errRequestFailed, "saving chat", err)
	}

	return models.ChatResponse{
		OriginID:      origin.ID,
		Origin:        origin.Origin,
		Reply:         plainText(content),
		UserMessageID: userMsgID,
		EzerMessageID: ezerMsgID,
		Content:       content,
	}, nil
}

// DeleteChat soft-deletes a message the user owns. Unknown and foreign messages are
// indistinguishable on purpose, and a capture message that still owns a task is refused.
func (c *Core) DeleteChat(userID, id string) error {
	var chat models.Chat
	if err := c.q.GetChatForUser.Get(&chat, id, userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return newHTTPError(http.StatusNotFound, errChatNotFound)
		}
		return c.serverError(http.StatusInternalServerError, errRequestFailed,
			"fetching chat", err)
	}

	var linked bool
	if err := c.q.TaskExistsForChat.Get(&linked, id); err != nil {
		return c.serverError(http.StatusInternalServerError, errRequestFailed,
			"checking linked task", err)
	}
	if linked {
		return newHTTPError(http.StatusConflict, errChatHasLinkedTask)
	}

	res, err := c.q.DeleteChat.Exec(now(), id)
	if err != nil {
		return c.serverError(http.StatusInternalServerError, errRequestFailed,
			"deleting chat", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return newHTTPError(http.StatusNotFound, errChatNotFound)
	}

	return nil
}

// insertChat stores one chat message.
func (c *Core) insertChat(
	id, originID, role, messageType, content string,
	agentState *string,
) error {
	_, err := c.q.InsertChat.Exec(id, originID, role, messageType, content, agentState, now())
	return err
}

// insertChatPair stores a user message followed by the ezer reply.
func (c *Core) insertChatPair(
	originID, messageType, userMsgID, userContent, ezerMsgID, ezerContent string,
	agentState *string,
) error {
	if err := c.insertChat(userMsgID, originID, models.ChatRoleUser, messageType, userContent,
		nil); err != nil {
		return err
	}
	return c.insertChat(ezerMsgID, originID, models.ChatRoleEzer, messageType, ezerContent,
		agentState)
}
