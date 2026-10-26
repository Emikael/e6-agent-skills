# Accessibility Checklist

Quick reference for WCAG 2.2 AA conformance. Use alongside the `e6-frontend-ui-engineering` skill. Success-criterion numbers are given for the checks WCAG 2.2 added or changed.

## Table of Contents

- [Essential Checks](#essential-checks)
- [WCAG 2.2 Additions](#wcag-22-additions)
- [Common HTML Patterns](#common-html-patterns)
- [Testing Tools](#testing-tools)
- [Quick Reference: ARIA Live Regions](#quick-reference-aria-live-regions)
- [Common Anti-Patterns](#common-anti-patterns)

## Essential Checks

### Keyboard Navigation
- [ ] All interactive elements focusable via Tab key
- [ ] Focus order follows visual/logical order
- [ ] Focus is visible (outline/ring on focused elements)
- [ ] Focused element is not entirely hidden by sticky headers, footers, banners, or overlays (2.4.11)
- [ ] Custom widgets have keyboard support (Enter to activate, Escape to close)
- [ ] No keyboard traps (user can always Tab away from a component)
- [ ] Skip-to-content link at top of page - visible (at least) on keyboard focus
- [ ] Modals trap focus while open, return focus on close

### Screen Readers
- [ ] All images have `alt` text (or `alt=""` for decorative images)
- [ ] All form inputs have associated labels (`<label>` or `aria-label`)
- [ ] Buttons and links have descriptive text (not "Click here")
- [ ] Icon-only buttons have `aria-label`
- [ ] Page has one `<h1>` and headings don't skip levels
- [ ] Dynamic content changes announced (`aria-live` regions)
- [ ] Tables have `<th>` headers with scope

### Visual
- [ ] Text contrast ≥ 4.5:1 (normal text) or ≥ 3:1 (large text: 24px regular, or 18.66px bold)
- [ ] UI components contrast ≥ 3:1 against background
- [ ] Color is not the only way to convey information
- [ ] Text resizable to 200% without breaking layout
- [ ] No content that flashes more than 3 times per second

### Forms
- [ ] Every input has a visible label
- [ ] Required fields indicated (not by color alone)
- [ ] Error messages specific and associated with the field
- [ ] Error state visible by more than color (icon, text, border)
- [ ] Form submission errors summarized and focusable
- [ ] Known fields use autocomplete (for example `type="email" autocomplete="email"`)

### Content
- [ ] Language declared (`<html lang="en">`)
- [ ] Page has a descriptive `<title>`
- [ ] Links distinguish from surrounding text (not by color alone)
- [ ] Pointer targets at least 24×24 CSS px, or spaced so a 24 px circle around each does not overlap another target (2.5.8); 44×44 px is the stronger touch recommendation
- [ ] Meaningful empty states (not blank screens)

## WCAG 2.2 Additions

Criteria new in WCAG 2.2 at Level A or AA; AA conformance requires all of them. Check them explicitly, because older audit tools and checklists often miss them.

- [ ] **2.4.11 Focus Not Obscured (Minimum), AA:** a focused component is never fully covered by author-created content such as sticky headers, cookie banners, or chat widgets.
- [ ] **2.5.7 Dragging Movements, AA:** every drag action (reorder, slider, map pan, drag-to-upload) has a single-pointer alternative, such as buttons, a click target, or a menu.
- [ ] **2.5.8 Target Size (Minimum), AA:** pointer targets are at least 24×24 CSS px, or have enough spacing; exceptions include inline text links and targets whose size is essential.
- [ ] **3.2.6 Consistent Help, A:** help mechanisms (contact details, chat, help link) appear in the same relative order on every page that offers them.
- [ ] **3.3.7 Redundant Entry, A:** information the user already entered in the same process is auto-filled or selectable, not re-typed (except for security or when the earlier value is no longer valid).
- [ ] **3.3.8 Accessible Authentication (Minimum), AA:** no login step requires a cognitive function test (recalling a password, transcribing a code, solving a puzzle) unless an alternative or assisting mechanism exists. Allow paste and password managers. Object-recognition and personal-content checks are permitted at AA.

**Removed in 2.2:** 4.1.1 Parsing is obsolete. Do not fail an audit on HTML parsing errors alone; duplicate IDs still matter when they break accessible names or relationships (1.3.1, 4.1.2).

## Common HTML Patterns

### Buttons vs. Links

```html
<!-- Use <button> for actions -->
<button onClick={handleDelete}>Delete Task</button>

<!-- Use <a> for navigation -->
<a href="/tasks/123">View Task</a>

<!-- NEVER use div/span as buttons -->
<div onClick={handleDelete}>Delete</div>  <!-- BAD -->
```

### Form Labels

```html
<!-- Explicit label association -->
<label htmlFor="email">Email address</label>
<input id="email" type="email" required />

<!-- Implicit wrapping -->
<label>
  Email address
  <input type="email" required />
</label>

<!-- Hidden label (visible label preferred) -->
<input type="search" aria-label="Search tasks" />
```

### ARIA Roles

```html
<!-- Navigation -->
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Footer links">...</nav>

<!-- Status messages -->
<div role="status" aria-live="polite">Task saved</div>

<!-- Alert messages -->
<div role="alert">Error: Title is required</div>

<!-- Modal dialogs: open native <dialog> with showModal(); setting `open` alone is non-modal -->
<dialog aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Delete</h2>
  ...
</dialog>

<!-- Loading states -->
<div aria-busy="true" aria-label="Loading tasks">
  <Spinner />
</div>
```

### Accessible Lists

```html
<ul role="list" aria-label="Tasks">
  <li>
    <input type="checkbox" id="task-1" aria-label="Complete: Buy groceries" />
    <label htmlFor="task-1">Buy groceries</label>
  </li>
</ul>
```

## Testing Tools

```bash
# Automated audit
npx axe-core          # Programmatic accessibility testing
npx pa11y             # CLI accessibility checker

# In browser
# Chrome DevTools → Lighthouse → Accessibility
# Chrome DevTools → Elements → Accessibility tree

# Screen reader testing
# macOS: VoiceOver (Cmd + F5)
# Windows: NVDA (free) or JAWS
# Linux: Orca
```

## Quick Reference: ARIA Live Regions

| Value | Behavior | Use For |
|-------|----------|---------|
| `aria-live="polite"` | Announced at next pause | Status updates, saved confirmations |
| `aria-live="assertive"` | Announced immediately | Errors, time-sensitive alerts |
| `role="status"` | Same as `polite` | Status messages |
| `role="alert"` | Same as `assertive` | Error messages |

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `div` as button | Not focusable, no keyboard support | Use `<button>` |
| Missing `alt` text | Images invisible to screen readers | Add descriptive `alt` |
| Color-only states | Invisible to color-blind users | Add icons, text, or patterns |
| Autoplaying media | Disorienting, can't be stopped | Add controls, don't autoplay |
| Custom dropdown with no ARIA | Unusable by keyboard/screen reader | Use native `<select>` or proper ARIA listbox |
| Removing focus outlines | Users can't see where they are | Style outlines, don't remove them |
| Empty links/buttons | "Link" announced with no description | Add text or `aria-label` |
| `tabindex > 0` | Breaks natural tab order | Use `tabindex="0"` or `-1` only |
