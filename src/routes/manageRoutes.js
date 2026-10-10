'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');

const { requireAuth, verifyCredential } = require('../middleware/auth');
const profileRepo = require('../repositories/profileRepository');
const projectRepo = require('../repositories/projectRepository');
const skillRepo = require('../repositories/skillRepository');
const claimRepo = require('../repositories/claimRepository');
const evidenceRepo = require('../repositories/evidenceRepository');
const {
  ValidationError, NotFoundError,
  ACCESSIBILITY_STATES, CLAIM_SOURCES,
  trimmedString, requireText, optionalText, requireEnum, optionalInt, isHttpUrl,
} = require('../lib/validation');

const router = express.Router();

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

// ---------------------------------------------------------------- dashboard
router.get('/', (req, res, next) => {
  try {
    const profile = profileRepo.getProfile();
    const counts = {
      projects: projectRepo.listAll().length,
      publishedProjects: projectRepo.listPublished().length,
      skills: skillRepo.listAll().length,
      publishedSkills: skillRepo.listPublished().length,
      claims: claimRepo.listAll().length,
      evidence: evidenceRepo.listAll().length,
    };
    return res.render('manage/dashboard', { title: 'Dashboard', profile, counts });
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- profile
router.get('/profile', (req, res, next) => {
  try {
    const profile = profileRepo.getProfile();
    return res.render('manage/profile', { title: 'Edit profile', profile, fieldErrors: {}, values: profile || {} });
  } catch (err) { return next(err); }
});

router.post('/profile', (req, res, next) => {
  const errors = {};
  const values = {
    name: requireText(req.body.name, 'name', errors, 200),
    role: requireText(req.body.role, 'role', errors, 200),
    summary: requireText(req.body.summary, 'summary', errors, 5000),
    contact_info: optionalText(req.body.contact_info, 'contact_info', errors, 2000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/profile', {
      title: 'Edit profile', profile: profileRepo.getProfile(), fieldErrors: errors, values,
    });
  }
  try {
    const existing = profileRepo.getProfile();
    if (existing) {
      profileRepo.updateProfile(existing.id, values);
    } else {
      profileRepo.createProfile(values);
    }
    return res.redirect(303, '/manage/profile');
  } catch (err) { return next(err); }
});

router.post('/profile/publish', (req, res, next) => {
  try {
    const profile = profileRepo.getProfile();
    if (!profile) throw new NotFoundError('No profile exists yet.');
    profileRepo.setPublicationState(profile.id, 'Published');
    return res.redirect(303, '/manage/profile');
  } catch (err) { return next(err); }
});

router.post('/profile/unpublish', (req, res, next) => {
  try {
    const profile = profileRepo.getProfile();
    if (!profile) throw new NotFoundError('No profile exists yet.');
    profileRepo.setPublicationState(profile.id, 'Draft');
    return res.redirect(303, '/manage/profile');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- projects
router.get('/projects', (req, res, next) => {
  try {
    const projects = projectRepo.listAll();
    return res.render('manage/projects/list', { title: 'Projects', projects });
  } catch (err) { return next(err); }
});

router.get('/projects/new', (req, res) => {
  return res.render('manage/projects/form', { title: 'New project', mode: 'new', project: null, values: {}, fieldErrors: {} });
});

router.post('/projects', (req, res, next) => {
  const errors = {};
  const values = {
    title: requireText(req.body.title, 'title', errors, 300),
    description: optionalText(req.body.description, 'description', errors, 10000),
    outcomes: optionalText(req.body.outcomes, 'outcomes', errors, 5000),
    roles: optionalText(req.body.roles, 'roles', errors, 500),
    technologies: optionalText(req.body.technologies, 'technologies', errors, 1000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/projects/form', { title: 'New project', mode: 'new', project: null, values, fieldErrors: errors });
  }
  try {
    projectRepo.create(values);
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.get('/projects/:id(\\d+)/edit', (req, res, next) => {
  try {
    const project = projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    return res.render('manage/projects/form', { title: 'Edit project', mode: 'edit', project, values: project, fieldErrors: {} });
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)', (req, res, next) => {
  const id = Number(req.params.id);
  const errors = {};
  const values = {
    title: requireText(req.body.title, 'title', errors, 300),
    description: optionalText(req.body.description, 'description', errors, 10000),
    outcomes: optionalText(req.body.outcomes, 'outcomes', errors, 5000),
    roles: optionalText(req.body.roles, 'roles', errors, 500),
    technologies: optionalText(req.body.technologies, 'technologies', errors, 1000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/projects/form', { title: 'Edit project', mode: 'edit', project: { id }, values, fieldErrors: errors });
  }
  try {
    if (projectRepo.update(id, values) === 0 && !projectRepo.getById(id)) {
      throw new NotFoundError('Project not found.');
    }
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/delete', (req, res, next) => {
  try {
    projectRepo.remove(Number(req.params.id)); // ConflictError (409) if claims exist
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/publish', (req, res, next) => {
  try {
    projectRepo.setPublicationState(Number(req.params.id), 'Published');
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/unpublish', (req, res, next) => {
  try {
    projectRepo.setPublicationState(Number(req.params.id), 'Draft');
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/evidence', (req, res, next) => {
  try {
    const project = projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    const evidenceId = optionalInt(req.body.evidence_id, 'evidence_id', {});
    if (!evidenceId || !evidenceRepo.getById(evidenceId)) throw new ValidationError('Choose an existing evidence item.', { evidence_id: 'Choose an existing evidence item.' });
    projectRepo.attachEvidence(project.id, evidenceId);
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

router.post('/projects/:id(\\d+)/skills', (req, res, next) => {
  try {
    const project = projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    const skillId = optionalInt(req.body.skill_id, 'skill_id', {});
    if (!skillId || !skillRepo.getById(skillId)) throw new ValidationError('Choose an existing skill.', { skill_id: 'Choose an existing skill.' });
    projectRepo.attachSkill(project.id, skillId);
    return res.redirect(303, '/manage/projects');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- skills
router.get('/skills', (req, res, next) => {
  try {
    const skills = skillRepo.listAll();
    return res.render('manage/skills/list', { title: 'Skills', skills, values: {}, fieldErrors: {} });
  } catch (err) { return next(err); }
});

router.post('/skills', (req, res, next) => {
  const errors = {};
  const values = {
    name: requireText(req.body.name, 'name', errors, 200),
    description: optionalText(req.body.description, 'description', errors, 5000),
  };
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/skills/list', {
      title: 'Skills', skills: skillRepo.listAll(), formOpen: true, values, fieldErrors: errors,
    });
  }
  try {
    if (skillRepo.findByName(values.name)) {
      throw new ValidationError('A skill with this name already exists.', { name: 'A skill with this name already exists.' });
    }
    skillRepo.create(values);
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const errors = {};
    const values = {
      name: requireText(req.body.name, 'name', errors, 200),
      description: optionalText(req.body.description, 'description', errors, 5000),
    };
    if (Object.keys(errors).length > 0) throw new ValidationError('Validation failed', errors);
    const dupe = skillRepo.findByName(values.name);
    if (dupe && dupe.id !== id) {
      throw new ValidationError('A skill with this name already exists.', { name: 'A skill with this name already exists.' });
    }
    if (skillRepo.update(id, values) === 0 && !skillRepo.getById(id)) throw new NotFoundError('Skill not found.');
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/delete', (req, res, next) => {
  try {
    skillRepo.remove(Number(req.params.id));
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/publish', (req, res, next) => {
  try {
    skillRepo.setPublicationState(Number(req.params.id), 'Published');
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/unpublish', (req, res, next) => {
  try {
    skillRepo.setPublicationState(Number(req.params.id), 'Draft');
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

router.post('/skills/:id(\\d+)/evidence', (req, res, next) => {
  try {
    const skill = skillRepo.getById(Number(req.params.id));
    if (!skill) throw new NotFoundError('Skill not found.');
    const evidenceId = optionalInt(req.body.evidence_id, 'evidence_id', {});
    if (!evidenceId || !evidenceRepo.getById(evidenceId)) throw new ValidationError('Choose an existing evidence item.', { evidence_id: 'Choose an existing evidence item.' });
    skillRepo.attachEvidence(skill.id, evidenceId);
    return res.redirect(303, '/manage/skills');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- claims
router.get('/claims', (req, res, next) => {
  try {
    const claims = claimRepo.listAll().map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) }));
    return res.render('manage/claims/list', { title: 'Claims', claims, values: {}, fieldErrors: {}, claimSources: CLAIM_SOURCES });
  } catch (err) { return next(err); }
});

router.post('/claims', (req, res, next) => {
  const errors = {};
  const statement = requireText(req.body.statement, 'statement', errors, 1000);
  const justification = optionalText(req.body.justification, 'justification', errors, 5000);
  let source = null;
  const sourceType = trimmedString(req.body.source_entity_type);
  if (sourceType) {
    const type = requireEnum(sourceType, 'source_entity_type', errors, CLAIM_SOURCES);
    const sourceId = optionalInt(req.body.source_entity_id, 'source_entity_id', errors);
    if (type && sourceId) {
      const exists = type === 'project' ? projectRepo.getById(sourceId)
        : type === 'skill' ? skillRepo.getById(sourceId) : profileRepo.getProfileById(sourceId);
      if (!exists) errors.source_entity_id = 'The referenced record does not exist.';
      else source = { type, id: sourceId };
    }
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/claims/list', {
      title: 'Claims',
      claims: claimRepo.listAll().map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) })),
      values: { statement: req.body.statement, justification: req.body.justification },
      fieldErrors: errors,
      claimSources: CLAIM_SOURCES,
    });
  }
  try {
    claimRepo.create({ statement, justification, source });
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)', (req, res, next) => {
  const id = Number(req.params.id);
  const errors = {};
  const statement = requireText(req.body.statement, 'statement', errors, 1000);
  const justification = optionalText(req.body.justification, 'justification', errors, 5000);
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('manage/claims/list', {
      title: 'Claims',
      claims: claimRepo.listAll().map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) })),
      values: { statement: req.body.statement, justification: req.body.justification },
      fieldErrors: errors,
      claimSources: CLAIM_SOURCES,
    });
  }
  try {
    if (claimRepo.update(id, { statement, justification }) === 0 && !claimRepo.getById(id)) {
      throw new NotFoundError('Claim not found.');
    }
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/delete', (req, res, next) => {
  try {
    if (!claimRepo.getById(Number(req.params.id))) throw new NotFoundError('Claim not found.');
    claimRepo.remove(Number(req.params.id)); // cascades claim_evidence links only
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/publish', (req, res, next) => {
  try {
    claimRepo.setPublicationState(Number(req.params.id), 'Published');
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/unpublish', (req, res, next) => {
  try {
    claimRepo.setPublicationState(Number(req.params.id), 'Draft');
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

router.post('/claims/:id(\\d+)/evidence', (req, res, next) => {
  try {
    const claim = claimRepo.getById(Number(req.params.id));
    if (!claim) throw new NotFoundError('Claim not found.');
    const evidenceId = optionalInt(req.body.evidence_id, 'evidence_id', {});
    if (!evidenceId || !evidenceRepo.getById(evidenceId)) throw new ValidationError('Choose an existing evidence item.', { evidence_id: 'Choose an existing evidence item.' });
    claimRepo.attachEvidence(claim.id, evidenceId);
    return res.redirect(303, '/manage/claims');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- evidence
router.get('/evidence', (req, res, next) => {
  try {
    const evidence = evidenceRepo.listAll().map((e) => ({ ...e, claims: evidenceRepo.listClaims(e.id) }));
    return res.render('manage/evidence/list', { title: 'Evidence', evidence, values: {}, fieldErrors: {}, accessibilityStates: ACCESSIBILITY_STATES });
  } catch (err) { return next(err); }
});

router.post('/evidence', (req, res, next) => {
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
      evidence: evidenceRepo.listAll().map((e) => ({ ...e, claims: evidenceRepo.listClaims(e.id) })),
      values: { description: req.body.description, file_path: req.body.file_path, file_type: req.body.file_type },
      fieldErrors: errors,
      accessibilityStates: ACCESSIBILITY_STATES,
    });
  }
  try {
    evidenceRepo.create({ description, file_path: filePath, file_type: fileType });
    return res.redirect(303, '/manage/evidence');
  } catch (err) { return next(err); }
});

router.post('/evidence/:id(\\d+)/accessibility', (req, res, next) => {
  try {
    const errors = {};
    const status = requireEnum(req.body.accessibility_status, 'accessibility_status', errors, ACCESSIBILITY_STATES);
    if (!status) throw new ValidationError('Invalid accessibility status.', errors);
    if (!evidenceRepo.getById(Number(req.params.id))) throw new NotFoundError('Evidence not found.');
    evidenceRepo.setAccessibility(Number(req.params.id), status);
    return res.redirect(303, '/manage/evidence');
  } catch (err) { return next(err); }
});

router.post('/evidence/:id(\\d+)/delete', (req, res, next) => {
  try {
    if (!evidenceRepo.getById(Number(req.params.id))) throw new NotFoundError('Evidence not found.');
    evidenceRepo.remove(Number(req.params.id));
    return res.redirect(303, '/manage/evidence');
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- preview
router.get('/preview/project/:id(\\d+)', (req, res, next) => {
  try {
    const project = projectRepo.getById(Number(req.params.id));
    if (!project) throw new NotFoundError('Project not found.');
    const claims = projectRepo.listClaims(project.id, false).map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) }));
    return res.render('projects/detail', {
      title: 'Preview: ' + project.title, project, claims, evidence: projectRepo.listEvidence(project.id),
      skills: projectRepo.listSkills(project.id), isAuthenticated: true, preview: true,
    });
  } catch (err) { return next(err); }
});

router.get('/preview/skill/:id(\\d+)', (req, res, next) => {
  try {
    const skill = skillRepo.getById(Number(req.params.id));
    if (!skill) throw new NotFoundError('Skill not found.');
    const claims = skillRepo.listClaims(skill.id, false).map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) }));
    return res.render('skills/detail', {
      title: 'Preview: ' + skill.name, skill, claims, evidence: skillRepo.listEvidence(skill.id),
      isAuthenticated: true, preview: true,
    });
  } catch (err) { return next(err); }
});

module.exports = router;
