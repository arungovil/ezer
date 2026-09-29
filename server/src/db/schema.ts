export const migrations = [
  `
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS origin (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      origin TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      UNIQUE(user_id, origin)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS chat (
      id TEXT PRIMARY KEY,
      origin_id TEXT NOT NULL REFERENCES origin(id),
      role TEXT NOT NULL CHECK(role IN ('user', 'ezer')),
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_chat_origin_created
    ON chat(origin_id, created_at);
  `,
  `
    CREATE TABLE IF NOT EXISTS task (
      id TEXT PRIMARY KEY,
      origin_id TEXT NOT NULL REFERENCES origin(id),
      user_id TEXT NOT NULL REFERENCES user(id),
      chat_id TEXT REFERENCES chat(id),
      kind TEXT NOT NULL CHECK(kind IN ('reminder', 'note')),
      title TEXT NOT NULL,
      summary TEXT,
      due_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'done', 'dismissed')),
      source_url TEXT,
      source_title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_task_user_status_due
    ON task(user_id, status, due_at);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_task_origin_created
    ON task(origin_id, created_at);
  `,
] as const;
