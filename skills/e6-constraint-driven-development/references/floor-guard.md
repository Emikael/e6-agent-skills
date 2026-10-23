# Floor guard: reference implementation

The **floor** is a diff-scoped review aid for changes to constraints, tests, and checker behavior. This reference provides consistent diff plumbing and shallow patterns; it cannot determine semantic test strength or prove that a checker enforces its policy.

Adapt the patterns to your stack and verify them against real violations and legitimate replacements before making this a blocking gate.

## Contract

- **Input:** the diff between the merge base and the working tree (added *and* removed lines, plus untracked files). A guard that reads only `git diff` misses new files and staged-but-uncommitted work.
- **Patterns:** threshold weakening/removal, changed or removed inline check commands or explicit `Check:`/`Checker:`/`Command:` fields in a constraint rule, skips/deleted tests, unmatched assertion-call removals, suppressions, stubs/empty `catch`, and new Exceptions rows.
- **Exit codes:** `0` no pattern finding, `1` a finding needs review before automatic approval, `2` the guard could not run (no merge base, not a git repo). Never let a `2` read as a `0`; `0` is not proof of semantic enforcement.
- **Reports category and `path:line` only, never matched source or command values.** Removed-line locations refer to the merge-base version; added-line locations refer to the working tree. Redaction is not optional.
- **Numeric tightening with an unchanged checker is silent.** Checker-definition changes require review even with identical or tighter thresholds. A finding is not automatically proof of weakening.

## Reference (Node, ~stack-agnostic patterns)

```js
#!/usr/bin/env node
// floor-guard.mjs — shallow, diff-scoped review of the CONSTRAINTS.md floor.
// Usage: node floor-guard.mjs [--base <ref>]   (default base: origin/main)
import { execFileSync } from 'node:child_process';

const base = (() => {
  const i = process.argv.indexOf('--base');
  return i > -1 ? process.argv[i + 1] : 'origin/main';
})();

// `git diff --no-index` exits 1 whenever the two sides differ, which is the normal case for a
// new file, so that output is kept. Any other failure is null, and null never reads as clean.
const git = (args, { diffExit = false } = {}) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { return diffExit && e.status === 1 && typeof e.stdout === 'string' ? e.stdout : null; }
};
const bail = (msg) => { console.error('floor-guard: ' + msg); process.exit(2); };

// Merge base; bail to exit 2 rather than pretending a shallow/rootless clone is clean.
const mergeBase = git(['merge-base', base, 'HEAD'])?.trim();
if (!mergeBase) bail('no merge base against ' + base);

// Unified diff plus untracked files (git diff alone cannot see new files).
const tracked = git(['diff', '--unified=0', mergeBase, '--']);
if (tracked === null) bail('could not diff against ' + mergeBase);
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard']);
if (untrackedFiles === null) bail('could not list untracked files');
const untracked = untrackedFiles.split('\n').filter(Boolean).map((f) => {
  const d = git(['diff', '--no-index', '--unified=0', '/dev/null', f], { diffExit: true });
  if (d === null) bail('could not diff untracked file ' + f);
  return d;
}).join('\n');
const diff = tracked + '\n' + untracked;

// Walk the diff. Both headers name the file, so a deletion (`+++ /dev/null`) keeps its name.
const added = [], removed = [], deleted = [];
const pathOf = (s) => s.replace(/^[ab]\//, '');
let file = '', oldFile = '', oldLine = 0, newLine = 0, hunk = 0;
for (const line of diff.split('\n')) {
  if (line.startsWith('--- ')) oldFile = pathOf(line.slice(4));
  else if (line.startsWith('+++ ')) {
    const newFile = pathOf(line.slice(4));
    file = newFile === '/dev/null' ? oldFile : newFile;
    if (newFile === '/dev/null') deleted.push({ file, line: 1 });
  }
  else if (line.startsWith('@@ ')) {
    const range = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (!range) bail('could not parse diff hunk');
    oldLine = Number(range[1]); newLine = Number(range[2]); hunk++;
  }
  else if (line.startsWith('+')) added.push({ file, text: line.slice(1), line: newLine++, hunk });
  else if (line.startsWith('-')) removed.push({ file, text: line.slice(1), line: oldLine++, hunk });
  else if (line.startsWith(' ')) { oldLine++; newLine++; }
}

const findings = [];
const flag = (rule, location) => findings.push({ rule, file: location.file, line: location.line });
const isTest = (f) => /\.(test|spec)\.|_test\.|test_/.test(f);
const isConstraints = (f) => /CONSTRAINTS\.md$/.test(f);

// 1. Silenced checker — extend this list for your ecosystem.
const SUPPRESSIONS = /@ts-ignore|@ts-nocheck|eslint-disable|biome-ignore|# *noqa|# *type: *ignore|istanbul ignore|nosemgrep|gitleaks:allow|Stryker disable/;
// 4. Unfinished work.
const STUBS = /throw new (Error|NotImplemented).*[Nn]ot implemented|catch\s*\(\w*\)\s*\{\s*\}|catch\s*\{\s*\}|\bTODO\b|\bpass\s*# *stub/;
// 2. A test made easier (added skips).
const SKIPS = /\.(skip|todo)\b|\bxit\(|\bxdescribe\(|@pytest\.mark\.skip|t\.Skip\(/;

for (const location of added) {
  const { file, text } = location;
  if (SUPPRESSIONS.test(text)) flag('silenced-checker', location);
  if (STUBS.test(text)) flag('unfinished-work', location);
  if (SKIPS.test(text)) flag('test-made-easier', location);
  if (isConstraints(file) && /^\| *(W|E)\d+ *\|/.test(text)) flag('new-exception', location);
}

// 2b. Count recognizable assertions within each hunk, not removed keyword lines.
// Imports are not assertions. A replacement call is not automatically a weakening.
// This cannot judge the strength of a replacement, multiline semantics, or moved checks.
for (const location of deleted) if (isTest(location.file)) flag('test-deleted', location);
const deletedFiles = new Set(deleted.map((x) => x.file));
const assertionCount = (text) => /^\s*(\/\/|#|\*)/.test(text) ? 0
  : (text.match(/\b(?:expect|assert|should)\s*(?:\.\s*[A-Za-z_$]\w*)?\s*\(|^\s*assert\s+\S|\.should\b/g) ?? []).length;
const assertionHunks = new Map();
for (const location of removed) {
  if (!isTest(location.file) || deletedFiles.has(location.file)) continue;
  const count = assertionCount(location.text);
  if (!count) continue;
  const key = location.file + '\0' + location.hunk;
  const group = assertionHunks.get(key) ?? { removed: [], added: 0 };
  for (let i = 0; i < count; i++) group.removed.push(location);
  assertionHunks.set(key, group);
}
for (const location of added) {
  const group = assertionHunks.get(location.file + '\0' + location.hunk);
  if (group) group.added += assertionCount(location.text);
}
for (const group of assertionHunks.values()) {
  for (const location of group.removed.slice(group.added)) flag('assertion-removed', location);
}

// 1b/2c. A rule in CONSTRAINTS.md weakened or removed. A rule is a floor bullet or a table row,
// identified by the bullet's text before its first colon or by the row's first cell. Each number
// carries a direction read from the words around it: a minimum (>=, at least, must not fall) is
// loosened by going down, a maximum (<=, at most, under, must not grow) by going up. A number whose
// direction cannot be read is reported whenever it changes, because the guard cannot tell
// tightening from loosening and staying quiet is the wrong default. Numbers are paired within
// their direction (the first minimum with the first minimum, and so on), so a number added
// elsewhere in the text does not shift the pairing; a threshold with no counterpart after the
// edit was removed, and an added one tightens.
const ruleKey = (t) => {
  const s = t.trim();
  if (s.startsWith('|')) return s.split('|').map((c) => c.trim()).filter(Boolean)[0] ?? '';
  if (/^[-*] /.test(s)) return s.slice(2).split(':')[0].trim();
  return null; // prose, headings, dates: not a rule
};
const isException = (t) => /^\| *(W|E)\d+ *\|/.test(t.trim());
// Treat opaque inline check references and explicitly labeled plain commands as
// review cues. Pure numeric threshold spans are handled by thresholds instead.
// This does not inspect checker implementation, schedules, or arbitrary prose commands.
const checkerParts = (t) => [
  ...[...t.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter((s) =>
    !/^(?:[<>]=?|[≥≤])?\s*\d+(?:\.\d+)?\s*(?:%|ms|s|kb|mb|gb)?$/i.test(s)),
  ...[...t.matchAll(/\b(?:check(?:er)?|command)\s*:\s*([^|]+)/gi)].map((m) => m[1].trim()),
];
const MIN_BEFORE = /(>=|>|≥|at least|minimum|\bmin\b|no less than|not fall|not drop)\s*$/;
const MAX_BEFORE = /(<=|<|≤|at most|maximum|\bmax\b|no more than|under|below|not grow|not exceed)\s*$/;
const MIN_AFTER = /^\s*\S*\s*(or more|or higher|must not fall|must not drop)/;
const MAX_AFTER = /^\s*\S*\s*(or less|or lower|must not grow|must not exceed)/;
const thresholds = (t) => {
  const out = [], re = /\d+(?:\.\d+)?/g;
  let m;
  while ((m = re.exec(t))) {
    const before = t.slice(Math.max(0, m.index - 24), m.index).toLowerCase();
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 40).toLowerCase();
    const dir = MIN_BEFORE.test(before) || MIN_AFTER.test(after) ? 'min'
      : MAX_BEFORE.test(before) || MAX_AFTER.test(after) ? 'max' : null;
    out.push({ n: Number(m[0]), dir });
  }
  return out;
};
const removedRules = removed.filter((l) => isConstraints(l.file) && ruleKey(l.text) !== null);
const addedRules = added.filter((l) => isConstraints(l.file) && ruleKey(l.text) !== null);
for (const r of removedRules) {
  const a = addedRules.find((x) => x.file === r.file && ruleKey(x.text) === ruleKey(r.text));
  if (!a) {
    if (!isException(r.text)) flag('rule-removed', r); // dropping an exception tightens: silent
    continue;
  }
  if (!isException(r.text) && JSON.stringify(checkerParts(r.text)) !== JSON.stringify(checkerParts(a.text))) {
    flag('checker-changed', a);
  }
  const before = thresholds(r.text), after = thresholds(a.text);
  let verdict = null;
  for (const dir of ['min', 'max', null]) {
    const was = before.filter((x) => x.dir === dir), now = after.filter((x) => x.dir === dir);
    was.forEach((b, i) => {
      const n = now[i];
      if (verdict) return;
      if (!n) verdict = 'threshold-removed';
      else if (n.n === b.n) return;
      else if (dir === 'min' ? n.n < b.n : dir === 'max' ? n.n > b.n : true) {
        verdict = dir ? 'threshold-loosened' : 'threshold-changed';
      }
    });
  }
  if (verdict) flag(verdict, a);
}

if (findings.length === 0) { console.log('floor-guard: clean'); process.exit(0); }
console.error('floor-guard: ' + findings.length + ' finding(s) require review:');
for (const f of findings) console.error(`  [${f.rule}] ${f.file}:${f.line}`);
if (findings.some((f) => f.rule === 'rule-removed')) {
  console.error('\nA rule-removed finding can also mean the rule\'s label changed: rename a rule in one commit and change its thresholds in another.');
}
if (findings.some((f) => f.rule === 'threshold-removed')) {
  console.error('\nA threshold-removed finding can also mean a number gained or lost its direction words (">= 80%" becoming "80%", or the reverse): compare the two lines before assuming a threshold was deleted.');
}
if (findings.some((f) => f.rule === 'checker-changed')) {
  console.error('\nChecker text changed. Verify its command and implementation; this does not prove weakening.');
}
console.error('\nReview findings against accepted requirements. Fix actual weakening or use an authorized tracked exception.');
process.exit(1);
```

## Adapting it

- **Adapt patterns to the stack.** Include its suppression, stub, skip, assertion, and constraint-command forms. Plain unlabeled commands and checker scripts/configuration/schedules outside recognized constraint fields need separate review and executable gate tests. Opaque inline-code changes are conservative review cues, not proof that a checker was disabled.
- **Assertion replacement is a heuristic.** Recognizable calls added in the same diff hunk offset removed calls. Stronger or equivalent replacements are not accused solely because a source line disappeared. A weaker replacement can also pass this count, and moved assertions can still produce a finding. Review changed assertion meaning against acceptance criteria; use language-aware analysis when needed.
- **Exemptions are Exceptions rows, not an ignore file.** A justified exception is an `E<n>` or `W<n>` row in `CONSTRAINTS.md` with rule, path, reason, owner, authority, and expiry (see the template in [SKILL.md](../SKILL.md)). The guard flags each new row for review and stays silent when a row is removed, because removing an exception tightens the floor. It does not read any ignore file.
- **This is a starting point, not complete semantic enforcement.** Prove checker behavior by deliberately breaching each blocking policy, observing the intended failure, restoring it, and observing a clean result. A clean guard result cannot establish meaningful assertions, complete test coverage, or an enforced quality threshold. Once the heuristics are insufficient, use a real runner and language-aware checks.
