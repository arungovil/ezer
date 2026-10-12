.PHONY: build run test vet fmt tidy clean

BINARY := ezer-server

# Pure Go (modernc sqlite), so cgo stays off and the binary is portable.
build:
	CGO_ENABLED=0 go build -o $(BINARY) ./cmd

run:
	CGO_ENABLED=0 go run ./cmd

test:
	go test -race ./...

vet:
	go vet ./...

fmt:
	gofmt -w cmd internal

tidy:
	go mod tidy

clean:
	rm -rf $(BINARY)
