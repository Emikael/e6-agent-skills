# Todo: `e6-computer-use`

Plan: `tasks/plan.md`. Implementation has not started.

## Task 1: Skill, triggers, and fixture

- [ ] Add `skills/e6-computer-use/SKILL.md` with the frozen description and CU-1–CU-7 procedure.
- [ ] Add `evals/cases/e6-computer-use.json` (4 positives, 3 negatives, 1 execution eval).
- [ ] Add `evals/fixtures/e6-computer-use/save_probe.py` and `README.md`.
- [ ] `python3 evals/fixtures/e6-computer-use/save_probe.py` exits 2 on this host without writing `saved.txt`, or records the real GUI result if a display exists.
- [ ] `node scripts/validate-skills.js` passes.
- [ ] `node scripts/run-evals.js --min-rank1 95` passes, including existing browser positives.

## Task 2: Route desktop handoffs to the skill

- [ ] Point coordinator, debugging, shipping, documentation, frontend, review, and simplification handoffs at `e6-computer-use` for native/OS GUI only.
- [ ] Add one pointer in `references/workflow-contract.md`.
- [ ] Update living catalog counts to 27 skills / 25 lifecycle specialists. Leave `docs/sdlc-workflow-report.md`.
- [ ] Update build and test command bodies on all three host surfaces. Leave command descriptions unchanged.
- [ ] `node scripts/validate-commands.js`, `validate-reference-links.js`, `validate-artifact-paths.js`, and `run-evals.js --min-rank1 95` pass.

## Checkpoint

- [ ] Task 1 evals are green before Task 2 wiring.
- [ ] Critical/Required review findings on the skill text are resolved and the affected validators rerun.
