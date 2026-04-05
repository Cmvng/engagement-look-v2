const https = require('https');

const TW_KEY = 'new1_6260bfd8c9ec4aff8d2a4ab5d0884706';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.twitterapi.io',
      path,
      method: 'GET',
      headers: { 'X-API-Key': TW_KEY }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { username, type } = req.query;
  if (!username) { res.status(400).json({ error: 'username required' }); return; }

  try {
    if (type === 'tweets') {
      const data = await get(`/twitter/user/last_tweets?userName=${encodeURIComponent(username)}&count=20`);
      // Normalize tweet fields
      const raw = data.tweets || data.data || data || [];
      const arr = Array.isArray(raw) ? raw : (raw.tweets || []);
      const normalized = arr.map(t => ({
        ...t,
        favorite_count: t.likeCount || t.like_count || t.favorite_count || 0,
        retweet_count: t.retweetCount || t.retweet_count || 0,
        reply_count: t.replyCount || t.reply_count || 0,
        view_count: t.viewCount || t.view_count || t.impressionCount || 0,
      }));
      res.status(200).json({ tweets: normalized });
    } else {
      const data = await get(`/twitter/user/info?userName=${encodeURIComponent(username)}`);
      const raw = data.data || data;
      // Normalize profile fields
      const normalized = {
        ...raw,
        followers_count: raw.followers || raw.followers_count || 0,
        following_count: raw.following || raw.following_count || 0,
        screen_name: raw.userName || raw.screen_name || username,
        profile_image_url_https: (raw.profilePicture || raw.profile_image_url_https || '').replace('_normal', '_400x400'),
        name: raw.name || username,
      };
      res.status(200).json({ status: 'success', data: normalized });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
