#!/usr/bin/env node

"use strict";

const { readFileSync } = require("node:fs");

const CANONICAL_REPO = "Emikael/e6-agent-skills";
const CANONICAL_URL = `https://github.com/${CANONICAL_REPO}`;

const manifestPaths = [
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];

function readManifest(manifestPath) {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function readManifestVersion(manifestPath) {
  const manifest = readManifest(manifestPath);
  return manifest.version ?? manifest.plugins?.[0]?.version;
}

function assertCanonicalGithub(manifestPath) {
  const manifest = readManifest(manifestPath);
  const plugin = manifest.plugins?.[0];
  const homepage = manifest.homepage ?? plugin?.homepage;
  const repository = manifest.repository;
  const sourceRepo =
    plugin?.source?.source === "github" ? plugin.source.repo : undefined;

  const checks = [
    ["homepage", homepage, CANONICAL_URL],
    ["repository", repository, CANONICAL_URL],
    ["source.repo", sourceRepo, CANONICAL_REPO],
  ];

  for (const [label, value, expected] of checks) {
    if (value == null) continue;
    if (value !== expected) {
      throw new Error(
        `${manifestPath} ${label} is ${value}; expected ${expected}`,
      );
    }
  }
}

const expectedVersion = readManifestVersion("plugin.json");
if (!expectedVersion) {
  throw new Error("plugin.json is missing a version field");
}

for (const manifestPath of manifestPaths) {
  const version = readManifestVersion(manifestPath);
  if (version !== expectedVersion) {
    throw new Error(
      `${manifestPath} has version ${version ?? "<missing>"}; expected ${expectedVersion}`,
    );
  }
  assertCanonicalGithub(manifestPath);
}

console.log(`All plugin manifests use version ${expectedVersion}.`);
console.log(`GitHub clone and marketplace sources point at ${CANONICAL_REPO}.`);
