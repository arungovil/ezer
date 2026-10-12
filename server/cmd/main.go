package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"

	"ezer/internal/core"
	"ezer/models"
)

const shutdownTimeout = 15 * time.Second

// App contains the "global" shared components, controllers and fields.
type App struct {
	cfg     *Config
	db      *sqlx.DB
	queries *models.Queries
	core    *core.Core
	log     *log.Logger
}

// lo is the app-wide logger, with file:line so a 5xx points at its source.
var lo = log.New(os.Stdout, "", log.Ldate|log.Ltime|log.Lshortfile)

func main() {
	if err := run(); err != nil {
		lo.Fatal(err)
	}
}

// run owns every resource so deferred cleanup (closing the database) always executes; main
// only turns the returned error into an exit code.
func run() error {
	// A missing .env is normal (production sets real environment variables).
	_ = godotenv.Load()

	app, err := initApp(initConfig())
	if err != nil {
		return err
	}
	defer app.db.Close()

	if app.cfg.LLMAPIKey == "" {
		lo.Print("LLM_API_KEY is not set: /captures and typed /chat will answer 503")
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	initHTTPHandlers(r, app)

	server := &http.Server{
		Addr:              ":" + app.cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// ListenAndServe returns as soon as Shutdown begins, so wait for the drain to finish before
	// returning and closing the database under in-flight requests.
	drained := make(chan error, 1)
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()
		drained <- server.Shutdown(shutdownCtx)
	}()

	lo.Printf("listening on %s", server.Addr)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	if err := <-drained; err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}
	return nil
}
