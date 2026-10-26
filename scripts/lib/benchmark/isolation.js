'use strict';

// Per-run isolation: a fresh Claude config dir holding only credentials, an allowlisted
// environment, and a check that the session loaded exactly the arm's plugins.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Variables a child agent needs (network proxy, CA bundles, locale). Everything else,
// including the parent session's CLAUDE_* and remote-session variables, is dropped.
const ENV_ALLOW = /^(PATH|LANG|LC_ALL|TERM|TMPDIR|NODE_EXTRA_CA_CERTS|SSL_CERT_FILE|SSL_CERT_DIR|REQUESTS_CA_BUNDLE|CURL_CA_BUNDLE|GIT_SSL_CAINFO|HTTPS_PROXY|HTTP_PROXY|NO_PROXY|https_proxy|http_proxy|no_proxy|GLOBAL_AGENT_[A-Z_]+)$/;

function credentialsSource(env = process.env) {
  const configured = env.E6_BENCH_CREDENTIALS;
  if (configured) return configured;
  return path.join(os.homedir(), '.claude', '.credentials.json');
}

/** Create an isolated home + Claude config dir; returns paths and a cleanup function. */
function createIsolation({ credentials = credentialsSource() } = {}) {
  if (!fs.existsSync(credentials)) throw new Error(`Claude credentials not found at ${credentials} (set E6_BENCH_CREDENTIALS)`);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-bench-iso-'));
  fs.chmodSync(root, 0o700);
  const home = path.join(root, 'home');
  const configDir = path.join(root, 'config');
  fs.mkdirSync(home, { mode: 0o700 });
  fs.mkdirSync(configDir, { mode: 0o700 });
  fs.copyFileSync(credentials, path.join(configDir, '.credentials.json'));
  fs.chmodSync(path.join(configDir, '.credentials.json'), 0o600);
  return {
    root,
    home,
    configDir,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function isolatedEnv(isolation, parent = process.env) {
  const env = {};
  for (const [key, value] of Object.entries(parent)) {
    if (ENV_ALLOW.test(key)) env[key] = value;
  }
  env.HOME = isolation.home;
  env.CLAUDE_CONFIG_DIR = isolation.configDir;
  env.TZ = 'UTC';
  env.DISABLE_AUTOUPDATER = '1';
  return env;
}

/**
 * Compare the session's init event with the arm's expected plugins. Claude Code's own
 * built-in plugins (path "builtin") are allowed in every arm, including the baseline.
 */
function checkInit(init, expectedPlugins) {
  if (!init) return { ok: false, reason: 'no system/init event', plugins: [], unexpected: [], missing: expectedPlugins };
  const plugins = (init.plugins || []).map(plugin => ({ name: plugin.name, builtin: plugin.path === 'builtin' }));
  const external = plugins.filter(plugin => !plugin.builtin).map(plugin => plugin.name);
  const unexpected = external.filter(name => !expectedPlugins.includes(name));
  const missing = expectedPlugins.filter(name => !external.includes(name));
  const ok = unexpected.length === 0 && missing.length === 0;
  return {
    ok,
    reason: ok ? undefined : `unexpected [${unexpected.join(', ')}] missing [${missing.join(', ')}]`,
    plugins: plugins.map(plugin => plugin.name),
    skills: init.skills || [],
    unexpected,
    missing,
  };
}

module.exports = { ENV_ALLOW, createIsolation, isolatedEnv, checkInit, credentialsSource };
