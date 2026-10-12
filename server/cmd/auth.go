package main

import (
	"context"
	"net/http"
	"regexp"
	"strings"
)

const (
	userIDHeader      = "X-Ezer-User-Id"
	msgUserIDRequired = "X-Ezer-User-Id header must be a valid UUID"
)

var reUUID = regexp.MustCompile(
	`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type userCtxKey struct{}

// getUserID returns the user ID that requireUserID put on the request context.
func getUserID(r *http.Request) string {
	id, _ := r.Context().Value(userCtxKey{}).(string)
	return id
}

// requireUserID validates the user-id header and puts it on the request context. It does not
// touch the database.
func (a *App) requireUserID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimSpace(r.Header.Get(userIDHeader))
		if !reUUID.MatchString(id) {
			writeError(w, http.StatusUnauthorized, msgUserIDRequired)
			return
		}

		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userCtxKey{}, id)))
	})
}

// requireUser validates the header and additionally upserts the user, so the first request of
// any data route creates the account.
func (a *App) requireUser(next http.Handler) http.Handler {
	return a.requireUserID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := a.core.UpsertUser(getUserID(r)); err != nil {
			a.respondErr(w, err)
			return
		}

		next.ServeHTTP(w, r)
	}))
}
