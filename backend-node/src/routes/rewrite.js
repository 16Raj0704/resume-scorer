const express = require('express');
const { rewriteBullet } = require('../services/claudeService');
const { pool } = require('../config/db');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/rewrite — rewrite a resume bullet
router.post('/', aiRateLimiter, async (req, res) => {
  const { bullet, jdText, jdTitle, scanId } = req.body;
  if (!bullet || !jdText) return res.status(400).json({ error: 'bullet and jdText required' });

  try {
    const result = await rewriteBullet(bullet, jdText, jdTitle);

    // Save to rewrite history if scanId provided
    if (scanId) {
      await pool.query(
        `INSERT INTO rewrite_history (user_id, scan_id, original_bullet, rewritten_bullet, improvement_notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, scanId, bullet, result.rewritten_bullet, result.improvement_notes]
      );
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Rewrite failed: ' + err.message });
  }
});

module.exports = router;
