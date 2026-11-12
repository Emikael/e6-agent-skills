# Code Quality

The standing bar for code written or reviewed under e6. Apply it in proportion to the change. A five-line fix does not need a new abstraction, and the project's own conventions override generic advice.

## Design

- **Single responsibility.** Each function or module has one reason to change. Split when a name needs "and".
- **Depend on abstractions at boundaries only.** Inject I/O (clock, network, storage, randomness) where tests or a second implementation need it. Do not wrap everything in interfaces.
- **Open for extension where variation is real.** Use a lookup table or strategy when cases grow. Prefer neither for two fixed branches.
- **Substitutable and small interfaces.** Callers depend on the narrowest contract they use.
- **Clean architecture direction.** Domain rules do not import frameworks, transport, or storage. Adapters (HTTP, database, UI) depend on the domain, never the reverse. Keep side effects at the edges.
- **Patterns earn their place.** Introduce a pattern only when it removes real duplication or coupling that exists now. Name it in the code only if the team uses that vocabulary.

## Clean code

- Names say what a value means in the domain. No abbreviations the team does not use.
- Functions are short, do one thing, and sit at one level of abstraction. Return early instead of nesting.
- No dead code, debug output, commented-out blocks, or speculative options.
- Errors are explicit:
  - validate at the boundary;
  - fail with a typed or coded error;
  - never swallow an exception;
  - never log and rethrow the same error twice.
- No duplicated business rules. Shared logic lives in one place.
- Keep changes in the existing style of the file and project.

## Comments

**Delete by default.** Code and tests carry the meaning; a comment that restates the code is noise and goes stale.

Keep a comment only for:

1. **Why, not what:** a non-obvious reason, constraint, or trade-off the code cannot show.
2. **Behavior forced from outside:** a workaround for a library bug, a protocol quirk, a regulatory rule (with a link).
3. **Public API documentation** the project's conventions require (JSDoc, docstrings).
4. **Links** to an issue, spec, or ADR that explains a decision.
5. **Tool directives** (`// eslint-disable-next-line …` with a reason, license headers).

When a comment states a rule ("must be called before X"), encode the rule as a test, an assertion, or a type instead, and delete the comment. When editing existing code, do not add narration and do not delete other people's comments outside the change.

## Tests

- Test observable behavior through the public interface. Do not test private helpers or call order.
- Each test names the defect it would catch. If no plausible bug makes it fail, delete it.
- Cover the boundaries the change introduced: empty, one, many, limits, invalid input, permissions, errors, concurrency where relevant.
- Keep tests independent and deterministic: injected clock and randomness, no shared mutable state.

## Review checklist

- [ ] Responsibilities are separated; dependencies point toward the domain.
- [ ] No duplicated rule, dead code, or speculative abstraction.
- [ ] Errors are explicit and handled at the right layer.
- [ ] No narrating, stale, or redundant comments were added.
- [ ] Tests cover the new behavior and its boundaries through the public interface.
