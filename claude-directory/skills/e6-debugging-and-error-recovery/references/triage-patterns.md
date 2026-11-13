# Triage Patterns

Read only the failure class relevant to the current task. Use the repository's own language, runtime and commands.

## Error-Specific Patterns

### Test Failure Triage

```
Test fails after code change:
├── Did you change code the test covers?
│   └── YES → Check if the test or the code is wrong
│       ├── Test contradicts accepted requirement → Update with cited requirement evidence
│       └── Code has a bug → Fix the code
├── Did you change unrelated code?
│   └── YES → Likely a side effect → Check shared state, imports, globals
└── Test was already flaky?
    └── Check for timing issues, order dependence, external dependencies
```

### Build Failure Triage

```
Build fails:
├── Type error → Read the error, check the types at the cited location
├── Import error → Check the module exists, exports match, paths are correct
├── Config error → Check build config files for syntax/schema issues
├── Dependency error → Check manifest/lockfile and use documented restore command
└── Environment error → Check project runtime/version and OS compatibility
```

### Runtime Error Triage

```
Runtime error:
├── TypeError: Cannot read property 'x' of undefined
│   └── Something is null/undefined that shouldn't be
│       → Check data flow: where does this value come from?
├── Network error / CORS
│   └── Check URLs, headers, server CORS config
├── Render error / White screen
│   └── Check error boundary, console, component tree
└── Unexpected behavior (no error)
    └── Add logging at key points, verify data at each step
```

## Intermittent failures

- Timing: timestamps, deterministic scheduling hooks or local concurrency/load
  can reveal a race. Do not add arbitrary sleeps as the permanent fix.
- Environment: compare versions, configuration, data and CI execution context.
- State: reproduce alone and after preceding operations; inspect leaked globals,
  caches, fixtures and shared resources.
- Not reproducible: preserve conditions, add minimal non-sensitive diagnostics,
  state what remains unknown. No claim of a proven root cause or fixed behavior.

## Regression bisection

Use a separate clean checkout/worktree where possible. Record the initial ref,
known-good ref and deterministic failure command. Protect existing edits before
any checkout. Run the focused test at candidate commits; distinguish a true
failure from an unavailable historical environment. Finish with `git bisect reset`
and verify the original ref/worktree state was restored. Do not mix bisection
with changes to the user's working tree.

## Instrumentation

Add logs only to resolve a specific uncertainty: timing, request flow or state.
Exclude sensitive values. Remove temporary debugging output after verification;
keep justified operational error reporting/metrics through
`e6-observability-and-instrumentation`. Do not hide missing critical config with
empty-string fallbacks or claim a graceful fallback repaired the root cause.
