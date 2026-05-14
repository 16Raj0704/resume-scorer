const express = require('express');
const axios = require('axios');
const { scoreResumeAgainstJD, extractJDKeywords } = require('../services/claudeService');
const { getCached, setCache, cacheKey, CACHE_TTL } = require('../config/redis');
const { pool } = require('../config/db');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const crypto = require('crypto');

const router = express.Router();
const PARSER_URL = process.env.PARSER_SERVICE_URL || 'http://localhost:8080';

function hashText(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// POST /api/score — main scoring endpoint
router.post('/', aiRateLimiter, async (req, res) => {
  const { resumeText, jdText, jdTitle, companyName } = req.body;

  if (!resumeText || !jdText) {
    return res.status(400).json({ error: 'resumeText and jdText are required' });
  }

  try {
    // 1. Cache check — same resume + same JD = cached result
    const cacheId = cacheKey('scan', hashText(resumeText + jdText));
    const cached = await getCached(cacheId);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // 2. Try to get parsed/cleaned resume from Spring Boot parser
    let cleanedResume = resumeText;
    try {
      const parseRes = await axios.post(`${PARSER_URL}/api/parse/text`, { text: resumeText }, { timeout: 5000 });
      cleanedResume = parseRes.data.cleanedText || resumeText;
    } catch (e) {
      console.warn('Parser service unavailable, using raw text');
    }

    // 3. Cache JD keywords separately (reused across scans)
    const jdHash = hashText(jdText);
    const jdCacheKey = cacheKey('jd_keywords', jdHash);
    let jdKeywords = await getCached(jdCacheKey);
    if (!jdKeywords) {
      jdKeywords = await extractJDKeywords(jdText);
      await setCache(jdCacheKey, jdKeywords, CACHE_TTL.JD_KEYWORDS);
    }

    // 4. Run AI scoring
    const analysis = await scoreResumeAgainstJD(cleanedResume, jdText, jdTitle, companyName);

    // 5. Save to DB
    const dbResult = await pool.query(
      `INSERT INTO scan_history 
       (user_id, resume_text, jd_text, jd_title, company_name, match_score, matched_keywords, missing_keywords, suggestions, detailed_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        req.user.id,
        resumeText,
        jdText,
        jdTitle || null,
        companyName || null,
        analysis.match_score,
        JSON.stringify(analysis.matched_keywords),
        JSON.stringify(analysis.missing_keywords),
        JSON.stringify(analysis.suggestions),
        analysis.detailed_analysis
      ]
    );

    const result = { ...analysis, jdKeywords, scanId: dbResult.rows[0].id };

    // 6. Cache result
    await setCache(cacheId, result, CACHE_TTL.SCAN_RESULT);

    res.json(result);
  } catch (err) {
    console.error('Score error:', err);
    res.status(500).json({ error: 'Scoring failed: ' + err.message });
  }
});

// POST /api/score/ats — ATS simulation
router.post('/ats', aiRateLimiter, async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) return res.status(400).json({ error: 'resumeText required' });

  try {
    const { simulateATS } = require('../services/claudeService');
    const result = await simulateATS(resumeText);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'ATS simulation failed' });
  }
});

module.exports = router;
