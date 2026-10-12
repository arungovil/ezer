package main

import "net/http"

// GetUser retrieves the user for the request's user ID.
func (a *App) GetUser(w http.ResponseWriter, r *http.Request) {
	out, err := a.core.GetUser(getUserID(r))
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// PutUser creates the user, or revives a soft-deleted one.
func (a *App) PutUser(w http.ResponseWriter, r *http.Request) {
	out, err := a.core.UpsertUser(getUserID(r))
	if err != nil {
		a.respondErr(w, err)
		return
	}

	writeJSON(w, http.StatusOK, out)
}

// DeleteUser soft-deletes the user and everything they own.
func (a *App) DeleteUser(w http.ResponseWriter, r *http.Request) {
	if err := a.core.DeleteUser(getUserID(r)); err != nil {
		a.respondErr(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
