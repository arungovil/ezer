// Package llm is a minimal client for OpenAI-compatible chat completions. Only the one endpoint
// Ezer needs, so there is no SDK dependency to track.
package llm

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	requestTimeout   = 60 * time.Second
	maxResponseBytes = 4 << 20
	maxErrorBodyLen  = 300
)

var ErrEmptyResponse = errors.New("empty LLM response")

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Request struct {
	Messages    []Message
	Temperature *float64
	// JSONObject asks the provider for response_format json_object.
	JSONObject bool
}

type Client struct {
	endpoint string
	apiKey   string
	model    string
	http     *http.Client
}

func NewClient(baseURL, apiKey, model string) *Client {
	return &Client{
		endpoint: strings.TrimRight(baseURL, "/") + "/chat/completions",
		apiKey:   apiKey,
		model:    model,
		http:     &http.Client{Timeout: requestTimeout},
	}
}

type responseFormat struct {
	Type string `json:"type"`
}

type completionRequest struct {
	Model          string          `json:"model"`
	Messages       []Message       `json:"messages"`
	Temperature    *float64        `json:"temperature,omitempty"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
}

type completionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// Complete returns the first choice's text. Non-2xx responses and empty content are errors so
// callers can fall back instead of persisting nothing.
func (c *Client) Complete(req Request) (string, error) {
	payload := completionRequest{
		Model:       c.model,
		Messages:    req.Messages,
		Temperature: req.Temperature,
	}
	if req.JSONObject {
		payload.ResponseFormat = &responseFormat{Type: "json_object"}
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes))
	if err != nil {
		return "", err
	}

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		snippet := string(raw)
		if len(snippet) > maxErrorBodyLen {
			snippet = snippet[:maxErrorBodyLen]
		}
		return "", fmt.Errorf("LLM request failed: %s: %s", resp.Status, snippet)
	}

	var parsed completionResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("decode LLM response: %w", err)
	}
	if len(parsed.Choices) == 0 || parsed.Choices[0].Message.Content == "" {
		return "", ErrEmptyResponse
	}

	return parsed.Choices[0].Message.Content, nil
}
