# e6-agent-skills

Production-grade engineering skills for AI coding agents. One coordinator skill, `using-e6-agent-skills`, acts as Tech Lead and takes a request from acceptance criteria through a failing test, implementation, runtime verification, review, and a handoff that maps every requirement to its evidence. Specialist skills and personas load only when the change touches their surface.

This is the Claude plugin directory edition. It contains Markdown instructions only.

## What is included

| Component | Count | Purpose |
|---|---|---|
| Skills | 26 | The workflow coordinator plus specialists for specification, planning, test-driven development, debugging, review, security, performance, observability, CI/CD, migration, documentation, and release |
| Agents | 10 | Personas the coordinator staffs by change surface: tech lead, product owner, UI/UX designer, backend, frontend, QA, security, SRE, code reviewer, web performance |
| Commands | 9 | `/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`, `/constraints`, `/webperf` |
| References | Shared | Workflow contract, definition of done, code quality, and testing, security, performance, accessibility, and observability checklists |

## How to use it

Ask for engineering work as usual. The coordinator skill loads when a request is a build, fix, refactor, test, review, plan, migration, or release, and it routes to the right specialist without being named. To enter at a specific phase, use a command such as `/e6-agent-skills:spec` or `/e6-agent-skills:review`.

To apply the workflow rules in every session of a project, copy the short [workflow bootstrap](references/workflow-bootstrap.md) into that project's `CLAUDE.md`.

## What the plugin runs

Nothing. This edition has no hooks, no MCP servers, no scripts, no executables, and no package installs. It makes no network requests and reads no credentials. Every file is Markdown or JSON, plus the PNG icon.

Skills instruct Claude to run your project's own test, lint, and build commands and to edit files in your project, always within the permissions you have granted in the session.

## Difference from the GitHub marketplace edition

The [full repository](https://github.com/Emikael/e6-agent-skills) also ships a `SessionStart` hook that prints the workflow bootstrap at the start of each session, installers for other hosts, validators, and evals. To get that hook, install from the repository's own marketplace instead: `/plugin marketplace add Emikael/e6-agent-skills`, then `/plugin install e6-agent-skills@e6-agent-skills`. The skills, agents, commands, and references are identical in both editions; this one is generated from the same sources at each release.

## License

MIT. See [LICENSE](LICENSE).
