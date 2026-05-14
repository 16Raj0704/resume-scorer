const express = require('express');
const { scoreResumeAgainstJD } = require('../services/claudeService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/compare — score one resume against multiple JDs
router.post('/', aiRateLimiter, async (req, res) => {
  const { resumeText, jobs } = req.body;
  // jobs: [{ jdText, jdTitle, companyName }]
  if (!resumeText || !jobs || !Array.isArray(jobs) || jobs.length < 2) {
    return res.status(400).json({ error: 'resumeText and at least 2 jobs required' });
  }
  if (jobs.length > 5) return res.status(400).json({ error: 'Maximum 5 JDs for comparison' });

  try {
    const results = await Promise.all(
      jobs.map(async (job) => {
        const analysis = await scoreResumeAgainstJD(resumeText, job.jdText, job.jdTitle, job.companyName);
        return {
          jdTitle: job.jdTitle,
          companyName: job.companyName,
          match_score: analysis.match_score,
          matched_keywords: analysis.matched_keywords,
          missing_keywords: analysis.missing_keywords,
          score_breakdown: analysis.score_breakdown,
          top_suggestion: analysis.suggestions?.[0] || null
        };
      })
    );

    // Sort by score desc
    results.sort((a, b) => b.match_score - a.match_score);

    res.json({
      results,
      best_match: results[0],
      summary: `Your resume best matches ${results[0].jdTitle} at ${results[0].companyName} (${results[0].match_score}% match)`
    });
  } catch (err) {
    res.status(500).json({ error: 'Comparison failed: ' + err.message });
  }
});

module.exports = router;
