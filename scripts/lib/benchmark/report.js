'use strict';

// Aggregate run results into a summary and render it as Markdown.

const { mean, bootstrapCI, diffCI, pairedDiffCI, winTieLoss } = require('./stats');

const DIMENSIONS = ['composite', 'outcome', 'testQuality', 'process', 'scope'];
const DIMENSION_LABELS = {
  composite: 'Composite',
  outcome: 'Outcome (hidden tests)',
  testQuality: 'Test quality (mutants killed)',
  process: 'Process',
  scope: 'Scope & safety',
};

function valueOf(run, key) {
  return key === 'composite' ? run.score.composite : run.score.dimensions[key];
}

function scored(runs) {
  return runs.filter(run => run.status === 'scored' || run.status === 'agent-error');
}

function buildSummary({ metadata, runs, judgments = [], seed = 1 }) {
  const arms = metadata.arms.map(arm => arm.id);
  const tasks = metadata.tasks.map(task => task.id);
  const usable = scored(runs);
  const byArm = arm => usable.filter(run => run.arm === arm);
  const overall = {};
  for (const arm of arms) {
    const armRuns = byArm(arm);
    const entry = { runs: armRuns.length };
    for (const key of DIMENSIONS) entry[key] = bootstrapCI(armRuns.map(run => valueOf(run, key)), { seed });
    const rate = pick => {
      const values = armRuns.map(pick).filter(value => value !== null && value !== undefined);
      return values.length ? values.filter(Boolean).length / values.length : null;
    };
    entry.rates = {
      fullPass: rate(run => run.score.hidden.ok),
      redBeforeGreen: rate(run => run.score.process.redBeforeGreen),
      runtimeCheck: rate(run => run.score.process.runtimeCheck),
      testedAfterLastEdit: rate(run => run.score.process.testedAfterLastEdit),
      reviewEvidence: rate(run => run.score.process.reviewEvidence),
      askedBeforeBuilding: rate(run => run.followups.some(f => f.kind === 'answer' || f.kind === 'approval')),
    };
    entry.efficiency = {
      costUsd: mean(armRuns.map(run => run.cost.agentUsd)),
      simulatorUsd: mean(armRuns.map(run => run.cost.simulatorUsd)),
      durationMin: mean(armRuns.map(run => run.durationMs / 60000)),
      turns: mean(armRuns.map(run => run.numTurns)),
      outputTokens: mean(armRuns.map(run => run.usage.output)),
      followups: mean(armRuns.map(run => run.followups.length)),
      subagents: mean(armRuns.map(run => run.score.process.subagents)),
    };
    overall[arm] = entry;
  }

  const perTask = {};
  for (const task of tasks) {
    perTask[task] = {};
    for (const arm of arms) {
      const taskRuns = byArm(arm).filter(run => run.task === task);
      perTask[task][arm] = {
        runs: taskRuns.length,
        composite: bootstrapCI(taskRuns.map(run => run.score.composite), { seed }),
        outcome: mean(taskRuns.map(run => run.score.dimensions.outcome)),
        testQuality: mean(taskRuns.map(run => run.score.dimensions.testQuality)),
        process: mean(taskRuns.map(run => run.score.dimensions.process)),
        costUsd: mean(taskRuns.map(run => run.cost.agentUsd)),
        followups: mean(taskRuns.map(run => run.followups.length)),
      };
    }
  }

  const pairs = [];
  for (let i = 0; i < arms.length; i++) {
    for (let j = i + 1; j < arms.length; j++) {
      const [a, b] = [arms[i], arms[j]];
      const paired = [];
      for (const run of byArm(a)) {
        const other = byArm(b).find(candidate => candidate.task === run.task && candidate.rep === run.rep);
        if (other) paired.push([run.score.composite, other.score.composite]);
      }
      pairs.push({
        a, b,
        composite: diffCI(byArm(a).map(run => run.score.composite), byArm(b).map(run => run.score.composite), { seed }),
        outcome: diffCI(byArm(a).map(run => run.score.dimensions.outcome), byArm(b).map(run => run.score.dimensions.outcome), { seed }),
        pairedComposite: pairedDiffCI(paired, { seed }),
        winTieLoss: winTieLoss(paired, 0.005),
      });
    }
  }

  const judge = {};
  for (const arm of arms) {
    const ratings = judgments.flatMap(judgment => (judgment.byArm?.[arm] ? [judgment.byArm[arm]] : []));
    judge[arm] = ratings.length ? {
      n: ratings.length,
      correctness: mean(ratings.map(r => r.correctness)),
      tests: mean(ratings.map(r => r.tests)),
      readability: mean(ratings.map(r => r.readability)),
      scope: mean(ratings.map(r => r.scope)),
      rankedFirst: ratings.filter(r => r.rank === 1).length / ratings.length,
      meanRank: mean(ratings.map(r => r.rank)),
    } : null;
  }

  const excluded = runs.filter(run => !(run.status === 'scored' || run.status === 'agent-error'))
    .map(run => ({ task: run.task, arm: run.arm, rep: run.rep, status: run.status, reason: run.reason }));
  return { arms, tasks, overall, perTask, pairs, judge, excluded, counts: { total: runs.length, scored: usable.length } };
}

const pct = value => (value === null || value === undefined || Number.isNaN(value) ? 'n/a' : `${Math.round(value * 100)}%`);
const num = (value, digits = 2) => (value === null || value === undefined || Number.isNaN(value) ? 'n/a' : value.toFixed(digits));
const ci = entry => (Number.isNaN(entry.mean) ? 'n/a' : entry.n > 1 ? `${num(entry.mean)} [${num(entry.low)}, ${num(entry.high)}]` : num(entry.mean));

function renderMarkdown(summary, metadata, { includeModel = false, title = 'Benchmark Results' } = {}) {
  const { arms } = summary;
  const label = id => metadata.arms.find(arm => arm.id === id)?.label || id;
  const lines = [];
  lines.push(`# ${title}`, '');
  lines.push(`Run \`${metadata.runId}\` · ${metadata.startedAt.slice(0, 10)} · Claude Code ${metadata.cliVersion} · effort \`${metadata.effort}\` · mode \`${metadata.mode || 'natural'}\` · ${includeModel ? `model \`${metadata.model}\` · ` : ''}${metadata.reps} repetition(s) × ${metadata.tasks.length} task(s) × ${arms.length} arm(s) · ${summary.counts.scored}/${summary.counts.total} runs scored.`);
  if (!includeModel) lines.push('', 'Every arm, the simulated user, and the judge used the same pinned model and effort level; the model id is recorded with the raw results, not in this repository.');
  if (metadata.mode === 'invoked') lines.push('', `Invoked mode: each pack's prompt began with one line asking for its workflow (${metadata.arms.filter(arm => arm.invokePrefix).map(arm => `${arm.label}: "${arm.invokePrefix}"`).join('; ')}); the baseline prompt was unchanged.`);
  lines.push('', '## Arms', '', '| Arm | Source | Fingerprint |', '|---|---|---|');
  for (const arm of metadata.arms) lines.push(`| ${arm.label} | ${arm.source} | \`${(arm.hash || '').slice(0, 12)}\` |`);

  lines.push('', '## Overall scores (mean, 95% bootstrap CI)', '', `| Dimension | ${arms.map(label).join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`);
  for (const key of DIMENSIONS) lines.push(`| ${DIMENSION_LABELS[key]} | ${arms.map(arm => ci(summary.overall[arm][key])).join(' | ')} |`);

  const rateRows = [
    ['All hidden tests pass', 'fullPass'], ['Failing test before code (RED→GREEN)', 'redBeforeGreen'], ['Runtime check (HTTP tasks)', 'runtimeCheck'],
    ['Tests run after last edit', 'testedAfterLastEdit'], ['Review evidence', 'reviewEvidence'], ['Asked or sought approval before finishing', 'askedBeforeBuilding'],
  ];
  lines.push('', '## Behavior rates', '', `| Behavior | ${arms.map(label).join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`);
  for (const [name, key] of rateRows) lines.push(`| ${name} | ${arms.map(arm => pct(summary.overall[arm].rates[key])).join(' | ')} |`);

  const effRows = [
    ['Agent cost per run (USD)', 'costUsd', 3], ['Wall time per run (min)', 'durationMin', 1], ['Turns per run', 'turns', 1],
    ['Output tokens per run', 'outputTokens', 0], ['Simulated-user replies per run', 'followups', 2], ['Subagent dispatches per run', 'subagents', 2],
  ];
  lines.push('', '## Cost and effort', '', `| Measure | ${arms.map(label).join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`);
  for (const [name, key, digits] of effRows) lines.push(`| ${name} | ${arms.map(arm => num(summary.overall[arm].efficiency[key], digits)).join(' | ')} |`);

  lines.push('', '## Head-to-head (composite and outcome difference, 95% CI; paired win/tie/loss)', '', '| Comparison | Composite Δ | Paired composite Δ (same task and rep) | Outcome Δ | W/T/L |', '|---|---|---|---|---|');
  for (const pair of summary.pairs) {
    const fmt = d => (Number.isNaN(d.diff) ? 'n/a' : `${d.diff >= 0 ? '+' : ''}${num(d.diff)} [${num(d.low)}, ${num(d.high)}]`);
    const paired = pair.pairedComposite || { diff: NaN };
    lines.push(`| ${label(pair.a)} vs ${label(pair.b)} | ${fmt(pair.composite)} | ${fmt(paired)}${paired.n ? ` (n=${paired.n})` : ''} | ${fmt(pair.outcome)} | ${pair.winTieLoss.win}/${pair.winTieLoss.tie}/${pair.winTieLoss.loss} |`);
  }

  if (arms.some(arm => summary.judge[arm])) {
    lines.push('', '## Blind review of the final diffs (1–5)', '', `| Axis | ${arms.map(label).join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`);
    for (const axis of ['correctness', 'tests', 'readability', 'scope', 'meanRank', 'rankedFirst']) {
      const name = { meanRank: 'Mean rank (1 = best)', rankedFirst: 'Ranked first' }[axis] || axis[0].toUpperCase() + axis.slice(1);
      lines.push(`| ${name} | ${arms.map(arm => {
        const j = summary.judge[arm];
        if (!j) return 'n/a';
        return axis === 'rankedFirst' ? pct(j[axis]) : num(j[axis]);
      }).join(' | ')} |`);
    }
  }

  lines.push('', '## Per task (composite mean; outcome / test quality / process; cost)', '', `| Task | ${arms.map(label).join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`);
  for (const task of summary.tasks) {
    lines.push(`| \`${task}\` | ${arms.map(arm => {
      const t = summary.perTask[task][arm];
      if (!t.runs) return 'n/a';
      return `**${num(t.composite.mean)}** (${pct(t.outcome)} / ${pct(t.testQuality)} / ${pct(t.process)}; $${num(t.costUsd)})`;
    }).join(' | ')} |`);
  }

  if (summary.excluded.length) {
    lines.push('', '## Excluded runs', '', '| Task | Arm | Rep | Status | Reason |', '|---|---|---|---|---|');
    for (const run of summary.excluded) lines.push(`| ${run.task} | ${label(run.arm)} | ${run.rep} | ${run.status} | ${String(run.reason || '').replace(/\|/g, '\\|').slice(0, 160)} |`);
  }

  lines.push('', '## How to read this', '',
    '- **Outcome** is the fraction of hidden acceptance tests passing on the delivered code (halved if the original tests break). Agents never see these tests.',
    '- **Test quality** runs the agent\'s own tests against the reference solution and against planted bugs (mutants); it is the share of mutants the tests catch. Agent test cases that fail on the reference are ignored; the score is 0 only when none pass.',
    '- **Process** averages: failing test before code (or a baseline run first for refactors), a runtime check on HTTP tasks, tests run after the last edit, and review evidence. It is detected from the transcript and is heuristic.',
    '- **Scope & safety** starts at 1 and loses 0.5 for added dependencies, weakened or deleted existing tests, or a push attempt.',
    `- **Composite** weights: ${Object.entries(metadata.weights).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
    '- The paired composite Δ resamples (task, repetition) pairs together, so task difficulty cancels out; the unpaired Δ resamples each arm on its own.',
    '- Small samples: treat differences whose interval crosses 0 as inconclusive.',
    '', 'Methodology and threats to validity: [evals/benchmark/README.md](../evals/benchmark/README.md).');
  return `${lines.join('\n')}\n`;
}

module.exports = { buildSummary, renderMarkdown, DIMENSIONS };
