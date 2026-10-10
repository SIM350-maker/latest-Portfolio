PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    summary TEXT NOT NULL,
    contact_info TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    singleton INTEGER NOT NULL DEFAULT 1 CHECK (singleton = 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (singleton)
);

CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    outcomes TEXT,
    roles TEXT,
    technologies TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    file_path TEXT,
    file_type TEXT,
    accessibility_status TEXT NOT NULL DEFAULT 'Public' CHECK (accessibility_status IN ('Public','Private/Restricted','Redacted','Unavailable')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    statement TEXT NOT NULL,
    justification TEXT,
    source_entity_type TEXT CHECK (source_entity_type IN ('profile','project','skill')),
    source_entity_id INTEGER,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_skill (
    project_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_evidence (
    project_id INTEGER NOT NULL,
    evidence_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, evidence_id),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill_evidence (
    skill_id INTEGER NOT NULL,
    evidence_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (skill_id, evidence_id),
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS claim_evidence (
    claim_id INTEGER NOT NULL,
    evidence_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (claim_id, evidence_id),
    FOREIGN KEY (claim_id) REFERENCES claim(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

-- Triggers to maintain updated_at on UPDATE
CREATE TRIGGER IF NOT EXISTS update_profile_timestamp
AFTER UPDATE ON profile
FOR EACH ROW
BEGIN
    UPDATE profile SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_project_timestamp
AFTER UPDATE ON project
FOR EACH ROW
BEGIN
    UPDATE project SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_skill_timestamp
AFTER UPDATE ON skill
FOR EACH ROW
BEGIN
    UPDATE skill SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_evidence_timestamp
AFTER UPDATE ON evidence
FOR EACH ROW
BEGIN
    UPDATE evidence SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_claim_timestamp
AFTER UPDATE ON claim
FOR EACH ROW
BEGIN
    UPDATE claim SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_experience_timestamp
AFTER UPDATE ON experience
FOR EACH ROW
BEGIN
    UPDATE experience SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_education_timestamp
AFTER UPDATE ON education
FOR EACH ROW
BEGIN
    UPDATE education SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_project_publication_state ON project(publication_state);
CREATE INDEX IF NOT EXISTS idx_evidence_accessibility ON evidence(accessibility_status);
CREATE INDEX IF NOT EXISTS idx_skill_publication_state ON skill(publication_state);
CREATE INDEX IF NOT EXISTS idx_claim_publication_state ON claim(publication_state);
CREATE INDEX IF NOT EXISTS idx_claim_source ON claim(source_entity_type, source_entity_id);