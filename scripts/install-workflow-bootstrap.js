#!/usr/bin/env node
/** Opt-in project instructions. Defaults to a preview; --write installs. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const START = '<!-- e6-workflow-bootstrap:start -->';
const END = '<!-- e6-workflow-bootstrap:end -->';
const HOST_FILES = {
  codex: 'AGENTS.md',
  opencode: 'AGENTS.md',
  grok: 'AGENTS.md',
  claude: 'CLAUDE.md',
  gemini: 'GEMINI.md',
  cursor: path.join('.cursor', 'rules', 'e6-workflow.mdc'),
};
// Cursor project rules are MDC files; a new rule needs frontmatter to load on every request.
const NEW_FILE_HEADERS = {
  cursor: '---\ndescription: e6 workflow bootstrap for engineering tasks\nalwaysApply: true\n---\n',
};
const USAGE = 'Usage: node scripts/install-workflow-bootstrap.js --project <directory> --pack <installed-pack-root> --host <codex|claude|opencode|gemini|cursor|grok> [--dry-run|--check|--write]';

function parseArgs(args) {
  const options = { mode: 'dry-run' };
  let explicitMode = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (['--dry-run', '--check', '--write'].includes(arg)) {
      if (explicitMode) throw new Error('Choose one mode: --dry-run, --check, or --write.');
      options.mode = arg.slice(2);
      explicitMode = true;
    } else if (['--project', '--pack', '--host'].includes(arg)) {
      const key = arg.slice(2);
      if (options[key] !== undefined) throw new Error(`Duplicate option: ${arg}`);
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[key] = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!options.project || !options.pack || !options.host) {
    throw new Error('--project, --pack, and --host are required.');
  }
  if (!Object.hasOwn(HOST_FILES, options.host)) throw new Error(`Unsupported host: ${options.host}`);
  return options;
}

function replaceBlock(existing, block) {
  const starts = existing.split(START).length - 1;
  const ends = existing.split(END).length - 1;
  if (starts === 0 && ends === 0) {
    const separator = existing ? (existing.endsWith('\n') ? '\n' : '\n\n') : '';
    return existing + separator + block + '\n';
  }
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  if (starts !== 1 || ends !== 1 || end < start) {
    throw new Error('Managed bootstrap markers are incomplete, reversed, or duplicated; file left unchanged.');
  }
  return existing.slice(0, start) + block + existing.slice(end + END.length);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(USAGE);
      return;
    }
    const project = path.resolve(options.project);
    const pack = path.resolve(options.pack);
    if (!fs.statSync(project).isDirectory()) throw new Error(`Project must be an existing directory: ${project}`);
    const bootstrapFile = path.join(pack, 'references', 'workflow-bootstrap.md');
    const routerFile = path.join(pack, 'skills', 'using-e6-agent-skills', 'SKILL.md');
    for (const file of [bootstrapFile, routerFile]) {
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Installed pack file not found: ${file}`);
    }
    const bootstrap = fs.readFileSync(bootstrapFile, 'utf8').trimEnd();
    if (!bootstrap.trim()) throw new Error(`Workflow bootstrap is empty: ${bootstrapFile}`);
    const block = [
      START,
      bootstrap,
      '',
      `Installed e6 pack: ${pack}`,
      `Workflow bootstrap: ${bootstrapFile}`,
      `Router file: ${routerFile}`,
      'Load skills through the host skill loader; if unavailable, read the named skill under this pack’s skills/ directory.',
      END,
    ].join('\n');
    const target = path.join(project, HOST_FILES[options.host]);
    const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    const desired = replaceBlock(existing || NEW_FILE_HEADERS[options.host] || '', block);
    const current = desired === existing;
    if (options.mode === 'check') {
      console.log(`${current ? 'Current' : 'Missing or outdated'} e6 workflow bootstrap: ${target}`);
      process.exitCode = current ? 0 : 1;
    } else if (options.mode === 'write') {
      if (!current) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, desired);
      }
      console.log(`${current ? 'Unchanged' : 'Installed'} e6 workflow bootstrap: ${target}`);
    } else {
      console.log(`Dry run: ${current ? 'unchanged' : 'would install/update'} ${target}\n\n${block}`);
    }
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();
