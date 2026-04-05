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
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const body = await getBody(req);
  const { prompt } = body;
  if (!prompt) { res.status(400).json({ error: 'prompt required' }); return; }

  // Try multiple models in order
  const models = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash'
  ];

  for (const model of models) {
    try {
      const result = await post(
        `/v1beta/models/${model}:generateContent?key=${GM_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }
      );
      if (result.status === 200) {
        res.status(200).json(result.body);
        return;
      }
    } catch (err) {
      continue;
    }
  }
  res.status(500).json({ error: 'All Gemini models failed. Check API key quota.' });
};
