const axios = require('axios');

// Simple in-memory cache to reduce external calls and improve reliability
// Cache shape: Map<username, { data: any, expiresAt: number }>
const cache = new Map();
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetries(url, body, options = {}, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await axios.post(url, body, options);
      return resp;
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(1000 * Math.pow(2, i), 5000);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

// Best-effort LeetCode profile fetch via server-side GraphQL call with caching + retries
exports.getLeetcodeProfile = async (req, res) => {
  try {
    const username = req.params.username || req.query.username;
    if (!username) return res.status(400).json({ message: 'Missing username' });

    const key = String(username).toLowerCase();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ cached: true, data: cached.data });
    }

    const query = `query getUserProfile($username: String!) {\n  matchedUser(username: $username) {\n    username\n    profile {\n      realName\n      ranking\n    }\n    submitStats: submitStatsGlobal {\n      acSubmissionNum {\n        difficulty\n        count\n        submissions\n      }\n    }\n  }\n}`;

    const body = { query, variables: { username } };

    let resp;
    try {
      resp = await fetchWithRetries('https://leetcode.com/graphql', body, { headers: { 'Content-Type': 'application/json' } }, 3);
    } catch (err) {
      console.error('LeetCode fetch failed after retries:', err?.response?.data || err.message);
      return res.status(502).json({ message: 'Failed to fetch LeetCode profile' });
    }

    // store in cache
    try {
      cache.set(key, { data: resp.data, expiresAt: Date.now() + DEFAULT_TTL_MS });
    } catch (err) {
      // non-fatal - cache can fail silently
      console.warn('Failed to cache LeetCode response', err?.message || err);
    }

    return res.json({ cached: false, data: resp.data });
  } catch (err) {
    console.error('Error fetching LeetCode profile:', err?.response?.data || err.message);
    return res.status(500).json({ message: 'Failed to fetch LeetCode profile' });
  }
};
