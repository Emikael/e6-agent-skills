# Idea Refine Examples

Read only the example closest to the current idea. Each follows the four steps in SKILL.md: 1. Ground the problem, 2. Expand proportionately, 3. Evaluate and converge, 4. Save the one-pager. Notice the rhythm: one question per turn, variations with reasons, honest pushback, and an assumption list with pass/fail thresholds.

---

## Example 1: Vague early-stage concept (full session)

**User:** "I want to help small local restaurants compete with the big delivery platforms."

### 1. Ground the problem

> How might we give independent restaurants the reach customers expect from delivery apps, within margins a small restaurant can sustain?

One question first: **who are you building for: the restaurant owner, the diner, or both?**

**User:** "Restaurant owners."

Next: **which part of "compete" hurts most: finding customers, delivery logistics, or platform fees?**

**User:** "Fees. They pay 25–30% commission but feel they can't leave because that's where the customers are. I'm thinking software."

So the problem is **customer dependency**, not logistics: restaurants rent access to their own regulars at 30% of revenue.

### 2. Expand proportionately

1. **Direct channel toolkit:** branded web/SMS ordering so known customers reorder direct. Bet: people who already know the restaurant will switch if it is easy.
2. **Inversion: the customer pays:** zero commission; diners pay a small "support local" fee. Bet: enough diners pay $1–2 more.
3. **Constraint removal: no delivery:** pickup-first ordering. Bet: dense neighborhoods don't need delivery.
4. **Combination: restaurant collective:** 20–50 restaurants share one platform and cross-promote.
5. **Audience shift: regulars only:** one-tap "your usual?" reorder for weekly customers. Bet: 20% of customers drive most revenue and don't need discovery.
6. **Expert lens: zero owner effort:** owners are in the kitchen, so the tool must run itself (auto-text lapsed regulars, auto-handle reorders).

Variations 5 and 6 together are the sharpest: a self-running reorder tool for a restaurant's best existing customers. Which directions interest you?

### 3. Evaluate and converge

**User:** "5 and 6. The direct channel (1) feels necessary but boring."

| Direction | User value | Feasibility | Differentiation | What could kill it |
|---|---|---|---|---|
| A: Regulars engine (5+6) | ~$400/yr saved per regular; 50 regulars ≈ $20K/yr | Medium: ordering/payment is commodity; cold start is hard | High: platforms optimize for discovery, not retention | Regulars won't switch channels |
| B: Channel + retention (1+5) | Higher ceiling if both parts work | Low: two products at once | Medium: each half has competitors | Scope |

**Recommendation:** A. Pushback on "necessary but boring": adding the channel first makes this another Square Online clone. SMS reorder needs no new app, which attacks the channel-switching risk directly.

### 4. Save the one-pager

Saved to `docs/ideas/reorder.md`:

```markdown
# ReOrder: keep your regulars ordering direct
## Problem and target user
Independent restaurant owners pay 25–30% platform commission on repeat customers they already know.
## Success
Pilot restaurants move at least 30% of enrolled regulars' repeat orders to direct SMS within 4 weeks, measured from order logs.
## Recommended direction
A self-running, SMS-first reorder tool for each restaurant's regulars. No marketplace, no app, no discovery.
## Assumptions to validate
- Regulars will reorder by SMS instead of their delivery app — experiment: 5 restaurants × 20 regulars; pass if ≥30% of their repeat orders arrive by SMS, fail if <10%; time limit: 4 weeks.
- Owners can list their top regulars with phone numbers — experiment: ask 10 owners to do it; pass if ≥7 finish in under 15 minutes, fail if ≤3; time limit: 1 week.
- Commission savings motivate setup effort — experiment: 10 owner interviews; pass if ≥6 commit to the pilot, fail if ≤2; time limit: 2 weeks.
## MVP scope
Owner enters regulars (name, phone, usual order); customer gets a text, confirms by reply, pays by link; owner receives the order by text. Pickup only.
## Not doing, and why
- Delivery logistics: expensive and not the core problem; pickup validates demand.
- Discovery or marketplace: the platforms' game; we compete on retention.
- Branded apps or websites: commodity; does not solve the behavior change.
- Analytics dashboards: owners are in the kitchen; send a weekly text summary instead.
## Open decisions
- SMS marketing consent rules in the pilot region.
- Pricing: per-order fee or monthly subscription.
```

---

## Example 2: Feature in an existing product (codebase-aware)

**User:** "Explore adding real-time collaboration to our document editor."

### 1. Ground the problem

The agent reads the code first: blocks with flat ordering (`src/models/document.ts:45`), REST persistence, no WebSocket layer.

> How might we let several people edit one document at once within the current block model?

**Question:** "Do collaborators usually edit the same paragraph, or different sections?"

**User:** "Different sections, 2–5 people. We're losing deals to tools that already have this."

The second answer matters: this may be a checkbox feature (needed to stay in consideration), which caps the investment.

### 2. Expand proportionately

1. **Block-level locking:** a block locks while someone edits it; others see presence. Fits the block model with a `locked_by` field and a presence channel.
2. **Inversion: async-first:** suggestions and comments merged by the owner.
3. **Simplification: presence only:** show who is where; no co-editing.
4. **Combination: document branches:** edit independently, then merge, reusing versioning.

### 3. Evaluate and converge

Directions cluster into "minimum viable co-editing" (1 or 3) and "differentiated model" (2 or 4). For closing deals soon, recommend 1: real co-editing at low cost. Variation 3 is cheaper but may not satisfy the checkbox.

### 4. Save the one-pager

The one-pager recommends block-level locking. Assumption: "Prospects accept block-level locking as real-time collaboration — experiment: demo to 8 prospects; pass if ≥6 rate it sufficient, fail if ≤3; time limit: 3 weeks." Not doing: character-level CRDTs (complexity), offline sync (not needed for 2–5 users).

---

## Example 3: Process idea, one-recommendation fast path

**User:** "Our weekly retros are stale. Just give me your one best recommendation."

The user asked for one answer, so the agent skips choice rounds and asks only the question whose answer changes the recommendation: **"Do action items from retros actually get done?"**

**User:** "No, they pile up. People think it's theater."

The signal is the output layer, not the format. The agent weighs alternatives internally (async retros, anonymous input, one-question retros) and returns:

```markdown
# One-action retro
## Problem and target user
An 8-person team disengages because retro action items never ship.
## Success
Three consecutive retros each end with their single action demonstrably done.
## Recommended direction
Each retro picks exactly one action item with an owner and deadline; the next retro opens with a 5-minute demo of it.
## Assumptions to validate
- Limiting to one item makes it ship — experiment: next 3 retros; pass if ≥2 of 3 actions are demoed done, fail if 0; time limit: 3 weeks.
## MVP scope
Change the agenda only; no new tools.
## Not doing, and why
- New retro tooling: the problem is follow-through, not tooling.
## Open decisions
None.
```

---

## What to notice

1. **The restatement changes the frame.** "Compete with platforms" becomes "retain existing customers"; "stale retros" becomes "broken follow-through".
2. **One question per turn.** Each answer decides which kind of problem this is before the next question.
3. **Variations have reasons.** Each names its lens and core bet.
4. **The agent has opinions and pushes back** with concrete reasons.
5. **Assumptions are testable.** Each has an experiment, pass and fail thresholds, and a time limit.
6. **The output matches the domain.** Code-aware ideas cite real paths; process ideas produce zero-cost experiments.
