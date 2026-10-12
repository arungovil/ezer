// Package core is the collection of re-usable functions that provide data (DB / CRUD) and
// business operations to the app: users, tasks, chat, captures and the notes-grounded assistant.
// Methods that can fail towards a client return an *HTTPError that handlers can send as is. The
// underlying cause is logged here and never leaves the server.
package core

import (
	"errors"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/jmoiron/sqlx"

	"ezer/internal/llm"
	"ezer/models"
)

// timestampLayout matches JavaScript's Date.toISOString(), which the extension and existing
// rows already use.
const timestampLayout = "2006-01-02T15:04:05.000Z"

// Client-facing error messages.
const (
	errRequestFailed      = "Request failed"
	errInvalidTabURL      = "tabUrl must be a valid page URL"
	errUserNotFound       = "User not found"
	errUserPersistFailed  = "Failed to persist user"
	errTaskNotFound       = "Task not found"
	errTaskPersistFailed  = "Failed to save task"
	errCapturePersistFail = "Failed to save capture"
	errChatNotFound       = "Chat message not found"
	errChatHasLinkedTask  = "Cannot delete a capture message with a linked task"
	errLLMNotConfigured   = "LLM is not configured. Set LLM_API_KEY in .env"
	errLLMFailed          = "Failed to get a response from the language model"
)

// Core represents the Ezer core with all shared, global functions.
type Core struct {
	db  *sqlx.DB
	q   *models.Queries
	llm *llm.Client
	log *log.Logger
}

// Opt contains the controllers required to start the core. LLM may be nil: quick actions and
// the task routes keep working without an API key, and LLM-backed calls answer 503.
type Opt struct {
	DB      *sqlx.DB
	Queries *models.Queries
	LLM     *llm.Client
	Log     *log.Logger
}

// HTTPError is an error with the HTTP status and the client-safe message to send for it.
type HTTPError struct {
	Code    int
	Message string
}

// Error implements the error interface.
func (e *HTTPError) Error() string {
	return e.Message
}

func newHTTPError(code int, message string) *HTTPError {
	return &HTTPError{Code: code, Message: message}
}

// New returns a new instance of the core.
func New(o *Opt) *Core {
	return &Core{db: o.DB, q: o.Queries, llm: o.LLM, log: o.Log}
}

// now returns the current time as an ISO 8601 UTC timestamp with milliseconds.
func now() string {
	return time.Now().UTC().Format(timestampLayout)
}

// newUUID returns a new random UUID string.
func newUUID() (string, error) {
	u, err := uuid.NewV4()
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

// errInvalidPageURL is returned by parsePageOrigin for a URL with no usable origin.
var errInvalidPageURL = errors.New("invalid page URL")

// parsePageOrigin mirrors the browser's URL.origin, which is what the extension groups notes
// by: http(s)/ws(s)/ftp use scheme://host[:port] with default ports dropped, and every other
// scheme (file:, chrome:, about:) has the opaque origin "null".
func parsePageOrigin(raw string) (string, error) {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme == "" {
		return "", errInvalidPageURL
	}

	scheme := strings.ToLower(parsed.Scheme)
	defaultPorts := map[string]string{
		"http": "80", "https": "443", "ws": "80", "wss": "443", "ftp": "21",
	}
	defaultPort, special := defaultPorts[scheme]
	if !special {
		return "null", nil
	}

	host := strings.ToLower(parsed.Hostname())
	if host == "" {
		return "", errInvalidPageURL
	}
	if strings.Contains(host, ":") {
		host = "[" + host + "]"
	}

	if port := parsed.Port(); port != "" && port != defaultPort {
		host += ":" + port
	}

	return scheme + "://" + host, nil
}

// getOrCreateOrigin resolves (and if needed creates or revives) the user's origin row.
func (c *Core) getOrCreateOrigin(userID, pageOrigin string) (models.Origin, error) {
	id, err := newUUID()
	if err != nil {
		return models.Origin{}, err
	}

	var out models.Origin
	err = c.q.UpsertOrigin.Get(&out, id, userID, pageOrigin, now())
	return out, err
}

// truncateRunes cuts s to at most limit characters.
func truncateRunes(s string, limit int) string {
	runes := []rune(s)
	if len(runes) <= limit {
		return s
	}
	return string(runes[:limit])
}

// nonEmpty returns a pointer to s, or nil when s is empty (to store NULL).
func nonEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// serverError logs err with context and returns the client-safe HTTP error.
func (c *Core) serverError(code int, message, what string, err error) *HTTPError {
	c.log.Printf("error %s: %v", what, err)
	return newHTTPError(code, message)
}
