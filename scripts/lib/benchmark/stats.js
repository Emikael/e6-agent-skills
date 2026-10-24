'use strict';

// Small, dependency-free statistics with a seeded RNG so reports are reproducible.

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
}

function sd(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1));
}

function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/** Percentile bootstrap CI of the mean. */
function bootstrapCI(values, { iterations = 2000, seed = 1, level = 0.95 } = {}) {
  if (values.length === 0) return { mean: NaN, low: NaN, high: NaN, n: 0 };
  if (values.length === 1) return { mean: values[0], low: values[0], high: values[0], n: 1 };
  const random = mulberry32(seed);
  const means = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < values.length; j++) sum += values[Math.floor(random() * values.length)];
    means.push(sum / values.length);
  }
  means.sort((a, b) => a - b);
  const alpha = (1 - level) / 2;
  return { mean: mean(values), low: quantile(means, alpha), high: quantile(means, 1 - alpha), n: values.length };
}

/** Bootstrap CI of mean(a) - mean(b), resampling each group independently. */
function diffCI(a, b, { iterations = 2000, seed = 1, level = 0.95 } = {}) {
  if (!a.length || !b.length) return { diff: NaN, low: NaN, high: NaN };
  const random = mulberry32(seed);
  const diffs = [];
  const resampleMean = values => {
    let sum = 0;
    for (let j = 0; j < values.length; j++) sum += values[Math.floor(random() * values.length)];
    return sum / values.length;
  };
  for (let i = 0; i < iterations; i++) diffs.push(resampleMean(a) - resampleMean(b));
  diffs.sort((x, y) => x - y);
  const alpha = (1 - level) / 2;
  return { diff: mean(a) - mean(b), low: quantile(diffs, alpha), high: quantile(diffs, 1 - alpha) };
}

/** Win/tie/loss of paired observations (same task and repetition), tolerance for ties. */
function winTieLoss(pairs, tolerance = 1e-9) {
  const result = { win: 0, tie: 0, loss: 0 };
  for (const [a, b] of pairs) {
    if (Math.abs(a - b) <= tolerance) result.tie++;
    else if (a > b) result.win++;
    else result.loss++;
  }
  return result;
}

function shuffle(items, seed) {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

module.exports = { mulberry32, mean, sd, quantile, bootstrapCI, diffCI, winTieLoss, shuffle };
