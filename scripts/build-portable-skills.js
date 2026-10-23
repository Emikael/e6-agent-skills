#!/usr/bin/env node
/**
 * Build self-contained skill folders, and optionally one ZIP per skill, for
 * hosts that install skills one directory at a time (claude.ai and Claude
 * Desktop uploads, Cursor/Grok/Codex skill directories). Shared root
 * references a skill links to are vendored into its own references/ folder;
 * links to anything else in the pack become repository URLs.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DEFAULT_REPO_URL = 'https://github.com/Emikael/e6-agent-skills/blob/main';
const USAGE = 'Usage: node scripts/build-portable-skills.js --out <directory> [--pack <pack-root>] [--skills a,b] [--zip] [--force] [--repo-url <url>]';
const LINK = /\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g;

function parseArgs(args) {
  const options = { pack: path.resolve(__dirname, '..'), zip: false, force: false, repoUrl: DEFAULT_REPO_URL };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--zip') options.zip = true;
    else if (arg === '--force') options.force = true;
    else if (['--out', '--pack', '--skills', '--repo-url'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if (arg === '--out') options.out = path.resolve(value);
      if (arg === '--pack') options.pack = path.resolve(value);
      if (arg === '--skills') options.skills = value.split(',').map(name => name.trim()).filter(Boolean);
      if (arg === '--repo-url') options.repoUrl = value.replace(/\/+$/, '');
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!options.out) throw new Error('--out is required.');
  return options;
}

function listFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files.sort();
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** Calls fn(target, title) for each Markdown link outside fenced code; returns rewritten text. */
function mapLinks(text, fn) {
  let fenced = false;
  return text.split('\n').map(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return line;
    }
    if (fenced) return line;
    return line.replace(LINK, (match, target, title) => `](${fn(target)}${title})`);
  }).join('\n');
}

function splitTarget(target) {
  const hash = target.indexOf('#');
  return hash === -1 ? [target, ''] : [target.slice(0, hash), target.slice(hash)];
}

function isLocalTarget(file) {
  return file !== '' && !/^[a-z][a-z0-9+.-]*:/i.test(file) && !file.startsWith('/');
}

/** Root references reachable from a skill's Markdown, including references they link to. */
function sharedReferences(skillDir, referencesDir) {
  const found = new Set();
  const queue = listFiles(skillDir).filter(file => file.endsWith('.md'));
  while (queue.length) {
    const file = queue.shift();
    mapLinks(fs.readFileSync(file, 'utf8'), target => {
      const [filePart] = splitTarget(target);
      if (!isLocalTarget(filePart)) return target;
      const resolved = path.resolve(path.dirname(file), decodeURI(filePart));
      if (path.dirname(resolved) === referencesDir && resolved.endsWith('.md') && fs.existsSync(resolved) && !found.has(resolved)) {
        found.add(resolved);
        queue.push(resolved);
      }
      return target;
    });
  }
  return [...found].sort();
}

function buildSkill(name, options) {
  const skillDir = path.join(options.pack, 'skills', name);
  const referencesDir = path.join(options.pack, 'references');
  const outDir = path.join(options.out, name);
  if (fs.existsSync(outDir)) {
    if (!options.force) throw new Error(`Output exists: ${outDir} (use --force to replace it)`);
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  // Map each output file to the source location its relative links were written against.
  const sources = new Map();
  for (const file of listFiles(skillDir)) sources.set(path.join(outDir, path.relative(skillDir, file)), file);
  const vendored = new Map();
  for (const reference of sharedReferences(skillDir, referencesDir)) {
    const destination = path.join(outDir, 'references', path.basename(reference));
    if (sources.has(destination)) {
      throw new Error(`${name}: skill file references/${path.basename(reference)} collides with a shared reference`);
    }
    sources.set(destination, reference);
    vendored.set(reference, destination);
  }

  for (const [destination, source] of sources) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (!destination.endsWith('.md')) {
      fs.copyFileSync(source, destination);
      fs.chmodSync(destination, fs.statSync(source).mode);
      continue;
    }
    const rewritten = mapLinks(fs.readFileSync(source, 'utf8'), target => {
      const [filePart, anchor] = splitTarget(target);
      if (!isLocalTarget(filePart)) return target;
      const resolved = path.resolve(path.dirname(source), decodeURI(filePart));
      if (isInside(resolved, skillDir)) {
        const output = path.join(outDir, path.relative(skillDir, resolved));
        return toPosix(path.relative(path.dirname(destination), output)) + anchor;
      }
      if (vendored.has(resolved)) {
        return toPosix(path.relative(path.dirname(destination), vendored.get(resolved))) + anchor;
      }
      if (isInside(resolved, options.pack) && fs.existsSync(resolved)) {
        return `${options.repoUrl}/${toPosix(path.relative(options.pack, resolved))}${anchor}`;
      }
      return target;
    });
    fs.writeFileSync(destination, rewritten);
  }
  return { name, outDir, vendored: [...vendored.keys()].map(file => path.basename(file)) };
}

/** Every local link in a built skill must resolve inside that skill. */
function brokenLinks(outDir) {
  const broken = [];
  for (const file of listFiles(outDir).filter(f => f.endsWith('.md'))) {
    mapLinks(fs.readFileSync(file, 'utf8'), target => {
      const [filePart] = splitTarget(target);
      if (isLocalTarget(filePart)) {
        const resolved = path.resolve(path.dirname(file), decodeURI(filePart));
        if (!isInside(resolved, outDir) || !fs.existsSync(resolved)) broken.push(`${path.relative(outDir, file)} → ${target}`);
      }
      return target;
    });
  }
  return broken;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buffer);
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Minimal deterministic ZIP writer (deflate, UTF-8 names, fixed 1980-01-01 timestamps). */
function writeZip(zipFile, rootDir, prefix) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of listFiles(rootDir)) {
    const name = Buffer.from(`${prefix}/${toPosix(path.relative(rootDir, file))}`, 'utf8');
    const data = fs.readFileSync(file);
    const compressed = zlib.deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(((fs.statSync(file).mode & 0o777) | 0o100000) << 16 >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, compressed);
    centrals.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centrals.length / 2, 8);
  end.writeUInt16LE(centrals.length / 2, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(zipFile, Buffer.concat([...locals, ...centrals, end]));
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(USAGE);
      return;
    }
    const skillsRoot = path.join(options.pack, 'skills');
    const available = fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && fs.existsSync(path.join(skillsRoot, entry.name, 'SKILL.md')))
      .map(entry => entry.name)
      .sort();
    const selected = options.skills || available;
    const unknown = selected.filter(name => !available.includes(name));
    if (unknown.length) throw new Error(`Unknown skill(s): ${unknown.join(', ')}`);
    if (isInside(options.out, skillsRoot)) throw new Error('--out must not be inside the pack skills/ directory.');

    fs.mkdirSync(options.out, { recursive: true });
    for (const name of selected) {
      const result = buildSkill(name, options);
      const broken = brokenLinks(result.outDir);
      if (broken.length) throw new Error(`${name}: unresolved links after build:\n  ${broken.join('\n  ')}`);
      let line = `${name}: ${result.vendored.length} shared reference(s) vendored`;
      if (options.zip) {
        const zipFile = path.join(options.out, `${name}.zip`);
        writeZip(zipFile, result.outDir, name);
        line += `; ${zipFile}`;
      }
      console.log(line);
    }
    console.log(`Built ${selected.length} portable skill(s) in ${options.out}`);
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = { mapLinks, writeZip, crc32 };
