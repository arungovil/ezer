# Ezer

Record real interactions, compile them into a validated workflow AST with an LLM, and replay them via synthetic DOM events.

## Getting started

### Prerequisites

- Node.js ≥ 20
- Chrome (or any Chromium browser supporting Manifest V3 side panels)

### Setup

```bash
# Install all dependencies (root, client, server)
npm run setup

```

### Development

```bash

# Build the extension and watch for changes
npm run dev:client
```

Then load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `client/` directory
4. Pin Ezer to your toolbar and click the icon to open the side panel

### Build

```bash
npm run build
```

## Tech stack

| Layer       | Tech                                            |
| ----------- | ----------------------------------------------- |
| Extension   | Manifest V3, Lit 3 (web components), TypeScript |
| Server      | Express 4, TypeScript                           |
| Bundler     | esbuild (client)                                |
| Lint/format | Biome                                           |
| CI hooks    | Husky + lint-staged                             |

## Status

Early-stage prototype. The recording and replay pipeline works end-to-end in the extension. Pending work is tracked on the [issues tab](https://codeberg.org/arungovil/ezer/issues).
