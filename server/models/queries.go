package models

import "github.com/jmoiron/sqlx"

// Queries contains all prepared SQL statements, filled by goyesql from queries/*.sql: each
// field's `query` tag is the `-- name:` of a query.
type Queries struct {
	GetUser           *sqlx.Stmt `query:"get-user"`
	UpsertUser        *sqlx.Stmt `query:"upsert-user"`
	DeleteUserOrigins *sqlx.Stmt `query:"delete-user-origins"`
	DeleteUserChats   *sqlx.Stmt `query:"delete-user-chats"`
	DeleteUserTasks   *sqlx.Stmt `query:"delete-user-tasks"`
	DeleteUser        *sqlx.Stmt `query:"delete-user"`

	UpsertOrigin *sqlx.Stmt `query:"upsert-origin"`
	GetOrigin    *sqlx.Stmt `query:"get-origin"`

	InsertChat           *sqlx.Stmt `query:"insert-chat"`
	GetChatForUser       *sqlx.Stmt `query:"get-chat-for-user"`
	QueryChats           *sqlx.Stmt `query:"query-chats"`
	QueryRecentTextChats *sqlx.Stmt `query:"query-recent-text-chats"`
	DeleteChat           *sqlx.Stmt `query:"delete-chat"`

	InsertTask        *sqlx.Stmt `query:"insert-task"`
	GetTask           *sqlx.Stmt `query:"get-task"`
	QueryTasks        *sqlx.Stmt `query:"query-tasks"`
	SearchTasks       *sqlx.Stmt `query:"search-tasks"`
	UpdateTask        *sqlx.Stmt `query:"update-task"`
	TaskExistsForChat *sqlx.Stmt `query:"task-exists-for-chat"`
}
