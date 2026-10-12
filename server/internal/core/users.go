package core

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/jmoiron/sqlx"

	"ezer/models"
)

// GetUser gets a user by ID.
func (c *Core) GetUser(id string) (models.User, error) {
	var out models.User
	if err := c.q.GetUser.Get(&out, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, newHTTPError(http.StatusNotFound, errUserNotFound)
		}
		return models.User{}, c.serverError(http.StatusInternalServerError, errRequestFailed,
			"fetching user", err)
	}

	return out, nil
}

// UpsertUser creates the user, or revives a soft-deleted one.
func (c *Core) UpsertUser(id string) (models.User, error) {
	var out models.User
	if err := c.q.UpsertUser.Get(&out, id); err != nil {
		return models.User{}, c.serverError(http.StatusInternalServerError, errUserPersistFailed,
			"upserting user", err)
	}

	return out, nil
}

// DeleteUser soft-deletes a user along with their origins, chats and tasks.
func (c *Core) DeleteUser(id string) error {
	tx, err := c.db.Beginx()
	if err != nil {
		return c.serverError(http.StatusInternalServerError, errRequestFailed, "deleting user", err)
	}
	defer tx.Rollback()

	var user models.User
	if err := tx.Stmtx(c.q.GetUser).Get(&user, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return newHTTPError(http.StatusNotFound, errUserNotFound)
		}
		return c.serverError(http.StatusInternalServerError, errRequestFailed, "deleting user", err)
	}

	deletedAt := now()
	for _, stmt := range []*sqlx.Stmt{
		c.q.DeleteUserOrigins, c.q.DeleteUserChats, c.q.DeleteUserTasks, c.q.DeleteUser,
	} {
		if _, err := tx.Stmtx(stmt).Exec(deletedAt, id); err != nil {
			return c.serverError(http.StatusInternalServerError, errRequestFailed,
				"deleting user", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return c.serverError(http.StatusInternalServerError, errRequestFailed, "deleting user", err)
	}
	return nil
}
