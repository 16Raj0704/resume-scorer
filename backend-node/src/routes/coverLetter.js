const express = require('express');
const { generateCoverLetter } = require('../services/claudeService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', aiRateLimiter, async (req, res) => {
  const { resumeText, jdText, jdTitle, companyName } = req.body;
  if (!resumeText || !jdText) return res.status(400).json({ error: 'resumeText and jdText required' });

  try {
    const result = await generateCoverLetter(resumeText, jdText, jdTitle, companyName, req.user.name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Cover letter generation failed: ' + err.message });
  }
});

module.exports = router;
