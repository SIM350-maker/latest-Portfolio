-- 005_contact_messages (SQLite dialect) — inbound contact form storage (module I).
-- handled: admin workflow flag. Honeypot spam drops never reach this table.

CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    handled    INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    handled_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_handled ON contact_messages (handled);
