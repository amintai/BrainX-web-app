# Spec-Driven Development

## Purpose

Replace ad-hoc "describe a feature, get code back" prompting with a structured pipeline that produces durable, reviewable artifacts at each phase — aligned with GitHub's [spec-kit](https://github.com/github/spec-kit) methodology, adapted to work natively with Claude Code and plain markdown files instead of a separate CLI.

Specs are **living artifacts**, not one-time documents. When requirements change, the spec is updated first, then the plan, then the tasks — never the other way around. Code serves the specification; the specification does not serve the code.

---

## Why markdown, not a CLI

spec-kit uses slash commands (`/speckit.specify`, `/speckit.plan`, etc.) backed by a `.specify/` directory and the `specify` CLI. We don't need that — Claude Code reads markdown natively, and plain files under `specs/` give us the same phase discipline with zero extra tooling, full git history, and compatibility with any AI agent.

---

## The five artifacts

Each feature lives in its own folder: `specs/<feature-slug>/`

```
specs/
└── <feature-slug>/
    ├── research.md   — Phase 0 (optional): spike for genuine unknowns
    ├── spec.md       — Phase 1: what the system must do (FR-NNN + GWT)
    ├── plan.md       — Phase 2: how it will be built + constitution check
    ├── tasks.md      — Phase 3: atomic checklist, IDs, parallelism markers
    └── notes.md      — ongoing: append-only decision log
```

---

## Phase 0 — Research (`research.md`) — optional

**When to create:** Only when there is a genuine technical unknown that could change the architecture. If the team already understands the stack and the risks, skip straight to Phase 1.

**Contents:** the question under investigation, options evaluated with actual references or benchmarks (not opinions), and a clear recommendation the plan can act on.

**Exit criteria:** A single recommendation is written down. The question is resolved enough that the plan can make a firm decision without re-opening it.

---

## Phase 1 — Spec (`spec.md`)

**Owner:** Engineer leading the feature
**Approver:** Senior engineer or tech lead
**Template:** `spec.md` at the repo root

### What belongs here

This is a **technical specification**, not a product requirements doc. It describes what the system must do at the API, data, and behaviour level.

Required sections:

| Section | Purpose |
|---|---|
| **Context** | 2–3 sentences on why this needs to exist at the system level |
| **Technical requirements** | High-level functional requirements, written technically |
| **Acceptance criteria** | FR-NNN numbered, Given-When-Then format (see below) |
| **Out of scope** | Adjacent work explicitly excluded to prevent scope creep |
| **Open questions** | Technical questions that must be resolved before Phase 2 |

### Acceptance criteria — FR-NNN + Given-When-Then

Every criterion gets a stable ID (`FR-001`, `FR-002`, …) so it can be referenced from plan, tasks, ADRs, and PR descriptions. Given-When-Then forces the criterion to be verifiable without ambiguity.

```
- [ ] **FR-001:** <short title>
      Given <precondition — system state before the action>
      When <action — what is triggered>
      Then <outcome — observable, specific, testable>
```

**Rule:** each FR must be independently testable. You should be able to verify FR-003 without FR-004 being complete. If two FRs are inseparable, they belong together in one entry.

### Exit criteria

- All open questions are resolved inline.
- Every acceptance criterion can be verified end-to-end by an engineer who has not seen the feature before.
- `status: approved` is set in the frontmatter.

---

## Phase 2 — Plan (`plan.md`)

**Owner:** Engineer or tech lead writing the plan
**Approver:** Senior engineer / architecture review
**Template:** `plan.md` at the repo root

### What belongs here

Takes the approved spec and adds: architecture overview, tech stack choices with rationale, data model, API contracts, integration points, ADRs, risks, and the constitution check.

Every non-trivial decision needs an ADR entry:

```
### ADR-N: <Decision title>
- **Problem:**
- **Options considered:**
- **Chosen solution:**
- **Reasoning:**
```

"We used X" is not an ADR. "We chose X over Y because Z, and accepted tradeoff Q" is.

**Extended thinking for hard ADRs:** For decisions with significant architectural consequences — choosing a storage engine, picking an auth strategy, evaluating a third-party dependency — enable extended thinking mode before generating the ADR. This forces step-by-step reasoning across tradeoffs rather than pattern-matching to a familiar answer. Prompt:
```
Think through this carefully before responding. Work through the tradeoffs step by step,
surface where you're uncertain, then give your recommendation with explicit reasoning.
```

### Constitution check

A list of org-level rules confirmed against this specific implementation before tasks can start. Re-evaluated on every scope change.

```
## Constitution check

- [ ] No new infrastructure dependency introduced without an ADR.
- [ ] All API errors follow { error: string } shape.
- [ ] No business logic in route handlers — service layer owns it.
- [ ] All secrets managed via environment variables, never hardcoded.
- [ ] <add feature-specific constraints>
```

If a checkbox cannot be checked, either the plan changes or an ADR explicitly justifies the exception. This section is a hard gate — tasks do not start until it is fully checked off.

### Exit criteria

- All FR-NNN requirements from `spec.md` are traceable to at least one component of the plan.
- Constitution check is fully ticked.
- Every ADR has a written reasoning (not just a decision).
- Plan has passed a sparring partner review (see below).
- `status: approved` is set.

---

## Sparring partner review

Before `plan.md` moves to `status: approved`, run it through a sparring partner review. This is distinct from a standard code review — the goal is to find what's wrong before it gets built, not to polish what's already been decided.

**Three-step structure:**

**Step 1 — Attack.** Ask Claude (or a peer) to find every flaw in the plan, not comment on it:
```
Here is my plan: [paste plan.md]

Your job is to attack it. Find every assumption that could be wrong. Find every way
this architecture could fail in production. Argue the strongest possible case against
each major decision. Do not be diplomatic. Do not add qualifications. Just attack.
```

**Step 2 — Steelman.** Ask for the strongest case in favour:
```
Now steelman the plan. Build the best possible argument for why each major decision
is correct. Assume the author had good reasons even where they aren't stated.
```

**Step 3 — Honest verdict.** Ask for a direct assessment:
```
Given both sides, what do you actually think? What is the single biggest risk
in this plan, and what would you change before implementation starts?
```

Log the outcome in `notes.md`. If the attack surfaces a real problem, revise the plan before approving it. If it holds up, that confidence is itself valuable — note it.

---

## Phase 3 — Tasks (`tasks.md`)

**Owner:** Engineer breaking down the plan
**Reviewer:** Senior engineer (quick skim, not a hard gate)
**Template:** `tasks.md` at the repo root

### Task format

```
- [ ] **T001:** <description>. Satisfies: FR-001.
      Verify: <concrete, observable check>

- [ ] **T002 [P] [US1]:** <description>
      Verify: <concrete, observable check>
```

| Marker | Meaning |
|---|---|
| `T001` | Unique task ID — used in dependency trees and PR titles |
| `[P]` | Parallel — can start simultaneously with other `[P]` tasks at the same dependency level |
| `[US1]` | User story or requirement reference back to `spec.md` |

### Execution strategies

Choose one before writing the task list. The choice affects ordering:

**MVP First** — complete foundational work, then implement only the highest-priority story (P1) end-to-end before touching others. Ship and validate before going wider.

**Incremental delivery** — build and validate each story sequentially (P1 → P2 → P3). Each story is complete and testable before the next begins.

**Parallel team** — once foundations are done, distribute stories across developers simultaneously. Only viable when stories have no shared state that would cause conflicts.

### Dependency tree

Every `tasks.md` ends with an explicit dependency tree showing which tasks block others and which can run in parallel:

```
T001 (foundational)
  ├─► T002 [P]
  ├─► T003 [P]
  └─► T004 [P]
       T003 ──► T005
       T005 ──► T006 [P]
       T004 ──► T007 [P]
       T006 + T007 ──► T008
```

### Exit criteria

- Every task closes in one PR.
- Every task has a concrete, verifiable `Verify:` line.
- Every FR from `spec.md` maps to at least one task.
- Dependency tree is explicit and complete.

---

## Phase 4 — Implementation

**Owner:** Developer or developer agent
**Approver:** Peer review → standard PR approval

Work through `tasks.md` top to bottom. Check off each task when its PR merges.

Any deviation from the plan — a library didn't work, a query was too slow, a requirement was ambiguous in practice — gets logged in `notes.md` with the date. Do not silently diverge from the approved plan.

---

## Living specifications — handling change

Specs are not locked after approval. When requirements change during implementation:

1. Update `spec.md` — revise or add the relevant FR-NNN entries.
2. Set `status: in-review` on `spec.md`.
3. Get it re-approved.
4. Cascade changes into `plan.md` (update affected ADRs, data model, API contracts).
5. Update `tasks.md` — add, remove, or revise affected tasks.
6. Log the change and reason in `notes.md`.

Never patch implementation to paper over a stale spec. Fix the spec first.

---

## Approval gates summary

| Phase | File | Approver | Hard gate? |
|---|---|---|---|
| 0 | `research.md` | Tech lead | No — only if research was required |
| 1 | `spec.md` | Senior engineer / tech lead | Yes |
| 2 | `plan.md` | Senior engineer / arch review | Yes |
| 3 | `tasks.md` | Senior engineer | Soft (skim) |
| 4 | PR | Peer review | Yes |

---

## What this enforces

| CLAUDE.md principle | How spec-driven development enforces it |
|---|---|
| Think before coding | Spec phase exists to surface ambiguity before any code is written |
| Simplicity first | Plan must justify every non-trivial dependency with an ADR |
| Surgical changes | Tasks are atomic; each task traces to specific FRs |
| Goal-driven execution | Every task has a `Verify:` line; every phase has exit criteria |
| Never introduce technical debt knowingly | Architecture is locked in plan before implementation, not improvised mid-PR |
| Document important decisions | ADRs in `plan.md`, deviations in `notes.md` — both required |
