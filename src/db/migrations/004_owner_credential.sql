-- 004_owner_credential (SQLite dialect) — credential rotation support.
-- The active credential hash lives in the database (supersedes the
-- OWNER_BCRYPT_HASH bootstrap value in the environment). When this table is
-- empty the environment hash remains the active credential (break-glass).

CREATE TABLE IF NOT EXISTS owner_credential (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    password_hash TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_owner_credential_timestamp
AFTER UPDATE ON owner_credential
FOR EACH ROW
BEGIN
    UPDATE owner_credential SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
