-- 003_dba_remediation (SQLite dialect) — mirrors the PostgreSQL remediation
-- (scripts/dba/001-dba-remediation.sql) for local SQLite builds.
--
-- SQLite limitations vs the PostgreSQL version, by design:
--   * CHECK constraints cannot be added to existing tables without a table
--     rebuild — URL / claim-pairing / ISO-date rules stay in the application
--     layer for SQLite (production runs PostgreSQL, where the CHECKs exist).
--   * JSON1 functions (bundled with better-sqlite3) power the audit triggers.
--   * changed_by is not populated on SQLite (no session GUC mechanism).

-- FK-column indexes (single-column; SQLite has no partial index IF NOT EXISTS
-- on expressions, so plain indexes are used)
CREATE INDEX IF NOT EXISTS idx_experience_profile_id        ON experience (profile_id);
CREATE INDEX IF NOT EXISTS idx_education_profile_id         ON education (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_profile_id           ON project (profile_id);
CREATE INDEX IF NOT EXISTS idx_person_skills_skill_id       ON person_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_project_skill_skill_id       ON project_skill (skill_id);
CREATE INDEX IF NOT EXISTS idx_project_evidence_evidence_id ON project_evidence (evidence_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_evidence_id   ON skill_evidence (evidence_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_evidence_id   ON claim_evidence (evidence_id);

-- Case-insensitive skill-name uniqueness (SQLite has no lower() expression
-- indexes in older builds; enforced via trigger instead)
CREATE TRIGGER IF NOT EXISTS trg_skill_name_unique_insert
BEFORE INSERT ON skill
WHEN EXISTS (SELECT 1 FROM skill WHERE lower(name) = lower(NEW.name))
BEGIN
    SELECT RAISE(ABORT, 'A skill with this name already exists.');
END;

CREATE TRIGGER IF NOT EXISTS trg_skill_name_unique_update
BEFORE UPDATE OF name ON skill
WHEN EXISTS (SELECT 1 FROM skill WHERE lower(name) = lower(NEW.name) AND id != NEW.id)
BEGIN
    SELECT RAISE(ABORT, 'A skill with this name already exists.');
END;

-- Evidence soft delete (verification chain preservation)
ALTER TABLE evidence ADD COLUMN deleted_at DATETIME;
CREATE INDEX IF NOT EXISTS idx_evidence_deleted_at ON evidence (deleted_at) WHERE deleted_at IS NULL;

-- cv_references audit-column parity
ALTER TABLE cv_references ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER IF NOT EXISTS update_cv_references_timestamp
AFTER UPDATE ON cv_references
FOR EACH ROW
BEGIN
    UPDATE cv_references SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name   TEXT    NOT NULL,
    row_id       INTEGER,
    action       TEXT    NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    changed_by   TEXT,
    changed_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_data     TEXT,
    new_data     TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_row ON audit_log (table_name, row_id, changed_at DESC);

CREATE TRIGGER IF NOT EXISTS audit_profile_insert AFTER INSERT ON profile
BEGIN INSERT INTO audit_log (table_name, row_id, action, new_data)
VALUES ('profile', NEW.id, 'INSERT', json_object('name', NEW.name, 'role', NEW.role)); END;
CREATE TRIGGER IF NOT EXISTS audit_skill_insert AFTER INSERT ON skill
BEGIN INSERT INTO audit_log (table_name, row_id, action, new_data)
VALUES ('skill', NEW.id, 'INSERT', json_object('name', NEW.name)); END;
CREATE TRIGGER IF NOT EXISTS audit_skill_delete AFTER DELETE ON skill
BEGIN INSERT INTO audit_log (table_name, row_id, action, old_data)
VALUES ('skill', OLD.id, 'DELETE', json_object('name', OLD.name)); END;
CREATE TRIGGER IF NOT EXISTS audit_project_insert AFTER INSERT ON project
BEGIN INSERT INTO audit_log (table_name, row_id, action, new_data)
VALUES ('project', NEW.id, 'INSERT', json_object('title', NEW.title)); END;
CREATE TRIGGER IF NOT EXISTS audit_project_delete AFTER DELETE ON project
BEGIN INSERT INTO audit_log (table_name, row_id, action, old_data)
VALUES ('project', OLD.id, 'DELETE', json_object('title', OLD.title)); END;
CREATE TRIGGER IF NOT EXISTS audit_evidence_delete AFTER DELETE ON evidence
BEGIN INSERT INTO audit_log (table_name, row_id, action, old_data)
VALUES ('evidence', OLD.id, 'DELETE', json_object('description', OLD.description)); END;
