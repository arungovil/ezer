// Package queries embeds the SQL the server runs: the schema and the named queries (one file per
// table) that cmd loads with goyesql and prepares into models.Queries.
package queries

import "embed"

//go:embed *.sql
var FS embed.FS

// SchemaFile is the idempotent DDL applied at startup. Every other file in FS is a query file.
const SchemaFile = "schema.sql"
