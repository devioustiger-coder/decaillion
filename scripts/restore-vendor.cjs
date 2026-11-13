const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'dist', 'vendor');
const output = path.join(vendor, 'webllm-0.2.80.js');
const expectedSha256 = 'ef77cc550c47c441f0243d7d173864548164814a9565c1a9a0b8b57f82167199';
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (fs.existsSync(output) && sha256(fs.readFileSync(output)) === expectedSha256) {
  console.log('WebLLM vendor bundle already verified.');
  process.exit(0);
}
const parts = ['01', '02', '03', '04'].map(n =>
  fs.readFileSync(path.join(vendor, 'webllm-parts', n + '.b64'), 'utf8').trim()
);
const archive = Buffer.from(parts.join(''), 'base64');
const bytes = zlib.gunzipSync(archive);
if (sha256(bytes) !== expectedSha256) {
  throw Error('WebLLM bundle verification failed; refusing to write a corrupted file.');
}
fs.writeFileSync(output, bytes);
console.log('Restored and SHA-256 verified dist/vendor/webllm-0.2.80.js');
