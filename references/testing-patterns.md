# Testing Patterns Reference

Testing principles and examples for the `e6-test-driven-development` skill. Read only the sections the current test needs. The principles (test levels, state-based assertions, DAMP tests, test-double discipline, anti-patterns) apply in any ecosystem. Code examples use JavaScript/TypeScript (Jest, React Testing Library, Supertest, Playwright); in another stack, apply the same principles with the repository's own framework and commands.

## Table of Contents

- [Choosing a Test Level](#choosing-a-test-level)
- [Writing Good Tests](#writing-good-tests)
- [Test Doubles](#test-doubles)
- [Common Assertions](#common-assertions)
- [React/Component Testing](#reactcomponent-testing)
- [API / Integration Testing](#api--integration-testing)
- [E2E Testing (Playwright)](#e2e-testing-playwright)
- [Test Anti-Patterns](#test-anti-patterns)

## Choosing a Test Level

Prefer small, fast tests when they prove the accepted outcome. The pyramid's percentages are illustrative, not quotas: use boundary or end-to-end checks when the risk requires them.

```
          ╱╲
         ╱  ╲         E2E (~5%): full user flows, real browser
        ╱────╲
       ╱      ╲       Integration (~15%): component interactions, API boundaries
      ╱────────╲
     ╱          ╲     Unit (~80%): pure logic, isolated, milliseconds each
    ╱────────────╲
```

If a behavior matters, a test should catch its breakage. Refactors, migrations, and infrastructure changes are not responsible for finding your bugs; your tests are.

### Test sizes (resource model)

| Size | Constraints | Speed | Example |
|---|---|---|---|
| **Small** | Single process; no I/O, network, or database | Milliseconds | Pure functions, data transforms |
| **Medium** | Multiple processes allowed; localhost only; no external services | Seconds | API tests with a test database, component tests |
| **Large** | Multiple machines and external services allowed | Minutes | End-to-end flows, performance benchmarks, staging integration |

Small tests should make up most of the suite: they are fast, reliable, and easy to debug.

### Decision guide

```
Pure logic with no side effects?                → Unit test (small)
Crosses a boundary (API, database, filesystem)? → Integration test (medium)
Critical user flow that must work end to end?   → E2E test (large); limit to critical paths
```

## Writing Good Tests

### Structure: Arrange-Act-Assert

```typescript
it('marks overdue tasks when the deadline has passed', () => {
  // Arrange: set up the scenario
  const task = createTask({ title: 'Test', deadline: new Date('2025-01-01') });

  // Act: perform the behavior under test
  const result = checkOverdue(task, new Date('2025-01-02'));

  // Assert: verify the observable outcome
  expect(result.isOverdue).toBe(true);
});
```

### Test state, not interactions

Assert the outcome of an operation, not which internal methods were called. Interaction-based tests break on refactors even when behavior is unchanged.

```typescript
// Good: state-based — tests what the function does
it('returns tasks sorted by creation date, newest first', async () => {
  const tasks = await listTasks({ sortBy: 'createdAt', sortOrder: 'desc' });
  expect(tasks[0].createdAt.getTime()).toBeGreaterThan(tasks[1].createdAt.getTime());
});

// Bad: interaction-based — tests how it works internally
it('calls db.query with ORDER BY created_at DESC', async () => {
  await listTasks({ sortBy: 'createdAt', sortOrder: 'desc' });
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY created_at DESC'));
});
```

### DAMP over DRY

In production code, DRY is usually right. In tests, prefer **DAMP (Descriptive And Meaningful Phrases)**: each test reads like a specification and tells a complete story without tracing shared helpers. Duplication is acceptable when it makes each test independently understandable.

```typescript
it('rejects tasks with empty titles', () => {
  const input = { title: '', assignee: 'user-1' };
  expect(() => createTask(input)).toThrow('Title is required');
});

it('trims whitespace from titles', () => {
  const input = { title: '  Buy groceries  ', assignee: 'user-1' };
  expect(createTask(input).title).toBe('Buy groceries');
});
```

### One concept per test

```typescript
// Good: each test verifies one behavior
it('rejects empty titles', () => { /* ... */ });
it('trims whitespace from titles', () => { /* ... */ });
it('enforces maximum title length', () => { /* ... */ });

// Bad: everything in one test; the first failure hides the rest
it('validates titles correctly', () => {
  expect(() => createTask({ title: '' })).toThrow();
  expect(createTask({ title: '  hello  ' }).title).toBe('hello');
  expect(() => createTask({ title: 'a'.repeat(256) })).toThrow();
});
```

### Name tests by behavior

```typescript
// Pattern: [unit] [expected behavior] [condition]
describe('TaskService.completeTask', () => {
  it('sets status to completed and records the timestamp', () => {});
  it('throws NotFoundError for a non-existent task', () => {});
  it('is idempotent: completing a completed task is a no-op', () => {});
});

// Bad: vague names
describe('TaskService', () => {
  it('works', () => {});
  it('handles errors', () => {});
});
```

## Test Doubles

Use the simplest double that does the job. The more real code a test runs, the more confidence it gives.

```
Preference order (most to least preferred):
1. Real implementation  → highest confidence, catches real bugs
2. Fake                 → in-memory version of a dependency (e.g. fake DB)
3. Stub                 → returns canned data, no behavior
4. Mock (interaction)   → verifies calls; use sparingly
```

Mock only at boundaries where the real dependency is slow, nondeterministic, or has side effects you cannot control. Over-mocking produces tests that pass while production breaks.

```
Mock these:                    Don't mock these:
├── Database calls             ├── Internal utility functions
├── HTTP requests              ├── Business logic
├── File system operations     ├── Data transformations
├── External API calls         ├── Validation functions
└── Time/Date (when needed)    └── Pure functions
```

### Mock functions (Jest)

```typescript
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: 'test' });
mockFn.mockImplementation((x) => x * 2);

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(3);
```

### Mock modules (Jest)

```typescript
// Mock an entire module
jest.mock('./database', () => ({
  query: jest.fn().mockResolvedValue([{ id: 1, title: 'Test' }]),
}));

// Mock specific exports, keep the rest real
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  generateId: jest.fn().mockReturnValue('test-id'),
}));
```

## Common Assertions

```typescript
// Equality
expect(result).toBe(expected);           // Strict equality (===)
expect(result).toEqual(expected);        // Deep equality (objects/arrays)
expect(result).toStrictEqual(expected);  // Deep equality + type matching

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeNull();
expect(result).toBeDefined();
expect(result).toBeUndefined();

// Numbers
expect(result).toBeGreaterThan(5);
expect(result).toBeLessThanOrEqual(10);
expect(result).toBeCloseTo(0.3, 5);      // Floating point

// Strings
expect(result).toMatch(/pattern/);
expect(result).toContain('substring');

// Arrays / Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('key', 'value');

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(ValidationError);
expect(() => fn()).toThrow('specific message');

// Async
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow(Error);
```

## React/Component Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('TaskForm', () => {
  it('submits the form with entered data', async () => {
    const onSubmit = jest.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    // Find elements by accessible role/label (not test IDs)
    await screen.findByRole('textbox', { name: /title/i });
    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'New Task' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ title: 'New Task' });
    });
  });

  it('shows validation error for empty title', async () => {
    render(<TaskForm onSubmit={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });
});
```

## API / Integration Testing

```typescript
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/tasks', () => {
  it('creates a task and returns 201', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task' })
      .set('Authorization', `Bearer ${testToken}`)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: 'Test Task',
      status: 'PENDING',
    });
  });

  it('returns 422 for well-formed but invalid input', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '' })
      .set('Authorization', `Bearer ${testToken}`)
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without authentication', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Test' })
      .expect(401);
  });
});
```

## E2E Testing (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('user can create and complete a task', async ({ page }) => {
  // Navigate and authenticate
  await page.goto('/');
  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByLabel(/password/i).fill('testpass123');
  await page.getByRole('button', { name: /log in/i }).click();

  // Create a task
  await page.getByRole('button', { name: /new task/i }).click();
  await page.getByRole('textbox', { name: /title/i }).fill('Buy groceries');
  await page.getByRole('button', { name: /create/i }).click();

  // Verify task appears
  const task = page.getByRole('listitem', { name: /buy groceries/i });
  await expect(task).toBeVisible();

  // Complete the task
  await task.getByRole('checkbox', { name: /complete buy groceries/i }).check();
  await expect(task).toHaveCSS('text-decoration-line', 'line-through');
});
```

## Test Anti-Patterns

| Anti-Pattern | Problem | Better Approach |
|---|---|---|
| Testing implementation details | Breaks on refactor even when behavior is unchanged | Test inputs and observable outputs |
| Flaky tests (timing, order, shared state) | Erode trust; an intermittent RED proves nothing | Deterministic inputs and assertions; isolate state; await async work |
| Mocking everything | Tests pass while production breaks | Real > fake > stub > mock; mock only at boundaries |
| Testing third-party code | Wastes time on someone else's bug | Test your code; mock the boundary |
| Snapshot everything | Large snapshots nobody reviews | Assert specific values; review every snapshot change |
| Shared mutable state | Tests pass alone, fail together | Setup and teardown per test |
| Skipping tests to pass CI, or `test.skip` left in | Hides real bugs; dead code | Fix or delete the test |
| Overly broad assertions | Miss regressions | Assert the specific expected value |
| No async error handling | Swallowed errors, false passes | Always `await` async work in tests |
