const fs = require('fs');
const path = require('path');

/** Load KEY=value pairs from a .env file (no quotes required). */
function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
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
    env[key] = value;
  }
  return env;
}

const fileEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.production'),
  ...loadEnvFile('.env.local'),
};

module.exports = {
  apps: [
    {
      name: 'nm2timesheet',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0',
      env: {
        NODE_ENV: 'production',
        ...fileEnv,
      },
    },
  ],
};
