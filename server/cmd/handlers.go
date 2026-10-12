package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"ezer/internal/core"
)

const (
	// stdInputMaxLen is the maximum allowed length for a standard input field.
	stdInputMaxLen = 2000

	// textMaxLen is the maximum allowed length for a captured selection.
	textMaxLen = 100000

	// maxBodyBytes caps a request body.
	maxBodyBytes = 1 << 20

	// defaultChatPageSize and maxChatPageSize bound one GET /chat page.
	// TEMP(skeleton-demo): 4 so a short thread already has older pages; restore to 30.
	defaultChatPageSize = 4
	maxChatPageSize     = 100
)

// Client-facing messages for request validation.
const (
	msgCaptureRequired = "text and tabUrl are required"
	msgChatRequired    = "message and tabUrl are required"
	msgTaskRequired    = "kind, title, and tabUrl are required"
	msgTaskUpdate      = "At least one updatable field is required"
	msgTabURLRequired  = "tabUrl query parameter is required"
	msgTaskIDRequired  = "task id is required"
	msgChatIDRequired  = "chat id is required"
	msgInputTooLong    = "Input is too long"
	msgInvalidLimit    = "limit must be a positive integer"
)

// initHTTPHandlers registers HTTP handlers. Routes are mounted at the root, matching the paths
// the extension already calls.
func initHTTPHandlers(r chi.Router, a *App) {
	// The extension calls from a chrome-extension:// origin, so any origin may call; access is
	// gated by the user-id header, not by CORS.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{
			http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch,
			http.MethodDelete, http.MethodOptions,
		},
		AllowedHeaders: []string{"*"},
	}))

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		writeError(w, http.StatusNotFound, "Not found")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, _ *http.Request) {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	})

	r.Get("/health", a.Health)

	// Identity routes only validate the header; the row is managed by the handlers.
	r.Route("/user", func(r chi.Router) {
		r.Use(a.requireUserID)
		r.Get("/", a.GetUser)
		r.Put("/", a.PutUser)
		r.Delete("/", a.DeleteUser)
	})

	// Data routes also upsert the user so first use just works.
	r.Group(func(r chi.Router) {
		r.Use(a.requireUser)

		r.Route("/chat", func(r chi.Router) {
			r.Get("/", a.GetChats)
			r.Post("/", a.PostChat)
			r.Delete("/{id}", a.DeleteChat)
		})

		r.Post("/captures", a.PostCapture)

		r.Route("/task", func(r chi.Router) {
			r.Get("/", a.GetTasks)
			r.Post("/", a.PostTask)
			r.Get("/{id}", a.GetTask)
			r.Patch("/{id}", a.PatchTask)
		})
	})
}

// Health reports that the server is up.
func (a *App) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// writeJSON writes payload as a JSON response.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		lo.Printf("error encoding response: %v", err)
	}
}

// writeError writes {"error": message}.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// respondErr sends an error returned by the core. An *core.HTTPError carries its own status
// and client-safe message; anything else is logged and sent as a generic 500.
func (a *App) respondErr(w http.ResponseWriter, err error) {
	var he *core.HTTPError
	if errors.As(err, &he) {
		writeError(w, he.Code, he.Message)
		return
	}

	a.log.Printf("error: %v", err)
	writeError(w, http.StatusInternalServerError, "Request failed")
}

// bindJSON decodes the request body into dst. Unknown fields are ignored, not rejected: the
// extension and the server ship separately, so a newer client must not break. On failure it
// writes message with status 400 and returns false.
func bindJSON(w http.ResponseWriter, r *http.Request, dst any, message string) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, message)
		return false
	}
	return true
}

// strHasLen checks whether the string's length (in characters) is within min..max.
func strHasLen(str string, min, max int) bool {
	l := utf8.RuneCountInString(str)
	return l >= min && l <= max
}

// trimmedParam returns a trimmed URL path parameter.
func trimmedParam(r *http.Request, name string) string {
	return strings.TrimSpace(chi.URLParam(r, name))
}
