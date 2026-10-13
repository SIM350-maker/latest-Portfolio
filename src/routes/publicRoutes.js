'use strict';

const express = require('express');
const profileRepo = require('../repositories/profileRepository');
const projectRepo = require('../repositories/projectRepository');
const skillRepo = require('../repositories/skillRepository');
const claimRepo = require('../repositories/claimRepository');
const certificationRepo = require('../repositories/certificationRepository');
const experienceRepo = require('../repositories/experienceRepository');
const educationRepo = require('../repositories/educationRepository');
const recommendationRepo = require('../repositories/recommendationRepository');
const contactRepo = require('../repositories/contactRepository');
const { trimmedString, requireText, isEmail } = require('../lib/validation');

const router = express.Router();

// (The GET-only boundary is enforced globally in src/app.js before CSRF.)

function baseLocals(req) {
  return { isAuthenticated: Boolean(req.session && req.session.authenticated) };
}

/** FR-001: homepage renders the published profile plus published overview. */
router.get('/', async (req, res, next) => {
  try {
    const profileRow = await profileRepo.getProfile();
    const profile = profileRow && profileRow.publication_state === 'Published' ? profileRow : null;
    const [projects, skills] = profile
      ? await Promise.all([projectRepo.listPublished(), skillRepo.listPublished()])
      : [[], []];
    const metaDescription = profile && profile.summary
      ? profile.summary.slice(0, 160)
      : 'Evidence-based engineering portfolio — projects, skills, and verifiable claims.';
    return res.render('index', { ...baseLocals(req), title: 'Home', profile, projects, skills, metaDescription, ogPath: '/' });
  } catch (err) { return next(err); }
});

router.get('/projects', async (req, res, next) => {
  try {
    const projects = await projectRepo.listPublished();
    return res.render('projects/list', { ...baseLocals(req), title: 'Projects', projects, metaDescription: 'Projects, technologies, and outcomes — each backed by verifiable evidence.', ogPath: '/projects' });
  } catch (err) { return next(err); }
});

router.get('/projects/:id(\\d+)', async (req, res, next) => {
  try {
    const project = await projectRepo.getById(Number(req.params.id));
    if (!project || project.publication_state !== 'Published') {
      return res.status(404).render('error', {
        title: '404 — Not found', heading: '404 — Not found',
        message: 'That project does not exist or is not published.',
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    const [claims, evidence, skills] = await Promise.all([
      projectRepo.listClaims(project.id, true),
      projectRepo.listEvidence(project.id),
      projectRepo.listSkills(project.id),
    ]);
    // Bidirectional traceability (FR-003): each claim carries its evidence.
    const claimsWithEvidence = await Promise.all(
      claims.map(async (c) => ({ ...c, evidence: await claimRepo.listEvidence(c.id) }))
    );
    const metaDescription = (project.description || project.title).slice(0, 160);
    return res.render('projects/detail', {
      ...baseLocals(req), title: project.title, project, claims: claimsWithEvidence, evidence, skills, metaDescription, ogPath: '/projects/' + project.id,
    });
  } catch (err) { return next(err); }
});

router.get('/skills', async (req, res, next) => {
  try {
    const skills = await skillRepo.listPublished();
    return res.render('skills/list', { ...baseLocals(req), title: 'Skills', skills, metaDescription: 'Technical skills and competencies — each linked to supporting evidence.', ogPath: '/skills' });
  } catch (err) { return next(err); }
});

router.get('/skills/:id(\\d+)', async (req, res, next) => {
  try {
    const skill = await skillRepo.getById(Number(req.params.id));
    if (!skill || skill.publication_state !== 'Published') {
      return res.status(404).render('error', {
        title: '404 — Not found', heading: '404 — Not found',
        message: 'That skill does not exist or is not published.',
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    const metaDescription = (skill.description || skill.name).slice(0, 160);
    const [claims, evidence] = await Promise.all([
      skillRepo.listClaims(skill.id, true),
      skillRepo.listEvidence(skill.id),
    ]);
    const claimsWithEvidence = await Promise.all(
      claims.map(async (c) => ({ ...c, evidence: await claimRepo.listEvidence(c.id) }))
    );
    return res.render('skills/detail', {
      ...baseLocals(req), title: skill.name, skill, claims: claimsWithEvidence, evidence, metaDescription, ogPath: '/skills/' + skill.id,
    });
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- public CV (FR-007)
// Public rendering of the CV document. References are deliberately excluded:
// they hold third-party personal contact details (privacy lifecycle, Phase H).
router.get('/cv', async (req, res, next) => {
  try {
    const profileRow = await profileRepo.getProfile();
    const profile = profileRow && profileRow.publication_state === 'Published' ? profileRow : null;
    if (!profile) {
      return res.status(404).render('error', {
        title: '404 — Not found', heading: '404 — Not found',
        message: 'The CV is not published yet.',
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    const [experiences, educations, certifications, recommendations] = await Promise.all([
      experienceRepo.listAll(),
      educationRepo.listAll(),
      certificationRepo.listAll(),
      recommendationRepo.listAll(),
    ]);
    const metaDescription = ('CV — ' + profile.name + ', ' + profile.role).slice(0, 160);
    return res.render('cv', {
      ...baseLocals(req), title: 'CV — ' + profile.name, profile,
      experiences, educations, certifications, recommendations,
      metaDescription, ogPath: '/cv',
    });
  } catch (err) { return next(err); }
});

// ---------------------------------------------------------------- contact (module I)
router.get('/contact', async (req, res, next) => {
  try {
    const profileRow = await profileRepo.getProfile();
    return res.render('contact', {
      ...baseLocals(req), title: 'Contact',
      profile: profileRow && profileRow.publication_state === 'Published' ? profileRow : null,
      submitted: req.query.submitted === '1',
      values: {}, fieldErrors: {},
      metaDescription: 'Get in touch — send a message directly from the site.',
      ogPath: '/contact',
    });
  } catch (err) { return next(err); }
});

router.post('/contact', async (req, res, next) => {
  // Honeypot: bots fill every field. Real users never see this one.
  if (trimmedString(req.body.website)) {
    return res.redirect(303, '/contact?submitted=1');
  }
  const errors = {};
  const values = {
    name: requireText(req.body.name, 'name', errors, 200),
    email: requireText(req.body.email, 'email', errors, 200),
    message: requireText(req.body.message, 'message', errors, 5000),
  };
  if (values.email && !isEmail(values.email)) {
    errors.email = 'Must be a valid email address.';
  }
  if (Object.keys(errors).length > 0) {
    const profileRow = await profileRepo.getProfile();
    return res.status(400).render('contact', {
      ...baseLocals(req), title: 'Contact',
      profile: profileRow && profileRow.publication_state === 'Published' ? profileRow : null,
      submitted: false, values, fieldErrors: errors,
      metaDescription: 'Get in touch — send a message directly from the site.',
      ogPath: '/contact',
    });
  }
  try {
    await contactRepo.create(values);
    return res.redirect(303, '/contact?submitted=1');
  } catch (err) { return next(err); }
});


module.exports = router;



