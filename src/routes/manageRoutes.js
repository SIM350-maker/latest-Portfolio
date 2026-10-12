'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');

const { requireAuth, verifyCredential } = require('../middleware/auth');
const profileRepo = require('../repositories/profileRepository');
const projectRepo = require('../repositories/projectRepository');
const skillRepo = require('../repositories/skillRepository');
const claimRepo = require('../repositories/claimRepository');
const evidenceRepo = require('../repositories/evidenceRepository');

const experienceRepo = require('../repositories/experienceRepository');
const educationRepo = require('../repositories/educationRepository');
const {
  ValidationError, NotFoundError,
  ACCESSIBILITY_STATES, CLAIM_SOURCES,
  trimmedString, requireText, optionalText, requireEnum, optionalInt, isHttpUrl,
} = require('../lib/validation');

const router = express.Router();

/** Claims decorated with their evidence (bidirectional traceability). */
async function claimsWithEvidence(claims) {
  return Promise.all(claims.map(async (c) => ({ ...c, evidence: await claimRepo.listEvidence(c.id) })));
}

/** Evidence decorated with the claims it supports. */
async function evidenceWithClaims(evidence) {
  return Promise.all(evidence.map(async (e) => ({ ...e, claims: await evidenceRepo.listClaims(e.id) })));
}

// ---------------------------------------------------------------- login/logout
// (public: the login page itself must be reachable without a session)
router.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/manage');
  return res.render('manage/login', { title: 'Sign in', error: null });
});

router.post('/login', (req, res) => {
  const password = trimmedString(req.body.password);
  if (!password || !verifyCredential(password, bcrypt)) {
    return res.status(401).render('manage/login', { title: 'Sign in', error: 'Invalid credentials.' });
  }
  // Session fixation protection: rotate the session identifier at
  // authentication (frozen security design section 8).
  const oldToken = req.session.csrfToken;
  const returnTo = typeof req.session.returnTo === 'string' && req.session.returnTo.startsWith('/manage')
    ? req.session.returnTo : '/manage';
  return req.session.regenerate((err) => {
    if (err) return res.status(500).render('error', { title: '500', heading: '500 — Internal Server Error', message: 'Sign-in failed. Try again.', isAuthenticated: false });
    req.session.authenticated = true;
    req.session.csrfToken = oldToken; // fresh identifier, fresh-bound token
    req.session.createdAt = Date.now();
    req.session.lastSeen = Date.now();
    return res.redirect(303, returnTo);
  });
});

router.post('/logout', (req, res) => {
  return req.session.destroy(() => res.redirect(303, '/'));
});

// Everything below requires an authenticated management session.
router.use(requireAuth);

// ---------------------------------------------------------------- live events
// Server-sent events: near-real-time DB → UI reflection (data-architecture
// plan, requirement 4). Every successful mutation publishes 'data-changed'
// via the shared query layer; open manage sessions receive it and refresh.
router.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n');

  const { onDataChanged } = require('../lib/events');
  const send = (event) => {
    try { res.write('data: ' + JSON.stringify(event) + '\n\n'); } catch (_) { /* client gone */ }
  };
  const unsubscribe = onDataChanged(send);

  const heartbeat = setInterval(() => {
    try { res.write(':ping\n\n'); } catch (_) { /* client gone */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// ---------------------------------------------------------------- dashboard
router.get('/', async (req, res, next) => {
  try {
    const [profile, projects, publishedProjects, skills, publishedSkills, claims, evidence, experiences, educations] =
      await Promise.all([
        profileRepo.getProfile(),
        projectRepo.listAll(),
        projectRepo.listPublished(),
        skillRepo.listAll(),
        skillRepo.listPublished(),
        claimRepo.listAll(),
        evidenceRepo.listAll(),
        experienceRepo.listAll(),
        educationRepo.listAll(),
      ]);
    const counts = {
      projects: projects.length,
      publishedProjects: publishedProjects.length,
      skills: skills.length,
      publishedSkills: publishedSkills.length,
      claims: claims.length,
      evidence: evidence.length,
      experiences: experiences.length,
      educations: educations.length,
    };
    return res.render('manage/dashboard', { title: 'Dashboard', profile, counts });
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- profile
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await profileRepo.getProfile();
    return res.render('manage/profile', { title: 'Edit profile', profile, fieldErrors: {}, values: profile || {} });
  } catch (err) { return next(err); }
});

router.post('/profile', async (req, res, next) => {
  const errors = {};
  const values = {
    name: requireText(req.body.name, 'name', errors, 200),
    role: requireText(req.body.role, 'role', errors, 200),
    summary: requireText(req.body.summary, 'summary', errors, 5000),
    contact_info: optionalText(req.body.contact_info, 'contact_info', errors, 2000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/profile', {
      title: 'Edit profile', profile: await profileRepo.getProfile(), fieldErrors: errors, values,
    });
  }
  try {
    const existing = await profileRepo.getProfile();
    if (existing) {
      await profileRepo.updateProfile(existing.id, values);
    } else {
      await profileRepo.createProfile(values);
    }
    return res.redirect(303, '/manage/profile');
  } catch (err) { return next(err); }
});

router.post('/profile/publish', async (req, res, next) => {
  try {
    const profile = await profileRepo.getProfile();
    if (!profile) throw new NotFoundError('No profile exists yet.');
    await profileRepo.setPublicationState(profile.id, 'Published');
    return res.redirect(303, '/manage/profile');
  } catch (err) { return next(err); }
});

router.post('/profile/unpublish', async (req, res, next) => {
  try {
    const profile = await profileRepo.getProfile();
    if (!profile) throw new NotFoundError('No profile exists yet.');
    await profileRepo.setPublicationState(profile.id, 'Draft');
    return res.redirect(303, '/manage/profile');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- projects
router.get('/projects', async (req, res, next) => {
  try {
    const projects = await projectRepo.listAll();
    return res.render('manage/projects/list', { title: 'Projects', projects });
  } catch (err) { return next(err); }
});

router.get('/projects/new', (req, res) => {
  return res.render('manage/projects/form', { title: 'New project', mode: 'new', project: null, values: {}, fieldErrors: {} });
});

router.post('/projects', async (req, res, next) => {
  const errors = {};
  const values = {
    title: requireText(req.body.title, 'title', errors, 300),
    description: optionalText(req.body.description, 'description', errors, 10000),
    outcomes: optionalText(req.body.outcomes, 'outcomes', errors, 5000),
    roles: optionalText(req.body.roles, 'roles', errors, 500),
    technologies: optionalText(req.body.technologies, 'technologies', errors, 1000),
    deploy_url: optionalText(req.body.deploy_url, 'deploy_url', errors, 2000),
  };
  if (values.deploy_url && !isHttpUrl(values.deploy_url)) {
    errors.deploy_url = 'Must be a valid http(s) URL.';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/projects/form', { title: 'New project', mode: 'new', project: null, values, fieldErrors: errors });
  }
  try {
    await projectRepo.create(values);
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.get('/projects/:id(\\d+)/edit', async (req, res, next) => {
  try {
    const project = await projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    return res.render('manage/projects/form', { title: 'Edit project', mode: 'edit', project, values: project, fieldErrors: {} });
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)', async (req, res, next) => {
  const id = Number(req.params.id);
  const errors = {};
  const values = {
    title: requireText(req.body.title, 'title', errors, 300),
    description: optionalText(req.body.description, 'description', errors, 10000),
    outcomes: optionalText(req.body.outcomes, 'outcomes', errors, 5000),
    roles: optionalText(req.body.roles, 'roles', errors, 500),
    technologies: optionalText(req.body.technologies, 'technologies', errors, 1000),
    deploy_url: optionalText(req.body.deploy_url, 'deploy_url', errors, 2000),
  };
  if (values.deploy_url && !isHttpUrl(values.deploy_url)) {
    errors.deploy_url = 'Must be a valid http(s) URL.';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/projects/form', { title: 'Edit project', mode: 'edit', project: { id }, values, fieldErrors: errors });
  }
  try {
    if ((await projectRepo.update(id, values)) === 0 && !(await projectRepo.getById(id))) {
      throw new NotFoundError('Project not found.');
    }
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/delete', async (req, res, next) => {
  try {
    await projectRepo.remove(Number(req.params.id)); // ConflictError (409) if claims exist
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/publish', async (req, res, next) => {
  try {
    if (!(await projectRepo.setPublicationState(Number(req.params.id), 'Published'))) {
      throw new NotFoundError('Project not found.');
    }
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/unpublish', async (req, res, next) => {
  try {
    if (!(await projectRepo.setPublicationState(Number(req.params.id), 'Draft'))) {
      throw new NotFoundError('Project not found.');
    }
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/evidence', async (req, res, next) => {
  try {
    const project = await projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    const evidenceId = optionalInt(req.body.evidence_id, 'evidence_id', {});
    if (!evidenceId || !(await evidenceRepo.getById(evidenceId))) throw new ValidationError('Choose an existing evidence item.', { evidence_id: 'Choose an existing evidence item.' });
    await projectRepo.attachEvidence(project.id, evidenceId);
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/skills', async (req, res, next) => {
  try {
    const project = await projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    const skillId = optionalInt(req.body.skill_id, 'skill_id', {});
    if (!skillId || !(await skillRepo.getById(skillId))) throw new ValidationError('Choose an existing skill.', { skill_id: 'Choose an existing skill.' });
    await projectRepo.attachSkill(project.id, skillId);
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- skills
router.get('/skills', async (req, res, next) => {
  try {
    const skills = await skillRepo.listAll();
    return res.render('manage/skills/list', { title: 'Skills', skills, values: {}, fieldErrors: {} });
  } catch (err) { return next(err); }
});

router.post('/skills', async (req, res, next) => {
  const errors = {};
  const values = {
    name: requireText(req.body.name, 'name', errors, 200),
    description: optionalText(req.body.description, 'description', errors, 5000),
    category: optionalText(req.body.category, 'category', errors, 100),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/skills/list', {
      title: 'Skills', skills: await skillRepo.listAll(), formOpen: true, values, fieldErrors: errors,
    });
  }
  try {
    if (await skillRepo.findByName(values.name)) {
      throw new ValidationError('A skill with this name already exists.', { name: 'A skill with this name already exists.' });
    }
    await skillRepo.create(values);
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const errors = {};
    const values = {
      name: requireText(req.body.name, 'name', errors, 200),
      description: optionalText(req.body.description, 'description', errors, 5000),
      category: optionalText(req.body.category, 'category', errors, 100),
    };
    if (Object.keys(errors).length > 0) throw new ValidationError('Validation failed', errors);
    const dupe = await skillRepo.findByName(values.name);
    if (dupe && dupe.id !== id) {
      throw new ValidationError('A skill with this name already exists.', { name: 'A skill with this name already exists.' });
    }
    if ((await skillRepo.update(id, values)) === 0 && !(await skillRepo.getById(id))) throw new NotFoundError('Skill not found.');
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/delete', async (req, res, next) => {
  try {
    await skillRepo.remove(Number(req.params.id));
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/publish', async (req, res, next) => {
  try {
    if (!(await skillRepo.setPublicationState(Number(req.params.id), 'Published'))) {
      throw new NotFoundError('Skill not found.');
    }
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/unpublish', async (req, res, next) => {
  try {
    if (!(await skillRepo.setPublicationState(Number(req.params.id), 'Draft'))) {
      throw new NotFoundError('Skill not found.');
    }
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/evidence', async (req, res, next) => {
  try {
    const skill = await skillRepo.getById(Number(req.params.id));
    if (!skill) throw new NotFoundError('Skill not found.');
    const evidenceId = optionalInt(req.body.evidence_id, 'evidence_id', {});
    if (!evidenceId || !(await evidenceRepo.getById(evidenceId))) throw new ValidationError('Choose an existing evidence item.', { evidence_id: 'Choose an existing evidence item.' });
    await skillRepo.attachEvidence(skill.id, evidenceId);
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- experience
router.get('/experience', async (req, res, next) => {
  try {
    const experiences = await experienceRepo.listAll();
    return res.render('manage/experience/list', { title: 'Experience', experiences, values: {}, fieldErrors: {} });
  } catch (err) { return next(err); }
});

router.post('/experience', async (req, res, next) => {
  const errors = {};
  const values = {
    title: requireText(req.body.title, 'title', errors, 200),
    company: requireText(req.body.company, 'company', errors, 200),
    location: optionalText(req.body.location, 'location', errors, 200),
    start_date: requireText(req.body.start_date, 'start_date', errors, 50),
    end_date: optionalText(req.body.end_date, 'end_date', errors, 50),
    is_current: req.body.is_current === 'on',
    description: optionalText(req.body.description, 'description', errors, 5000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/experience/list', {
      title: 'Experience', experiences: await experienceRepo.listAll(), values, fieldErrors: errors,
    });
  }
  try {
    await experienceRepo.create(values);
    return res.redirect(303, '/manage/experience');
  } catch (err) { return next(err); }
});

router.post('/experience/:id(\\d+)', async (req, res, next) => {
  const id = Number(req.params.id);
  const errors = {};
  const values = {
    title: requireText(req.body.title, 'title', errors, 200),
    company: requireText(req.body.company, 'company', errors, 200),
    location: optionalText(req.body.location, 'location', errors, 200),
    start_date: requireText(req.body.start_date, 'start_date', errors, 50),
    end_date: optionalText(req.body.end_date, 'end_date', errors, 50),
    is_current: req.body.is_current === 'on',
    description: optionalText(req.body.description, 'description', errors, 5000),
  };
  if (Object.keys(errors).length > 0) throw new ValidationError('Validation failed', errors);
  try {
    if ((await experienceRepo.update(id, values)) === 0 && !(await experienceRepo.getById(id))) {
      throw new NotFoundError('Experience entry not found.');
    }
    return res.redirect(303, '/manage/experience');
  } catch (err) { return next(err); }
});

router.post('/experience/:id(\\d+)/delete', async (req, res, next) => {
  try {
    if (!(await experienceRepo.remove(Number(req.params.id)))) throw new NotFoundError('Experience entry not found.');
    return res.redirect(303, '/manage/experience');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- education
router.get('/education', async (req, res, next) => {
  try {
    const educations = await educationRepo.listAll();
    return res.render('manage/education/list', { title: 'Education', educations, values: {}, fieldErrors: {} });
  } catch (err) { return next(err); }
});

router.post('/education', async (req, res, next) => {
  const errors = {};
  const values = {
    institution: requireText(req.body.institution, 'institution', errors, 200),
    degree: requireText(req.body.degree, 'degree', errors, 200),
    field_of_study: optionalText(req.body.field_of_study, 'field_of_study', errors, 200),
    start_date: requireText(req.body.start_date, 'start_date', errors, 50),
    end_date: optionalText(req.body.end_date, 'end_date', errors, 50),
    grade: optionalText(req.body.grade, 'grade', errors, 100),
    description: optionalText(req.body.description, 'description', errors, 5000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/education/list', {
      title: 'Education', educations: await educationRepo.listAll(), values, fieldErrors: errors,
    });
  }
  try {
    await educationRepo.create(values);
    return res.redirect(303, '/manage/education');
  } catch (err) { return next(err); }
});

router.post('/education/:id(\\d+)', async (req, res, next) => {
  const id = Number(req.params.id);
  const errors = {};
  const values = {
    institution: requireText(req.body.institution, 'institution', errors, 200),
    degree: requireText(req.body.degree, 'degree', errors, 200),
    field_of_study: optionalText(req.body.field_of_study, 'field_of_study', errors, 200),
    start_date: requireText(req.body.start_date, 'start_date', errors, 50),
    end_date: optionalText(req.body.end_date, 'end_date', errors, 50),
    grade: optionalText(req.body.grade, 'grade', errors, 100),
    description: optionalText(req.body.description, 'description', errors, 5000),
  };
  if (Object.keys(errors).length > 0) throw new ValidationError('Validation failed', errors);
  try {
    if ((await educationRepo.update(id, values)) === 0 && !(await educationRepo.getById(id))) {
      throw new NotFoundError('Education entry not found.');
    }
    return res.redirect(303, '/manage/education');
  } catch (err) { return next(err); }
});

router.post('/education/:id(\\d+)/delete', async (req, res, next) => {
  try {
    if (!(await educationRepo.remove(Number(req.params.id)))) throw new NotFoundError('Education entry not found.');
    return res.redirect(303, '/manage/education');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- claims
router.get('/claims', async (req, res, next) => {
  try {
    const claims = await claimsWithEvidence(await claimRepo.listAll());
    return res.render('manage/claims/list', { title: 'Claims', claims, values: {}, fieldErrors: {}, claimSources: CLAIM_SOURCES });
  } catch (err) { return next(err); }
});

router.post('/claims', async (req, res, next) => {
  const errors = {};
  const statement = requireText(req.body.statement, 'statement', errors, 1000);
  const justification = optionalText(req.body.justification, 'justification', errors, 5000);
  let source = null;
  const sourceType = trimmedString(req.body.source_entity_type);
  if (sourceType) {
    const type = requireEnum(sourceType, 'source_entity_type', errors, CLAIM_SOURCES);
    const sourceId = optionalInt(req.body.source_entity_id, 'source_entity_id', errors);
    if (type && sourceId) {
      const exists = type === 'project' ? await projectRepo.getById(sourceId)
        : type === 'skill' ? await skillRepo.getById(sourceId) : await profileRepo.getProfileById(sourceId);
      if (!exists) errors.source_entity_id = 'The referenced record does not exist.';
      else source = { type, id: sourceId };
    }
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/claims/list', {
      title: 'Claims',
      claims: await claimsWithEvidence(await claimRepo.listAll()),
      values: { statement: req.body.statement, justification: req.body.justification },
      fieldErrors: errors,
      claimSources: CLAIM_SOURCES,
    });
  }
  try {
    await claimRepo.create({ statement, justification, source });
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)', async (req, res, next) => {
  const id = Number(req.params.id);
  const errors = {};
  const statement = requireText(req.body.statement, 'statement', errors, 1000);
  const justification = optionalText(req.body.justification, 'justification', errors, 5000);
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/claims/list', {
      title: 'Claims',
      claims: await claimsWithEvidence(await claimRepo.listAll()),
      values: { statement: req.body.statement, justification: req.body.justification },
      fieldErrors: errors,
      claimSources: CLAIM_SOURCES,
    });
  }
  try {
    if ((await claimRepo.update(id, { statement, justification })) === 0 && !(await claimRepo.getById(id))) {
      throw new NotFoundError('Claim not found.');
    }
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/delete', async (req, res, next) => {
  try {
    if (!(await claimRepo.getById(Number(req.params.id)))) throw new NotFoundError('Claim not found.');
    await claimRepo.remove(Number(req.params.id)); // cascades claim_evidence links only
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/publish', async (req, res, next) => {
  try {
    if (!(await claimRepo.setPublicationState(Number(req.params.id), 'Published'))) {
      throw new NotFoundError('Claim not found.');
    }
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/unpublish', async (req, res, next) => {
  try {
    if (!(await claimRepo.setPublicationState(Number(req.params.id), 'Draft'))) {
      throw new NotFoundError('Claim not found.');
    }
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/evidence', async (req, res, next) => {
  try {
    const claim = await claimRepo.getById(Number(req.params.id));
    if (!claim) throw new NotFoundError('Claim not found.');
    const evidenceId = optionalInt(req.body.evidence_id, 'evidence_id', {});
    if (!evidenceId || !(await evidenceRepo.getById(evidenceId))) throw new ValidationError('Choose an existing evidence item.', { evidence_id: 'Choose an existing evidence item.' });
    await claimRepo.attachEvidence(claim.id, evidenceId);
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- evidence
router.get('/evidence', async (req, res, next) => {
  try {
    const evidence = await evidenceWithClaims(await evidenceRepo.listAll());
    return res.render('manage/evidence/list', { title: 'Evidence', evidence, values: {}, fieldErrors: {}, accessibilityStates: ACCESSIBILITY_STATES });
  } catch (err) { return next(err); }
});

router.post('/evidence', async (req, res, next) => {
  const errors = {};
  const description = optionalText(req.body.description, 'description', errors, 2000);
  const filePath = optionalText(req.body.file_path, 'file_path', errors, 2000);
  const fileType = optionalText(req.body.file_type, 'file_type', errors, 100);
  if (filePath && !isHttpUrl(filePath)) {
    errors.file_path = 'Must be a valid http(s) URL.';
  }
  if (!description && !filePath) {
    errors.description = 'Provide a description, a reference URL, or both.';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/evidence/list', {
      title: 'Evidence',
      evidence: await evidenceWithClaims(await evidenceRepo.listAll()),
      values: { description: req.body.description, file_path: req.body.file_path, file_type: req.body.file_type },
      fieldErrors: errors,
      accessibilityStates: ACCESSIBILITY_STATES,
    });
  }
  try {
    await evidenceRepo.create({ description, file_path: filePath, file_type: fileType });
    return res.redirect(303, '/manage/evidence');
  } catch (err) { return next(err); }
});

router.post('/evidence/:id(\\d+)/accessibility', async (req, res, next) => {
  try {
    const errors = {};
    const status = requireEnum(req.body.accessibility_status, 'accessibility_status', errors, ACCESSIBILITY_STATES);
    if (!status) throw new ValidationError('Invalid accessibility status.', errors);
    if (!(await evidenceRepo.getById(Number(req.params.id)))) throw new NotFoundError('Evidence not found.');
    await evidenceRepo.setAccessibility(Number(req.params.id), status);
    return res.redirect(303, '/manage/evidence');
  } catch (err) { return next(err); }
});

router.post('/evidence/:id(\\d+)/delete', async (req, res, next) => {
  try {
    if (!(await evidenceRepo.getById(Number(req.params.id)))) throw new NotFoundError('Evidence not found.');
    await evidenceRepo.remove(Number(req.params.id));
    return res.redirect(303, '/manage/evidence');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- preview
router.get('/preview/project/:id(\\d+)', async (req, res, next) => {
  try {
    const project = await projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    const claims = await claimsWithEvidence(await projectRepo.listClaims(project.id, false));
    return res.render('projects/detail', {
      title: 'Preview: ' + project.title, project, claims, evidence: await projectRepo.listEvidence(project.id),
      skills: await projectRepo.listSkills(project.id), isAuthenticated: true, preview: true,
    });
  } catch (err) { return next(err); }
});

router.get('/preview/skill/:id(\\d+)', async (req, res, next) => {
  try {
    const skill = await skillRepo.getById(Number(req.params.id));
    if (!skill) throw new NotFoundError('Skill not found.');
    const claims = await claimsWithEvidence(await skillRepo.listClaims(skill.id, false));
    return res.render('skills/detail', {
      title: 'Preview: ' + skill.name, skill, claims, evidence: await skillRepo.listEvidence(skill.id),
      isAuthenticated: true, preview: true,
    });
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- CV (FR-007)
// Single source of truth: rendered from the same repositories as the public
// site. Published skills only (honesty invariant); experience/education have
// no publication state, so all rows are included.
async function buildCvData() {
  const [profile, skills, experiences, educations] = await Promise.all([
    profileRepo.getProfile(),
    skillRepo.listPublished(),
    experienceRepo.listAll(),
    educationRepo.listAll(),
  ]);
  return { profile, skills, experiences, educations };
}

function cvFileName(profile) {
  if (!profile || !profile.name) return 'cv.html';
  const base = String(profile.name).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return (base || 'cv') + '-cv.html';
}

router.get('/cv', async (req, res, next) => {
  try {
    const cv = await buildCvData();
    return res.render('manage/cv', { title: 'CV preview', ...cv, download: false });
  } catch (err) { return next(err); }
});

router.get('/cv/download', async (req, res, next) => {
  try {
    const cv = await buildCvData();
    res.set('Content-Disposition', 'attachment; filename="' + cvFileName(cv.profile) + '"');
    return res.render('manage/cv', { title: 'Curriculum Vitae', ...cv, download: true });
  } catch (err) { return next(err); }
});

module.exports = router;

