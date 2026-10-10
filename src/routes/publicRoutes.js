'use strict';

const express = require('express');
const profileRepo = require('../repositories/profileRepository');
const projectRepo = require('../repositories/projectRepository');
const skillRepo = require('../repositories/skillRepository');
const claimRepo = require('../repositories/claimRepository');

const router = express.Router();

// (The GET-only boundary is enforced globally in src/app.js before CSRF.)

function baseLocals(req) {
  return { isAuthenticated: Boolean(req.session && req.session.authenticated) };
}

/** FR-001: homepage renders the published profile plus published overview. */
router.get('/', (req, res, next) => {
  try {
    const profileRow = profileRepo.getProfile();
    const profile = profileRow && profileRow.publication_state === 'Published' ? profileRow : null;
    const projects = profile ? projectRepo.listPublished() : [];
    const skills = profile ? skillRepo.listPublished() : [];
    return res.render('index', { ...baseLocals(req), title: 'Home', profile, projects, skills });
  } catch (err) { return next(err); }
});

router.get('/projects', (req, res, next) => {
  try {
    const projects = projectRepo.listPublished();
    return res.render('projects/list', { ...baseLocals(req), title: 'Projects', projects });
  } catch (err) { return next(err); }
});

router.get('/projects/:id(\\d+)', (req, res, next) => {
  try {
    const project = projectRepo.getById(Number(req.params.id));
    if (!project || project.publication_state !== 'Published') {
      return res.status(404).render('error', {
        title: '404 — Not found', heading: '404 — Not found',
        message: 'That project does not exist or is not published.',
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    const claims = projectRepo.listClaims(project.id, true);
    const evidence = projectRepo.listEvidence(project.id);
    const skills = projectRepo.listSkills(project.id);
    // Bidirectional traceability (FR-003): each claim carries its evidence.
    const claimsWithEvidence = claims.map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) }));
    return res.render('projects/detail', {
      ...baseLocals(req), title: project.title, project, claims: claimsWithEvidence, evidence, skills,
    });
  } catch (err) { return next(err); }
});

router.get('/skills', (req, res, next) => {
  try {
    const skills = skillRepo.listPublished();
    return res.render('skills/list', { ...baseLocals(req), title: 'Skills', skills });
  } catch (err) { return next(err); }
});

router.get('/skills/:id(\\d+)', (req, res, next) => {
  try {
    const skill = skillRepo.getById(Number(req.params.id));
    if (!skill || skill.publication_state !== 'Published') {
      return res.status(404).render('error', {
        title: '404 — Not found', heading: '404 — Not found',
        message: 'That skill does not exist or is not published.',
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    const claims = skillRepo.listClaims(skill.id, true);
    const evidence = skillRepo.listEvidence(skill.id);
    const claimsWithEvidence = claims.map((c) => ({ ...c, evidence: claimRepo.listEvidence(c.id) }));
    return res.render('skills/detail', {
      ...baseLocals(req), title: skill.name, skill, claims: claimsWithEvidence, evidence,
    });
  } catch (err) { return next(err); }
});

module.exports = router;
