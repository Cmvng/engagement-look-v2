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
  const { username } = req.query;
  if (!username) { res.status(400).json({ error: 'username required' }); return; }
  try {
    const data = await get(`/twitter/user/last_tweets?userName=${encodeURIComponent(username)}&count=5`);
    // Return raw first tweet so we can see all field names
    const tweets = data.tweets || data.data || data || [];
    const arr = Array.isArray(tweets) ? tweets : (tweets.tweets || []);
    res.status(200).json({
      total_tweets: arr.length,
      first_tweet_keys: arr.length > 0 ? Object.keys(arr[0]) : [],
      first_tweet: arr.length > 0 ? arr[0] : null,
      raw_response_keys: Object.keys(data)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
