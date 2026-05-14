const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

const CACHE_TTL = {
  JD_KEYWORDS: 60 * 60 * 24,    // 24 hours
  SCAN_RESULT: 60 * 60,          // 1 hour
  USER_SESSION: 60 * 60 * 24 * 7 // 7 days
};

async function getCached(key) {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

async function setCache(key, value, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

async function deleteCache(key) {
  await redis.del(key);
}

function cacheKey(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

module.exports = { redis, getCached, setCache, deleteCache, cacheKey, CACHE_TTL };
