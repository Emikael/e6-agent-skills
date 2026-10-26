"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

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

test("all plugin manifests use the root plugin.json version", () => {
  const expectedVersion = readManifestVersion("plugin.json");
  assert.ok(expectedVersion, "plugin.json must define a version");

  for (const manifestPath of manifestPaths) {
    assert.equal(
      readManifestVersion(manifestPath),
      expectedVersion,
      `${manifestPath} must use version ${expectedVersion}`,
    );
  }
});

test("plugin manifests that name GitHub point at Emikael/e6-agent-skills", () => {
  for (const manifestPath of manifestPaths) {
    const manifest = readManifest(manifestPath);
    const plugin = manifest.plugins?.[0];
    const homepage = manifest.homepage ?? plugin?.homepage;
    const repository = manifest.repository;
    const sourceRepo =
      plugin?.source?.source === "github" ? plugin.source.repo : undefined;

    if (homepage) {
      assert.equal(
        homepage,
        CANONICAL_URL,
        `${manifestPath} homepage must be ${CANONICAL_URL}`,
      );
    }
    if (repository) {
      assert.equal(
        repository,
        CANONICAL_URL,
        `${manifestPath} repository must be ${CANONICAL_URL}`,
      );
    }
    if (sourceRepo) {
      assert.equal(
        sourceRepo,
        CANONICAL_REPO,
        `${manifestPath} source.repo must be ${CANONICAL_REPO}`,
      );
    }
  }
});
