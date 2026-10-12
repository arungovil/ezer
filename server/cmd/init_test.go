package main

import (
	"path/filepath"
	"testing"
)

// A data directory with spaces or URI metacharacters must not break the DSN.
func TestInitDBPathWithSpecialCharacters(t *testing.T) {
	db, err := initDB(filepath.Join(t.TempDir(), "my data #1?", "ezer.sqlite"))
	if err != nil {
		t.Fatalf("initDB: %v", err)
	}
	defer db.Close()

	if _, err := initQueries(db); err != nil {
		t.Fatalf("initQueries: %v", err)
	}
}
