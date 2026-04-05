const https = require('https');

const GM_KEY = 'AIzaSyAgQY2V9AO471_uQZO0-wsZSZ7-uGeVOWE';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { prompt } = req.body || {};
  if (!prompt) { res.status(400).json({ error: 'prompt required' }); return; }

  try {
    const data = await post(
      `/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GM_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
