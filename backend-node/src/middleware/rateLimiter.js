const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Required for Render/Railway — they use reverse proxies
  validate: { xForwardedForHeader: false },
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI rate limit exceeded. Please wait a moment.' },
  validate: { xForwardedForHeader: false },
});

module.exports = { rateLimiter, aiRateLimiter };