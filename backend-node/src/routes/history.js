const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET /api/history — get user's scan history
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT id, jd_title, company_name, match_score, matched_keywords, missing_keywords, created_at
       FROM scan_history WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM scan_history WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      scans: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/history/:id — get single scan
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
        (SELECT json_agg(r) FROM rewrite_history r WHERE r.scan_id = s.id) as rewrites
       FROM scan_history s WHERE s.id = $1 AND s.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Scan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM scan_history WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Scan deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// GET /api/history/stats — score trends
router.get('/me/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_scans,
        AVG(match_score)::integer as avg_score,
        MAX(match_score) as best_score,
        MIN(match_score) as lowest_score
       FROM scan_history WHERE user_id = $1`,
      [req.user.id]
    );

    const trend = await pool.query(
      `SELECT match_score, jd_title, company_name, created_at
       FROM scan_history WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );

    res.json({ ...result.rows[0], trend: trend.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
