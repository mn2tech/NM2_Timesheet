/**
 * Load .env files into process.env (used by next.config.js at build and server start).
 * PM2 does not always pass .env to Node; Next may inline missing keys if not loaded here.
 */
const fs = require('fs');
const path = require('path');

function loadEnvFiles() {
  const root = __dirname;
  for (const file of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('export ')) trimmed = trimmed.slice(7).trim();

      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

module.exports = { loadEnvFiles };
