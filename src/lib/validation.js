'use strict';

class ValidationError extends Error {
  constructor(message, fieldErrors) {
    super(message || 'Validation failed');
    this.name = 'ValidationError';
    this.status = 400;
    this.fieldErrors = fieldErrors || {};
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message || 'Conflict');
    this.name = 'ConflictError';
    this.status = 409;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message || 'Not found');
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

const PUBLICATION_STATES = ['Draft', 'Published', 'Archived'];
const ACCESSIBILITY_STATES = ['Public', 'Private/Restricted', 'Redacted', 'Unavailable'];
const CLAIM_SOURCES = ['profile', 'project', 'skill'];

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireText(value, field, errors, maxLen) {
  const v = trimmedString(value);
  if (!v) {
    errors[field] = 'This field is required.';
    return null;
  }
  if (maxLen && v.length > maxLen) {
    errors[field] = 'Must be at most ' + maxLen + ' characters.';
    return null;
  }
  return v;
}

function optionalText(value, field, errors, maxLen) {
  const v = trimmedString(value);
  if (!v) return null;
  if (maxLen && v.length > maxLen) {
    errors[field] = 'Must be at most ' + maxLen + ' characters.';
    return null;
  }
  return v;
}

function requireEnum(value, field, errors, allowed) {
  const v = trimmedString(value);
  if (!allowed.includes(v)) {
    errors[field] = 'Must be one of: ' + allowed.join(', ') + '.';
    return null;
  }
  return v;
}

function optionalInt(value, field, errors) {
  const v = trimmedString(value);
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n < 1 || String(n) !== v) {
    errors[field] = 'Must be a positive integer.';
    return null;
  }
  return n;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/** Pragmatic email shape check (route-level); the DB stores it as TEXT. */
function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = {
  ValidationError,
  ConflictError,
  NotFoundError,
  PUBLICATION_STATES,
  ACCESSIBILITY_STATES,
  CLAIM_SOURCES,
  trimmedString,
  requireText,
  optionalText,
  requireEnum,
  optionalInt,
  isHttpUrl,
  isEmail,
};
