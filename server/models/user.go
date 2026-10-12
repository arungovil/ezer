package models

// User is a client-generated identity. The created_at format is SQLite's datetime('now') for
// rows created through the schema default, which clients already receive.
type User struct {
	ID        string `db:"id" json:"id"`
	CreatedAt string `db:"created_at" json:"createdAt"`
}

// Origin is one site (scheme://host[:port]) a user has saved notes on. All paths of a site
// share one chat thread and note list.
type Origin struct {
	ID        string `db:"id" json:"id"`
	UserID    string `db:"user_id" json:"-"`
	Origin    string `db:"origin" json:"origin"`
	CreatedAt string `db:"created_at" json:"createdAt"`
}
