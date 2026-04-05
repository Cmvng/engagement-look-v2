const https = require('https');
const TW_KEY = 'new1_6260bfd8c9ec4aff8d2a4ab5d0884706';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.twitterapi.io', path, method: 'GET',
      headers: { 'X-API-Key': TW_KEY }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
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
      const raw = await get(`/twitter/user/last_tweets?userName=${encodeURIComponent(username)}&count=20`);
      // Structure: raw.data.tweets is the array
      const tweets = (raw.data && Array.isArray(raw.data.tweets)) ? raw.data.tweets : [];
      res.status(200).json({ tweets });
    } else {
      const raw = await get(`/twitter/user/info?userName=${encodeURIComponent(username)}`);
      const user = raw.data || raw;
      res.status(200).json({
        status: 'success',
        data: {
          ...user,
          followers_count: user.followers || user.followers_count || 0,
          following_count: user.following || user.following_count || 0,
          screen_name: user.userName || user.screen_name || username,
          profile_image_url_https: (user.profilePicture || '').replace('_normal', '_400x400'),
          name: user.name || username,
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
