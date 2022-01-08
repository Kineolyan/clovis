const https = require('https');

function getBaseUrl(stage) {
  switch (stage) {
  case 'prod': 
    throw new Error(`We don't test on prod`);
  case 'test':
    return 'https://8vtyzwm4xg.execute-api.eu-west-3.amazonaws.com';
  case 'dev': 
    return 'https://x2a12knkme.execute-api.eu-west-3.amazonaws.com/dev';
  default:
    throw new Error(`Stage not supported: ${stage}`);
  }
}
const BASE_URL = getBaseUrl(process.env.STAGE);
function buildQueryString(query) {
  const entries = Object.entries(query);
  if (entries.length === 0) {
    return ''
  } else {
    return entries.reduce(
      (q, [key, value], i) => `${q}${i === 0 ? '?' : '&'}${key}=${value}`,
      '');
  }
}
function getUrl(parts, query = {}) {
  return `${BASE_URL}/${parts.join('/')}${buildQueryString(query)}`;
}

function callApi({url, body = null, method = 'GET'}) {
  return new Promise((resolve, reject) => {
    const options = {method};
    const req = https.request(url, options, res => {
      res.setEncoding('utf8');
      let output = ''
      res.on('data', chunk => output += chunk.toString());
      res.on('end', () => resolve({
        body: output,
        code: res.statusCode
      }));
      res.on('error', reject);
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

module.exports = {
  getUrl,
  callApi
};
