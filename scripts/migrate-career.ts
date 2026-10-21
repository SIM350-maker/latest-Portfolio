import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL!;
const sql = neon(databaseUrl);

const MIGRATION_NAME = "001-career-automation-schema";

async function alreadyApplied(): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM _migrations WHERE filename = ${MIGRATION_NAME} LIMIT 1`;
  return rows.length > 0;
}

async function markApplied() {
  await sql`INSERT INTO _migrations (filename, applied_at) VALUES (${MIGRATION_NAME}, NOW())`;
}

async function main() {
  console.log("🚀 Career Automation Centre — Phase 1 migration");
  if (await alreadyApplied()) {
    console.log("✅ Migration already applied, skipping DDL");
    return;
  }

  // ---------------------------------------------------------------------------
  // Job Advert: imported adverts (text + optional original file reference)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS job_advert (
      id BIGSERIAL PRIMARY KEY,
      owner_id BIGINT NOT NULL REFERENCES cms_users(id) ON DELETE RESTRICT,
      source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','pdf','image')),
      original_filename TEXT,
      original_mime TEXT,
      original_bytes BYTEA,
      raw_text TEXT NOT NULL,
      extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'IMPORTED' CHECK (status IN (
        'IMPORTED','ANALYZED','MATCHED','DOCUMENTS_IN_PROGRESS','READY_FOR_REVIEW','APPROVED','SENT','DRAFT','REJECTED','ARCHIVED','FAILED'
      )),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS job_advert_owner_idx ON job_advert(owner_id);`;
  await sql`CREATE INDEX IF NOT EXISTS job_advert_status_idx ON job_advert(status);`;
  await sql`CREATE INDEX IF NOT EXISTS job_advert_created_idx ON job_advert(created_at DESC);`;

  // ---------------------------------------------------------------------------
  // Structured vacancy requirements (normalized from analysis_json)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS job_requirement (
      id BIGSERIAL PRIMARY KEY,
      advert_id BIGINT NOT NULL REFERENCES job_advert(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN (
        'technical_skill','qualification','experience','certification','responsibility','soft_skill','other'
      )),
      requirement_text TEXT NOT NULL,
      is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
      source_span JSONB,
      confidence REAL NOT NULL DEFAULT 1.0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS job_requirement_advert_idx ON job_requirement(advert_id);`;
  await sql`CREATE INDEX IF NOT EXISTS job_requirement_category_idx ON job_requirement(category);`;

  // ---------------------------------------------------------------------------
  // Job Application (top-level container linking advert, owner, and generated artefacts)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS job_application (
      id BIGSERIAL PRIMARY KEY,
      owner_id BIGINT NOT NULL REFERENCES cms_users(id) ON DELETE RESTRICT,
      advert_id BIGINT NOT NULL REFERENCES job_advert(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT','MATCHED','DOCUMENTS_IN_PROGRESS','READY_FOR_REVIEW','APPROVED','SENT','REJECTED','ARCHIVED','FAILED'
      )),
      mode TEXT NOT NULL DEFAULT 'MANUAL' CHECK (mode IN ('MANUAL','AUTOMATED')),
      settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (owner_id, advert_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS job_application_owner_idx ON job_application(owner_id);`;
  await sql`CREATE INDEX IF NOT EXISTS job_application_status_idx ON job_application(status);`;

  // ---------------------------------------------------------------------------
  // Evidence matching results (many-to-many: requirement ↔ professional record)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS application_evidence_match (
      id BIGSERIAL PRIMARY KEY,
      application_id BIGINT NOT NULL REFERENCES job_application(id) ON DELETE CASCADE,
      requirement_id BIGINT NOT NULL REFERENCES job_requirement(id) ON DELETE CASCADE,
      source_table TEXT NOT NULL CHECK (source_table IN (
        'education','experience','project','skill','certification','claim','cv_reference','recommendation'
      )),
      source_id BIGINT NOT NULL,
      match_class TEXT NOT NULL CHECK (match_class IN (
        'STRONG','PARTIAL','TRANSFERABLE','NO_EVIDENCE','REQUIRES_VERIFICATION'
      )),
      evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      reason TEXT,
      recommended_action TEXT,
      verified_by_owner BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (application_id, requirement_id, source_table, source_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS application_evidence_match_app_idx ON application_evidence_match(application_id);`;
  await sql`CREATE INDEX IF NOT EXISTS application_evidence_match_req_idx ON application_evidence_match(requirement_id);`;
  await sql`CREATE INDEX IF NOT EXISTS application_evidence_match_class_idx ON application_evidence_match(match_class);`;

  // ---------------------------------------------------------------------------
  // Document templates (CV, cover letter, email, etc.)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS document_template (
      id BIGSERIAL PRIMARY KEY,
      owner_id BIGINT NOT NULL REFERENCES cms_users(id) ON DELETE RESTRICT,
      type TEXT NOT NULL CHECK (type IN ('CV','COVER_LETTER','EMAIL','OTHER')),
      name TEXT NOT NULL,
      description TEXT,
      content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS document_template_owner_type_idx ON document_template(owner_id, type);`;

  // ---------------------------------------------------------------------------
  // Generated documents (versioned, editable, provenance-tracked)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS generated_document (
      id BIGSERIAL PRIMARY KEY,
      application_id BIGINT NOT NULL REFERENCES job_application(id) ON DELETE CASCADE,
      template_id BIGINT REFERENCES document_template(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('CV','COVER_LETTER','EMAIL','OTHER')),
      title TEXT NOT NULL,
      content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      html_content TEXT,
      pdf_bytes BYTEA,
      docx_bytes BYTEA,
      txt_content TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','GENERATED','EDITED','REVIEWED','APPROVED')),
      provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS generated_document_app_idx ON generated_document(application_id);`;
  await sql`CREATE INDEX IF NOT EXISTS generated_document_type_idx ON generated_document(type);`;
  await sql`CREATE INDEX IF NOT EXISTS generated_document_status_idx ON generated_document(status);`;

  // ---------------------------------------------------------------------------
  // Application package (assembled, approved, ready to send)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS application_package (
      id BIGSERIAL PRIMARY KEY,
      application_id BIGINT NOT NULL REFERENCES job_application(id) ON DELETE CASCADE,
      cv_document_id BIGINT REFERENCES generated_document(id) ON DELETE SET NULL,
      cover_letter_document_id BIGINT REFERENCES generated_document(id) ON DELETE SET NULL,
      email_document_id BIGINT REFERENCES generated_document(id) ON DELETE SET NULL,
      attachment_ids BIGINT[] NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'ASSEMBLING' CHECK (status IN (
        'ASSEMBLING','READY_FOR_REVIEW','APPROVED','SENDING','SENT','FAILED'
      )),
      approval_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      approved_at TIMESTAMPTZ,
      approved_by BIGINT REFERENCES cms_users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS application_package_app_idx ON application_package(application_id);`;
  await sql`CREATE INDEX IF NOT EXISTS application_package_status_idx ON application_package(status);`;

  // ---------------------------------------------------------------------------
  // Attachments (supporting documents referenced by packages)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS application_attachment (
      id BIGSERIAL PRIMARY KEY,
      owner_id BIGINT NOT NULL REFERENCES cms_users(id) ON DELETE RESTRICT,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_bytes BYTEA NOT NULL,
      sha256 TEXT NOT NULL,
      category TEXT CHECK (category IN ('certificate','transcript','portfolio','reference','id_document','other')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (owner_id, sha256)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS application_attachment_owner_idx ON application_attachment(owner_id);`;

  // ---------------------------------------------------------------------------
  // Email delivery attempts (idempotent, auditable)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS email_delivery_attempt (
      id BIGSERIAL PRIMARY KEY,
      package_id BIGINT NOT NULL REFERENCES application_package(id) ON DELETE CASCADE,
      provider TEXT NOT NULL CHECK (provider IN ('console','resend','smtp','other')),
      provider_message_id TEXT,
      to_email TEXT NOT NULL,
      cc_email TEXT[],
      bcc_email TEXT[],
      subject TEXT NOT NULL,
      body_text TEXT NOT NULL,
      body_html TEXT,
      attachment_sha256s TEXT[] NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN (
        'QUEUED','SENT','DELIVERED','BOUNCED','REJECTED','DEFERRED','FAILED','SIMULATED'
      )),
      error_code TEXT,
      error_message TEXT,
      idempotency_key TEXT NOT NULL,
      sent_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (idempotency_key)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS email_delivery_package_idx ON email_delivery_attempt(package_id);`;
  await sql`CREATE INDEX IF NOT EXISTS email_delivery_status_idx ON email_delivery_attempt(status);`;
  await sql`CREATE INDEX IF NOT EXISTS email_delivery_idem_idx ON email_delivery_attempt(idempotency_key);`;

  // ---------------------------------------------------------------------------
  // Automation settings (owner-controlled preferences)
  // ---------------------------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS automation_settings (
      owner_id BIGINT PRIMARY KEY REFERENCES cms_users(id) ON DELETE CASCADE,
      default_cv_template_id BIGINT REFERENCES document_template(id) ON DELETE SET NULL,
      default_cover_letter_template_id BIGINT REFERENCES document_template(id) ON DELETE SET NULL,
      default_email_template_id BIGINT REFERENCES document_template(id) ON DELETE SET NULL,
      preferred_formats TEXT[] NOT NULL DEFAULT ARRAY['PDF','DOCX','TXT'],
      ai_provider TEXT,
      ai_model TEXT,
      ai_base_url TEXT,
      email_provider TEXT DEFAULT 'console',
      email_from_address TEXT,
      email_from_name TEXT,
      generation_limit_daily INTEGER DEFAULT 50,
      require_approval_before_send BOOLEAN NOT NULL DEFAULT TRUE,
      retain_documents_days INTEGER DEFAULT 365,
      qualification_display_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Seed default templates for the owner (id=1, Simon Ipara)
  const ownerResult = await sql`SELECT id FROM cms_users WHERE email = 'simonipara428@gmail.com' LIMIT 1`;
  const ownerId = ownerResult.length > 0 ? ownerResult[0].id : 1;

  // Default CV template
  await sql`
    INSERT INTO document_template (owner_id, type, name, description, content_json, is_default, created_at, updated_at)
    VALUES (
      ${ownerId}, 'CV', 'Professional ATS', 'Clean single-column ATS-friendly layout',
      '{"sections":["contact","summary","skills","experience","education","projects","certifications"],"theme":"professional"}'::jsonb,
      TRUE, NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  `;

  // Default cover letter template
  await sql`
    INSERT INTO document_template (owner_id, type, name, description, content_json, is_default, created_at, updated_at)
    VALUES (
      ${ownerId}, 'COVER_LETTER', 'Standard Professional', 'Classic business letter format',
      '{"format":"business_letter","tone":"professional"}'::jsonb,
      TRUE, NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  `;

  // Default email template
  await sql`
    INSERT INTO document_template (owner_id, type, name, description, content_json, is_default, created_at, updated_at)
    VALUES (
      ${ownerId}, 'EMAIL', 'Application Email', 'Concise application email with attachment references',
      '{"greeting":"Dear Hiring Manager,","closing":"Sincerely,\\\\n[Name]","include_attachment_list":true}'::jsonb,
      TRUE, NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  `;

  // Default automation settings
  await sql`
    INSERT INTO automation_settings (owner_id, created_at, updated_at)
    VALUES (${ownerId}, NOW(), NOW())
    ON CONFLICT (owner_id) DO UPDATE SET updated_at = NOW();
  `;

  await markApplied();
  console.log("✅ Career Automation migration applied and recorded");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});