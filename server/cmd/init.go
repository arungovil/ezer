package main

import (
	"fmt"
	"io/fs"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/knadh/goyesql/v2"
	goyesqlx "github.com/knadh/goyesql/v2/sqlx"
	_ "modernc.org/sqlite"

	"ezer/internal/core"
	"ezer/internal/llm"
	"ezer/models"
	"ezer/queries"
)

const (
	defaultPort       = "3000"
	defaultDBPath     = "./data/ezer.sqlite"
	defaultLLMBaseURL = "https://api.deepseek.com"
	defaultLLMModel   = "deepseek-chat"
)

// Config is the runtime configuration, read from the environment.
type Config struct {
	Port       string
	DBPath     string
	LLMAPIKey  string
	LLMBaseURL string
	LLMModel   string
}

// initConfig loads the configuration from environment variables, applying defaults.
func initConfig() *Config {
	return &Config{
		Port:       envOr("PORT", defaultPort),
		DBPath:     envOr("DB_PATH", defaultDBPath),
		LLMAPIKey:  envOr("LLM_API_KEY", ""),
		LLMBaseURL: envOr("LLM_BASE_URL", defaultLLMBaseURL),
		LLMModel:   envOr("LLM_MODEL", defaultLLMModel),
	}
}

// envOr returns the trimmed environment variable, or fallback when it is unset or blank.
func envOr(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

// initApp connects the database, prepares the queries and wires the core.
func initApp(cfg *Config) (*App, error) {
	db, err := initDB(cfg.DBPath)
	if err != nil {
		return nil, fmt.Errorf("database: %w", err)
	}

	q, err := initQueries(db)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("queries: %w", err)
	}

	// The LLM client is optional: without a key, quick actions and tasks still work.
	var llmClient *llm.Client
	if cfg.LLMAPIKey != "" {
		llmClient = llm.NewClient(cfg.LLMBaseURL, cfg.LLMAPIKey, cfg.LLMModel)
	}

	return &App{
		cfg:     cfg,
		db:      db,
		queries: q,
		log:     lo,
		core:    core.New(&core.Opt{DB: db, Queries: q, LLM: llmClient, Log: lo}),
	}, nil
}

// initDB opens the SQLite file (creating its directory) and applies the schema.
func initDB(path string) (*sqlx.DB, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(absolute), 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}

	// Pragmas ride on the DSN because foreign_keys and busy_timeout are per-connection and
	// database/sql opens connections on demand. _txlock=immediate takes the write lock at BEGIN
	// so read-then-write transactions wait on busy_timeout instead of failing with SQLITE_BUSY.
	query := url.Values{
		"_pragma": {"journal_mode(WAL)", "foreign_keys(1)", "busy_timeout(5000)"},
		"_txlock": {"immediate"},
	}
	dsn := (&url.URL{Scheme: "file", Path: absolute, RawQuery: query.Encode()}).String()

	db, err := sqlx.Connect("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	schema, err := queries.FS.ReadFile(queries.SchemaFile)
	if err != nil {
		db.Close()
		return nil, err
	}
	if _, err := db.Exec(string(schema)); err != nil {
		db.Close()
		return nil, fmt.Errorf("apply schema: %w", err)
	}

	return db, nil
}

// initQueries reads every queries/*.sql file and prepares the statements into models.Queries.
func initQueries(db *sqlx.DB) (*models.Queries, error) {
	files, err := fs.Glob(queries.FS, "*.sql")
	if err != nil {
		return nil, err
	}

	all := goyesql.Queries{}
	for _, name := range files {
		if name == queries.SchemaFile {
			continue
		}

		b, err := queries.FS.ReadFile(name)
		if err != nil {
			return nil, err
		}

		parsed, err := goyesql.ParseBytes(b)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}
		for k, v := range parsed {
			all[k] = v
		}
	}

	var q models.Queries
	if err := goyesqlx.ScanToStruct(&q, all, db); err != nil {
		return nil, err
	}

	return &q, nil
}
