import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getEnv } from "../config/env.ts";
import { schemaStatements } from "./schema.ts";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const { dbPath } = getEnv();
  const absolutePath = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  db = new Database(absolutePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  for (const statement of schemaStatements) {
    db.exec(statement);
  }

  return db;
}

export function closeDb(): void {
  if (!db) {
    return;
  }

  db.close();
  db = null;
}
