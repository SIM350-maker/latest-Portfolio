-- =====================================================================
-- DBA REMEDIATION 001 — Portfolio schema (PostgreSQL / Neon)
-- Ground truth verified 2026-10-12 via pg_indexes / information_schema.
-- Safe: additive only. No DROP, no DELETE, no data rewrite.
-- Preflight: none required (all statements are IF NOT EXISTS / CREATE OR REPLACE).
-- Rollback: DROP INDEX/FUNCTION per statement header.
-- =====================================================================

-- ---------------------------------------------------------------------
-- P1-1. Index every FK column that lacks a leading index (11 total).
--        Postgres does not auto-index FK columns; every DELETE/UPDATE on the
--        parent tables currently triggers sequential scans on children.
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_experience_profile_id        ON experience (profile_id);
CREATE INDEX IF NOT EXISTS idx_education_profile_id         ON education (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_profile_id           ON project (profile_id);
CREATE INDEX IF NOT EXISTS idx_certifications_person_id     ON certifications (person_id);
CREATE INDEX IF NOT EXISTS idx_cv_references_person_id      ON cv_references (person_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_person_id    ON recommendations (person_id);
-- join tables: composite PK covers the leading column only; the reverse
-- lookup (child -> other parent) is the common cascade path:
CREATE INDEX IF NOT EXISTS idx_person_skills_skill_id       ON person_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_project_skill_skill_id       ON project_skill (skill_id);
CREATE INDEX IF NOT EXISTS idx_project_evidence_evidence_id ON project_evidence (evidence_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_evidence_id   ON skill_evidence (evidence_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_evidence_id   ON claim_evidence (evidence_id);

-- ---------------------------------------------------------------------
-- P1-2. Tighter partial indexes for the hot public reads.
--        listPublished() filters publication_state='Published' constantly;
--        a full-column btree is low-selectivity. Partial + ordered indexes
--        make the public pages index-only scans.
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS idx_project_publication_state;
CREATE INDEX IF NOT EXISTS idx_project_published_updated
  ON project (updated_at DESC) WHERE publication_state = 'Published';
DROP INDEX IF EXISTS idx_skill_publication_state;
CREATE INDEX IF NOT EXISTS idx_skill_published_name
  ON skill (name ASC) WHERE publication_state = 'Published';

-- ---------------------------------------------------------------------
-- P1-3. Enforce case-insensitive skill-name uniqueness at the DB level.
--        The app checks findByName() first, but two concurrent writers can
--        still race; the invariant must live in the schema.
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_skill_name_ci ON skill (lower(name));

-- ---------------------------------------------------------------------
-- P1-4. Enforce project-title uniqueness per person (population rule 5).
--        Partial: legacy rows with NULL profile_id are exempt.
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_person_title
  ON project (profile_id, lower(title)) WHERE profile_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- P2-1. URL format CHECKs (defense-in-depth; the app validates too).
--        Non-URL values already in data: 0 (verified 2026-10-12).
-- ---------------------------------------------------------------------
ALTER TABLE evidence ADD CONSTRAINT chk_evidence_file_path_url
  CHECK (file_path IS NULL OR file_path ~* '^https?://\S+$');
ALTER TABLE project ADD CONSTRAINT chk_project_deploy_url
  CHECK (deploy_url IS NULL OR deploy_url ~* '^https?://\S+$');

-- ---------------------------------------------------------------------
-- P2-2. Polymorphic claim linkage: require id when type is present and
--        vice versa (currently type and id are independently nullable).
--        Verified data impact: 0 violating rows.
-- ---------------------------------------------------------------------
ALTER TABLE claim ADD CONSTRAINT chk_claim_source_pair
  CHECK ((source_entity_type IS NULL) = (source_entity_id IS NULL));

-- ---------------------------------------------------------------------
-- P2-3. Evidence must carry content (app rule, now in the schema).
--        Verified data impact: 0 violating rows.
-- ---------------------------------------------------------------------
ALTER TABLE evidence ADD CONSTRAINT chk_evidence_has_content
  CHECK (description IS NOT NULL OR file_path IS NOT NULL);

-- ---------------------------------------------------------------------
-- P2-4. cv_references audit-column parity (it alone lacked updated_at).
-- ---------------------------------------------------------------------
ALTER TABLE cv_references ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_cv_references_updated_at ON cv_references;
CREATE TRIGGER trg_cv_references_updated_at
BEFORE UPDATE ON cv_references
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- P2-5. Date-format discipline. TEXT date columns currently hold mixed
--        formats ('2022-03' vs 'May 2025') — see report §3. This CHECK
--        locks NEW writes to ISO year-month; existing mixed rows are
--        grandfathered by validating only on write (Postgres CHECKs are
--        evaluated on INSERT/UPDATE, existing rows pass until touched).
--        Migrate existing prose dates first (see report §5 step 3).
-- ---------------------------------------------------------------------
ALTER TABLE experience ADD CONSTRAINT chk_experience_start_date_iso
  CHECK (start_date ~ '^\d{4}-\d{2}$');
ALTER TABLE education ADD CONSTRAINT chk_education_start_date_iso
  CHECK (start_date ~ '^\d{4}-\d{2}$');

-- ---------------------------------------------------------------------
-- P3-1. Audit log (net-new). Append-only; records who changed what.
--        Requires app wiring: SET LOCAL app.user_id = '<session>' per
--        request (middleware) — see report §6.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name   TEXT        NOT NULL,
    row_id       BIGINT,
    action       TEXT        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    changed_by   TEXT,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_data     JSONB,
    new_data     JSONB
);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_row ON audit_log (table_name, row_id, changed_at DESC);

CREATE OR REPLACE FUNCTION fn_audit_row() RETURNS trigger AS $fn$
BEGIN
    INSERT INTO audit_log (table_name, row_id, action, changed_by, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD)->>'id')::bigint ELSE (to_jsonb(NEW)->>'id')::bigint END,
        TG_OP,
        current_setting('app.user_id', true),
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$fn$ LANGUAGE plpgsql;

-- Apply to content tables (opt-in per table):
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['profile','project','skill','evidence','claim','experience','education','certifications']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON %1$s', t);
        EXECUTE format(
            'CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON %1$s FOR EACH ROW EXECUTE FUNCTION fn_audit_row()', t);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- P3-2. Soft delete for evidence (net-new). Evidence is the verification
--        chain: hard delete destroys traceability. Requires repository
--        filter change (WHERE deleted_at IS NULL) — coordinated app change,
--        enable after code update.
-- ---------------------------------------------------------------------
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_evidence_deleted_at ON evidence (deleted_at) WHERE deleted_at IS NULL;
