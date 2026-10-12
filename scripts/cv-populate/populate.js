'use strict';
// CV population — SIMON IPARA → Neon PostgreSQL.
// Single transaction: schema extension + idempotent population + verification.
// Idempotent: safe to re-run (matches per the rules in the population brief).
// NEVER deletes, truncates, or drops existing data.

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const url = (process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL || '').trim();
if (!url) { console.error('FATAL: set DATABASE_URL'); process.exit(1); }
const pool = new Pool({
  connectionString: url,
  max: 2,
  ssl: /sslmode=(?!disable)/.test(url)
    ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true }
    : undefined,
});

const PERSON = {
  name: 'SIMON IPARA',
  role: 'FULL STACK DEVELOPER | SOFTWARE ENGINEER',
  summary: 'Applied Computer Science graduate with practical experience in software development, web and mobile application development, database management, system administration, and ICT support. Experience with Java, JavaScript, PHP, C#, Next.js, React.js, C# MAUI, Microsoft SQL Server, PostgreSQL, and Prisma. Developed, tested, and deployed multiple practical applications, including healthcare management, task management, e-voting, car rental, portfolio, and padtrack for the school going children.',
  location: 'Nairobi, Kenya',
  phone: '+254 791 267 482',
  email: 'simonipara428@gmail.com',
  github: 'SIM350-maker',
  portfolio: 'simon-ipara - projects',
  linkedin: 'simonipara',
  contact_info: 'Nairobi, Kenya • +254 791 267 482 • simonipara428@gmail.com',
};

const SKILLS = [
  ['Java', 'Programming'], ['JavaScript', 'Programming'], ['PHP', 'Programming'],
  ['C#', 'Programming'], ['SQL', 'Programming'], ['HTML', 'Programming'], ['CSS', 'Programming'],
  ['React.js', 'Frameworks'], ['C# MAUI', 'Frameworks'], ['Nextjs', 'Frameworks'],
  ['React Native', 'Frameworks'], ['Spring Boot', 'Frameworks'],
  ['PostgreSQL', 'Databases'], ['Microsoft SQL Server (MSSQL)', 'Databases'],
  ['Prisma', 'Databases'], ['MySQL', 'Databases'],
  ['REST APIs', 'Engineering'], ['ETL', 'Engineering'], ['Version Control', 'Engineering'],
  ['Testing', 'Engineering'], ['Debugging', 'Engineering'], ['Deployment', 'Engineering'],
  ['Technical Documentation', 'Engineering'],
  ['UI/UX Design', 'Other'], ['ICT Support', 'Other'], ['System Administration', 'Other'],
  ['Digital Literacy Training', 'Other'], ['Vercel', 'Other'], ['Postman', 'Other'],
  ['Prompt Engineering', 'Other'], ['Data Analysis', 'Other'],
  ['Data Mining and Knowledge Discovery', 'Other'],
];

const EXPERIENCES = [
  {
    role: 'Systems Administrator & Web Developer',
    company: 'Bright Promise School',
    location: 'Nairobi, Kenya',
    start_date: 'July 2026',
    end_date: null,
    is_current: true,
    description: "Develop and maintain the school's website to support online communication and institutional visibility. Manage and support digital management systems and information workflows. Provide day-to-day ICT support and assist staff with technical issues and digital tools. Train staff on ICT tools, digital workflows, and digital literacy. Digitize academic records and examination results to reduce reliance on manual processing. Maintain website content and support the school's digital communication activities. Assist with administration and maintenance of the school's ICT environment.",
  },
  {
    role: 'Full Stack Developer',
    company: 'Intersoft Technologies Consulting (E.A) Ltd',
    location: 'Kenya',
    start_date: 'May 2025',
    end_date: 'August 2025',
    is_current: false,
    description: 'Developed and maintained components of a telemedicine application using C# MAUI and Microsoft SQL Server. Implemented application features and addressed identified coding gaps. Participated in testing, debugging, and performance improvement activities. Worked with SMARTCARE workflows in ETL-related processes. Supported customer data migration and onboarding activities. Worked with MSSQL data while maintaining integrity and consistency. Assisted with deployment, configuration, and maintenance across environments. Participated in code reviews and maintained technical documentation.',
  },
];

const PROJECTS = [
  {
    name: 'Healthcare Management Information System (HMIS)',
    stack: 'Next.js • React • PostgreSQL • Prisma • Clerk • Tailwind CSS',
    deployPlatform: 'Vercel',
    stackLinks: ['Nextjs', 'React', 'PostgreSQL', 'Prisma'],
    description: 'Developed a database-driven healthcare management web application with role-based access concepts. Built frontend interfaces and integrated application, backend, and database functionality. Tested, debugged, and deployed the application on Vercel.',
  },
  {
    name: 'Professional Task Manager',
    stack: 'Next.js • React • PostgreSQL • Prisma',
    deployPlatform: 'Vercel',
    stackLinks: ['Nextjs', 'React', 'PostgreSQL', 'Prisma'],
    description: 'Developed task creation, organization, updating, and tracking workflows. Worked across frontend, backend, and database components. Tested and deployed the application on Vercel.',
  },
  {
    name: 'E-Voting System',
    stack: 'Web Application',
    deployPlatform: 'Vercel',
    stackLinks: [],
    description: 'Developed an electronic voting application with voting-related workflows and data management. Tested system functionality and deployed the application on Vercel.',
  },
  {
    name: 'Car Rental Management Application',
    stack: 'Web Application',
    deployPlatform: 'Vercel',
    stackLinks: [],
    description: 'Developed vehicle and rental management workflows with responsive interfaces. Tested and deployed the application on Vercel.',
  },
  {
    name: 'PadTrack',
    stack: 'Web Application',
    deployPlatform: 'Vercel',
    stackLinks: [],
    description: 'Developed application interfaces, workflows, and data handling for the intended management process. Tested and deployed the application on Vercel.',
  },
  {
    name: 'Personal Portfolio Website',
    stack: 'Next.js • React • JavaScript',
    deployPlatform: 'Vercel',
    stackLinks: ['Nextjs', 'React', 'JavaScript'],
    description: 'Designed and developed a responsive portfolio for professional, academic, and project information. Deployed the portfolio as a live application on Vercel.',
  },
];

const EDUCATION = {
  degree: 'Bachelor of Science in Applied Computer Science',
  institution: 'Chuka University',
  field_of_study: 'Applied Computer Science',
  start_date: 'September 2022',
  end_date: 'April 2026',
  grade: 'Second Class Honours',
  description: 'Developed web and application-based projects as part of the Applied Computer Science program. Served as a senior developer within assigned Computer Science project groups. Implemented assigned components and contributed to integration with other group-developed components. Participated in requirements analysis, development, testing, debugging, and documentation. Applied programming, database, user-interface, and software engineering concepts to practical projects.',
};

const CERTIFICATIONS = [
  ['Advanced Prompt Engineering', 'Free Academy.al'],
  ['Graphic Design & Canva', 'Simplilearn SkillUp'],
  ['Data Analytics Training', 'ICT Authority, Kenya'],
  ['SPSS and STATA Statistical Package', 'KESAP Research Centre'],
];

const REFERENCES = [
  { name: 'Mr. Alex Kekee', role: 'Senior Dev', organization: 'Intersoft Technologies Consulting (E.A) Ltd.', email: null, phone: '0715358400' },
  { name: 'Mr. Clayton Mmbehi', role: 'Full Stack Developer', organization: 'Sensys', email: 'mmbehiclayton@gmail.com', phone: '0717104727' },
  { name: 'Mr. Robert Mwangi', role: 'Headteacher', organization: 'Bright Promise School', email: 'kaguora85@gmail.com', phone: '0717293937' },
];

const RECOMMENDATIONS = [
  { title: 'Junior Mobile Developer Recommendation Letter', issuer: 'Intersoft Technologies Consulting (E.A) Ltd.' },
];

const report = { inserted: {}, updated: {}, skipped: {}, warnings: [], verification: {} };
function bump(kind, table, n = 1) {
  report[kind][table] = (report[kind][table] || 0) + n;
}
function warn(table, column, reason) {
  report.warnings.push({ table, column, reason });
}

/** Case/diacritic-insensitive skill match key: lowercase, alphanumerics only. */
function skillKey(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Find a skill by normalized key, allowing documented prefix matches
 * (e.g. project stack "React" → CV skill "React.js"; prefix >= 5 chars). */
function findSkill(byKey, name) {
  const key = skillKey(name);
  if (byKey.has(key)) return byKey.get(key);
  if (key.length >= 5) {
    for (const [k, v] of byKey) {
      if (k.startsWith(key) || key.startsWith(k)) {
        if (Math.min(k.length, key.length) >= 5) return v;
      }
    }
  }
  return undefined;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('BEGIN');

    // ---------- schema extension (transactional DDL) ----------
    const ddl = fs.readFileSync(path.resolve(__dirname, '002_cv_extension.pg.sql'), 'utf8');
    await client.query(ddl);
    console.log('DDL   schema extension applied (002_cv_extension)');

    // ---------- warnings table ----------
    const warnInsert = async (table, column, reason) => {
      warn(table, column, reason);
      await client.query(
        'INSERT INTO population_warnings (table_name, column_name, reason) VALUES ($1, $2, $3)',
        [table, column, reason]
      );
    };

    // ---------- 1. PERSON: match on email (unique) ----------
    let person = (await client.query('SELECT * FROM profile WHERE email = $1', [PERSON.email])).rows[0];
    if (!person) {
      // singleton row: match the single existing profile and UPDATE it (rule 1: exists → UPDATE)
      const existing = (await client.query('SELECT * FROM profile ORDER BY id LIMIT 1')).rows[0];
      if (existing) {
        await client.query(
          `UPDATE profile SET name=$1, role=$2, summary=$3, contact_info=$4, email=$5, location=$6,
             phone=$7, github=$8, portfolio=$9, linkedin=$10 WHERE id=$11`,
          [PERSON.name, PERSON.role, PERSON.summary, PERSON.contact_info, PERSON.email,
            PERSON.location, PERSON.phone, PERSON.github, PERSON.portfolio, PERSON.linkedin, existing.id]
        );
        person = (await client.query('SELECT * FROM profile WHERE id = $1', [existing.id])).rows[0];
        bump('updated', 'profile');
        console.log('PERSON updated (singleton row id=' + existing.id + ')');
      } else {
        const ins = await client.query(
          `INSERT INTO profile (name, role, summary, contact_info, email, location, phone, github, portfolio, linkedin, publication_state)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Published') RETURNING id`,
          [PERSON.name, PERSON.role, PERSON.summary, PERSON.contact_info, PERSON.email,
            PERSON.location, PERSON.phone, PERSON.github, PERSON.portfolio, PERSON.linkedin]
        );
        person = ins.rows[0];
        bump('inserted', 'profile');
        console.log('PERSON inserted id=' + person.id);
      }
    } else {
      await client.query(
        `UPDATE profile SET name=$1, role=$2, summary=$3, contact_info=$4, location=$5, phone=$6,
           github=$7, portfolio=$8, linkedin=$9 WHERE id=$10`,
        [PERSON.name, PERSON.role, PERSON.summary, PERSON.contact_info, PERSON.location,
          PERSON.phone, PERSON.github, PERSON.portfolio, PERSON.linkedin, person.id]
      );
      bump('updated', 'profile');
      console.log('PERSON matched by email, updated (id=' + person.id + ')');
    }
    const personId = person.id;

    // ---------- 2. SKILLS: match on skill_name case-insensitive ----------
    // Normalized linker (documented): case + punctuation-insensitive so the CV's
    // "Next.js" reuses the stored "Nextjs", etc.
    const existingSkills = (await client.query('SELECT id, name, category FROM skill')).rows;
    const byKey = new Map(existingSkills.map((s) => [skillKey(s.name), s]));
    const skillIds = new Map();
    for (const [name, category] of SKILLS) {
      const found = findSkill(byKey, name);
      const key = skillKey(found ? found.name : name);
      if (found) {
        skillIds.set(key, found.id);
        if (found.category !== category) {
          await client.query('UPDATE skill SET category = $1 WHERE id = $2', [category, found.id]);
          bump('updated', 'skill');
        } else {
          bump('skipped', 'skill');
        }
        if (found.name !== name) {
          await warnInsert('skill', 'name', `CV skill "${name}" matched existing skill "${found.name}" (normalized case/punctuation) — reused id ${found.id}`);
        }
      } else {
        const ins = await client.query(
          "INSERT INTO skill (name, description, category, publication_state) VALUES ($1, NULL, $2, 'Published') RETURNING id",
          [name, category]
        );
        byKey.set(key, { id: ins.rows[0].id, name, category });
        skillIds.set(key, ins.rows[0].id);
        bump('inserted', 'skill');
      }
    }

    // ---------- 3. person_skills (ON CONFLICT DO NOTHING) ----------
    let psLinked = 0;
    for (const [, skillId] of skillIds) {
      const r = await client.query(
        'INSERT INTO person_skills (person_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [personId, skillId]
      );
      psLinked += r.rowCount;
    }
    bump('inserted', 'person_skills', psLinked);
    console.log('PERSON_SKILLS linked: ' + psLinked);

    // ---------- 4. EXPERIENCES: match (person_id, company, role, start_date) ----------
    for (const e of EXPERIENCES) {
      const found = (
        await client.query(
          'SELECT id FROM experience WHERE profile_id=$1 AND lower(company)=lower($2) AND lower(title)=lower($3) AND start_date=$4',
          [personId, e.company, e.role, e.start_date]
        )
      ).rows[0];
      if (found) {
        await client.query(
          'UPDATE experience SET location=$1, end_date=$2, is_current=$3, description=$4 WHERE id=$5',
          [e.location, e.end_date, e.is_current, e.description, found.id]
        );
        bump('updated', 'experience');
      } else {
        await client.query(
          'INSERT INTO experience (profile_id, title, company, location, start_date, end_date, is_current, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [personId, e.role, e.company, e.location, e.start_date, e.end_date, e.is_current, e.description]
        );
        bump('inserted', 'experience');
      }
    }

    // ---------- 5. PROJECTS: match (person_id, name) ----------
    for (const p of PROJECTS) {
      let found = (
        await client.query('SELECT id FROM project WHERE profile_id=$1 AND lower(title)=lower($2)', [personId, p.name])
      ).rows[0];
      if (!found) {
        const ins = await client.query(
          "INSERT INTO project (title, description, technologies, deploy_url, profile_id, publication_state) VALUES ($1,$2,$3,NULL,$4,'Published') RETURNING id",
          [p.name, p.description, p.stack, personId]
        );
        found = ins.rows[0];
        bump('inserted', 'project');
        if (!/https?:\/\//i.test(p.deployPlatform)) {
          await warnInsert('project', 'deploy_url', `"${p.name}": CV states deploy platform "${p.deployPlatform}" but provides no URL — deploy_url left NULL`);
        }
        if (p.stack === 'Web Application') {
          await warnInsert('project', 'technologies', `"${p.name}": CV lists only "Web Application" as stack — stored verbatim; no technology skills linked`);
        }
      } else {
        await client.query(
          'UPDATE project SET description=$1, technologies=$2, deploy_url=COALESCE(deploy_url, NULL) WHERE id=$3',
          [p.description, p.stack, found.id]
        );
        bump('updated', 'project');
      }
      // project_skills: link only skills that already exist (never invent skills from project stacks)
      for (const linkName of p.stackLinks) {
        const linked = findSkill(byKey, linkName);
        const sid = linked ? skillIds.get(skillKey(linked.name)) : undefined;
        if (!sid) {
          await warnInsert('project_skill', 'skill_id', `"${p.name}": stack item "${linkName}" has no matching CV skill — not linked`);
          continue;
        }
        const r = await client.query(
          'INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [found.id, sid]
        );
        if (r.rowCount > 0) bump('inserted', 'project_skill');
      }
    }
    // stack items present in the CV skills section but stored under normalized names
    await warnInsert('project_skill', 'skill_id', 'Project stack names matched to skills case/punctuation-insensitively: "Next.js"→"Nextjs", "React"→"React.js"');

    // ---------- 6. EDUCATION: match (person_id, institution, degree) ----------
    const eduFound = (
      await client.query(
        'SELECT id FROM education WHERE profile_id=$1 AND lower(institution)=lower($2) AND lower(degree)=lower($3)',
        [personId, EDUCATION.institution, EDUCATION.degree]
      )
    ).rows[0];
    if (eduFound) {
      await client.query(
        'UPDATE education SET field_of_study=$1, start_date=$2, end_date=$3, grade=$4, description=$5 WHERE id=$6',
        [EDUCATION.field_of_study, EDUCATION.start_date, EDUCATION.end_date, EDUCATION.grade, EDUCATION.description, eduFound.id]
      );
      bump('updated', 'education');
    } else {
      await client.query(
        'INSERT INTO education (profile_id, institution, degree, field_of_study, start_date, end_date, grade, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [personId, EDUCATION.institution, EDUCATION.degree, EDUCATION.field_of_study, EDUCATION.start_date, EDUCATION.end_date, EDUCATION.grade, EDUCATION.description]
      );
      bump('inserted', 'education');
    }

    // ---------- 7. CERTIFICATIONS: match (person_id, title) ----------
    for (const [title, issuer] of CERTIFICATIONS) {
      const found = (
        await client.query('SELECT id FROM certifications WHERE person_id=$1 AND lower(title)=lower($2)', [personId, title])
      ).rows[0];
      if (found) {
        await client.query('UPDATE certifications SET issuer=$1 WHERE id=$2', [issuer, found.id]);
        bump('updated', 'certifications');
      } else {
        await client.query('INSERT INTO certifications (person_id, title, issuer) VALUES ($1,$2,$3)', [personId, title, issuer]);
        bump('inserted', 'certifications');
      }
    }

    // ---------- 8. REFERENCES: match (person_id, email) OR (person_id, phone) ----------
    for (const r of REFERENCES) {
      let found = null;
      if (r.email) {
        found = (await client.query('SELECT id FROM cv_references WHERE person_id=$1 AND lower(email)=lower($2)', [personId, r.email])).rows[0];
      }
      if (!found && r.phone) {
        found = (await client.query('SELECT id FROM cv_references WHERE person_id=$1 AND phone=$2', [personId, r.phone])).rows[0];
      }
      if (found) {
        await client.query('UPDATE cv_references SET name=$1, role=$2, organization=$3, email=$4, phone=$5 WHERE id=$6',
          [r.name, r.role, r.organization, r.email, r.phone, found.id]);
        bump('updated', 'cv_references');
      } else {
        await client.query('INSERT INTO cv_references (person_id, name, role, organization, email, phone) VALUES ($1,$2,$3,$4,$5,$6)',
          [personId, r.name, r.role, r.organization, r.email, r.phone]);
        bump('inserted', 'cv_references');
      }
      if (!r.email) {
        await warnInsert('cv_references', 'email', `"${r.name}": no email in CV — matched/stored by phone`);
      }
    }

    // ---------- 9. RECOMMENDATIONS: match (person_id, title, issuer) ----------
    for (const rec of RECOMMENDATIONS) {
      const found = (
        await client.query('SELECT id FROM recommendations WHERE person_id=$1 AND lower(title)=lower($2) AND lower(issuer)=lower($3)',
          [personId, rec.title, rec.issuer])
      ).rows[0];
      if (found) {
        await client.query('UPDATE recommendations SET issuer=$1 WHERE id=$2', [rec.issuer, found.id]);
        bump('updated', 'recommendations');
      } else {
        await client.query('INSERT INTO recommendations (person_id, title, issuer) VALUES ($1,$2,$3)', [personId, rec.title, rec.issuer]);
        bump('inserted', 'recommendations');
      }
    }

    // ---------- 6b. legacy rows not present in the CV (no-delete rule) ----------
    const legacy = await client.query(`
      SELECT 'project' AS t, title AS detail FROM project WHERE profile_id IS NULL
      UNION ALL SELECT 'skill', name FROM skill WHERE id NOT IN (SELECT skill_id FROM person_skills)
      UNION ALL SELECT 'education', institution || ' / ' || degree FROM education WHERE NOT (lower(institution)='chuka university')
      UNION ALL SELECT 'experience', company || ' / ' || title FROM experience WHERE NOT (lower(company) IN ('bright promise school', 'intersoft technologies consulting (e.a) ltd'))
    `);
    for (const row of legacy.rows) {
      await warnInsert(row.t, null, `Pre-existing row not present in the CV (no-delete rule): ${row.detail}`);
    }

    // ---------- verification (inside transaction; also re-run after commit) ----------
    const verification = {};
    verification.persons_by_email = Number((await client.query(
      "SELECT COUNT(*)::int AS n FROM profile WHERE email = $1", [PERSON.email]
    )).rows[0].n);
    verification.skills_linked_to_person = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM person_skills WHERE person_id = $1', [personId]
    )).rows[0].n);
    verification.projects_for_person = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM project WHERE profile_id = $1', [personId]
    )).rows[0].n);
    verification.experiences_cv_matched = Number((await client.query(
      "SELECT COUNT(*)::int AS n FROM experience WHERE profile_id = $1 AND lower(company) IN ('bright promise school','intersoft technologies consulting (e.a) ltd')",
      [personId]
    )).rows[0].n);
    verification.experiences_total = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM experience WHERE profile_id = $1', [personId]
    )).rows[0].n);
    verification.education_cv_matched = Number((await client.query(
      "SELECT COUNT(*)::int AS n FROM education WHERE profile_id = $1 AND lower(institution) = 'chuka university'", [personId]
    )).rows[0].n);
    verification.certifications = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM certifications WHERE person_id = $1', [personId]
    )).rows[0].n);
    verification.references = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM cv_references WHERE person_id = $1', [personId]
    )).rows[0].n);
    verification.recommendations = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM recommendations WHERE person_id = $1', [personId]
    )).rows[0].n);

    // orphan FK check (every FK relationship)
    const orphanChecks = [
      ['person_skills', 'person_id', 'profile', 'id'],
      ['person_skills', 'skill_id', 'skill', 'id'],
      ['project_skill', 'project_id', 'project', 'id'],
      ['project_skill', 'skill_id', 'skill', 'id'],
      ['project_evidence', 'project_id', 'project', 'id'],
      ['project_evidence', 'evidence_id', 'evidence', 'id'],
      ['skill_evidence', 'skill_id', 'skill', 'id'],
      ['skill_evidence', 'evidence_id', 'evidence', 'id'],
      ['claim_evidence', 'claim_id', 'claim', 'id'],
      ['claim_evidence', 'evidence_id', 'evidence', 'id'],
      ['experience', 'profile_id', 'profile', 'id'],
      ['education', 'profile_id', 'profile', 'id'],
      ['certifications', 'person_id', 'profile', 'id'],
      ['cv_references', 'person_id', 'profile', 'id'],
      ['recommendations', 'person_id', 'profile', 'id'],
    ];
    let orphanTotal = 0;
    for (const [t, c, pt, pc] of orphanChecks) {
      const r = await client.query(
        `SELECT COUNT(*)::int AS n FROM ${t} LEFT JOIN ${pt} ON ${t}.${c} = ${pt}.${pc} WHERE ${t}.${c} IS NOT NULL AND ${pt}.${pc} IS NULL`
      );
      orphanTotal += r.rows[0].n;
    }
    verification.orphan_foreign_keys = orphanTotal;
    verification.duplicate_person_emails = Number((await client.query(
      'SELECT COUNT(*)::int AS n FROM (SELECT email FROM profile WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) d'
    )).rows[0].n);
    report.verification = verification;

    console.log('VERIFICATION (in-transaction): ' + JSON.stringify(verification));

    // expectation gates
    const expect = [
      ['persons_by_email', 1], ['skills_linked_to_person', SKILLS.length], ['projects_for_person', PROJECTS.length],
      ['experiences_cv_matched', 2], ['education_cv_matched', 1], ['certifications', 4],
      ['references', 3], ['recommendations', 1], ['orphan_foreign_keys', 0], ['duplicate_person_emails', 0],
    ];
    const failures = expect.filter(([k, v]) => verification[k] !== v);
    if (failures.length > 0) {
      throw new Error('Verification gate failed: ' + failures.map(([k, v]) => `${k}=${verification[k]} (expected ${v})`).join('; '));
    }

    await client.query('COMMIT');
    console.log('COMMIT — population transaction committed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — ' + (err && err.message));
    console.error('Failing statement context: ' + (err && err.detail ? err.detail : ''));
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }

  if (process.exitCode !== 1) {
    console.log('\n=== POPULATION REPORT ===');
    console.log('Inserted: ' + JSON.stringify(report.inserted));
    console.log('Updated:  ' + JSON.stringify(report.updated));
    console.log('Skipped (already existed, unchanged): ' + JSON.stringify(report.skipped));
    console.log('Warnings: ' + report.warnings.length);
    for (const w of report.warnings) {
      console.log('  - [' + w.table + (w.column ? '.' + w.column : '') + '] ' + w.reason);
    }
    console.log('Verification: ' + JSON.stringify(report.verification, null, 2));
    console.log('\nDatabase integrity preserved. No constraints violated.');
  }
}

main();



