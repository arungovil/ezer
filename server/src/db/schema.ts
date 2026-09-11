export const migrations = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      tab_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, tab_url)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      role TEXT NOT NULL CHECK(role IN ('user', 'ezer')),
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
    ON messages(conversation_id, created_at);
  `,
  `
    CREATE TABLE IF NOT EXISTS captures (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      raw_text TEXT NOT NULL,
      source_url TEXT,
      source_title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      capture_id TEXT NOT NULL REFERENCES captures(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL CHECK(kind IN ('task', 'reminder', 'note')),
      title TEXT NOT NULL,
      due_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'done', 'dismissed')),
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_items_user_status_due
    ON items(user_id, status, due_at);
  `,
] as const;
