'use strict';

const express = require('express');
const { getDriver, initDatabase, query } = require('../config/database');

const router = express.Router();

/**
 * Health check (implementation framework section 15):
 * verifies the process can serve requests AND the database responds to a
 * trivial query. 200 when healthy, 503 when the database check fails.
 * Driver-aware: reports which database layer is backing the process.
 */
router.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    await initDatabase();
    await query('SELECT 1 AS ok');
    return res.status(200).json({ status: 'OK', database: 'up', driver: getDriver(), timestamp });
  } catch (err) {
    return res.status(503).json({ status: 'ERROR', database: 'down', driver: getDriver(), timestamp });
  }
});

module.exports = router;
