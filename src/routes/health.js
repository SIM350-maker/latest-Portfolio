'use strict';

const express = require('express');
const { connectDB } = require('../config/database');

const router = express.Router();

/**
 * Health check (implementation framework section 15):
 * verifies the process can serve requests AND the database responds to a
 * trivial query. 200 when healthy, 503 when the database check fails.
 */
router.get('/', (req, res) => {
  try {
    const db = connectDB();
    db.prepare('SELECT 1 AS ok').get();
    return res.status(200).json({ status: 'OK', database: 'up', timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(503).json({ status: 'ERROR', database: 'down', timestamp: new Date().toISOString() });
  }
});

module.exports = router;
