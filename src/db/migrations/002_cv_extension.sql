-- 002_cv_extension (SQLite dialect) — mirrors scripts/cv-populate/002_cv_extension.pg.sql.
-- Applied by the SQLite migration runner (src/config/database.js) once, tracked in _migrations.

ALTER TABLE profile ADD COLUMN email TEXT;
ALTER TABLE profile ADD COLUMN location TEXT;
ALTER TABLE profile ADD COLUMN phone TEXT;
ALTER TABLE profile ADD COLUMN github TEXT;
ALTER TABLE profile ADD COLUMN portfolio TEXT;
ALTER TABLE profile ADD COLUMN linkedin TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_email ON profile (email);

ALTER TABLE skill ADD COLUMN category TEXT;

ALTER TABLE experience ADD COLUMN is_current INTEGER NOT NULL DEFAULT 0;
ALTER TABLE experience ADD COLUMN location TEXT;

ALTER TABLE project ADD COLUMN deploy_url TEXT;
ALTER TABLE project ADD COLUMN profile_id INTEGER REFERENCES profile(id) ON DELETE CASCADE;

ALTER TABLE education ADD COLUMN grade TEXT;

CREATE TABLE IF NOT EXISTS person_skills (
    person_id INTEGER NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (person_id, skill_id)
);

CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cv_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    organization TEXT,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS population_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    column_name TEXT,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_certifications_timestamp
AFTER UPDATE ON certifications
FOR EACH ROW
BEGIN
    UPDATE certifications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_recommendations_timestamp
AFTER UPDATE ON recommendations
FOR EACH ROW
BEGIN
    UPDATE recommendations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
