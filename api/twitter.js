const https = require('https');

const TW_KEY = 'new1_6260bfd8c9ec4aff8d2a4ab5d0884706';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'X-API-Key': TW_KEY } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    }).on('error', reject);
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
      const data = await get(`https://api.twitterapi.io/twitter/user/last_tweets?userName=${encodeURIComponent(username)}&count=20`);
      res.status(200).json(data);
    } else {
      const data = await get(`https://api.twitterapi.io/twitter/user/info?userName=${encodeURIComponent(username)}`);
      res.status(200).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
