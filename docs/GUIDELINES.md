# AI Workflow Guidelines

> How to use the spec-driven development files in this repo. Read this before starting any feature larger than a small bugfix.

---

## What this is

A lightweight, file-based process for shipping technical features with AI agents. Every non-trivial feature gets a folder under `specs/` with a set of markdown files filled in phase by phase before code is written.

The template format is aligned with **GitHub's [spec-kit](https://github.com/github/spec-kit)** methodology: numbered requirements (`FR-NNN`), Given-When-Then acceptance criteria, a Constitution check gate in the plan, and task IDs with parallelization markers — adopted directly into our existing structure without any extra tooling.

Small bugfixes, config tweaks, and one-PR changes go straight to implementation as before. This process kicks in for anything that would normally need a design discussion first.

---

## Part 1 — Agent behavioral rules (`CLAUDE.md`)

Four rules that apply to every AI agent on every task. They exist because LLMs left unguided fail in four predictable ways: guessing instead of asking, overbuilding, touching unrelated code, and losing track of what "done" means.

| Rule | What it stops | What you'll notice |
|---|---|---|
| **Think before coding** | Silent assumptions on ambiguous requirements | Agent asks before guessing, or states its assumption explicitly |
| **Simplicity first** | Overbuilt, speculative code | Shorter diffs, no unused abstractions or "just in case" config |
| **Surgical changes** | Drive-by refactoring, unrelated edits | PRs only touch lines that trace back to the task |
| **Goal-driven execution** | Vague, unverifiable completion | Agent states a numbered plan with a verify step before starting |

Always active — no invocation needed. If an agent violates one, point it out and ask it to redo within scope.

---

## Part 2 — Spec-driven development (`specs/`)

### When to use it

**Use** for: new features, anything touching multiple files or services, anything with unclear requirements, anything that would normally get a design discussion.

**Skip** for: bugfixes, copy changes, config tweaks, anything closeable in one small PR with no open design questions.

### File structure

```
specs/
└── <feature-slug>/
    ├── research.md   ← Phase 0 (optional): technical spike
    ├── spec.md       ← Phase 1: what the system must do
    ├── plan.md       ← Phase 2: how it will be built
    ├── tasks.md      ← Phase 3: implementation checklist
    └── notes.md      ← ongoing: decisions & deviations (append-only)
```

Files are filled in **in order**. No phase starts until the previous file has `status: approved`.

---

### Phase 0 (optional) — `research.md` — Technical spike

Create this only when there is a genuine technical unknown that could change the architecture. Examples: "does MongoDB change streams perform well enough to replace polling at our scale?" or "which WebSocket library handles reconnect reliably under high churn?"

If the team already knows the stack and risks are understood, skip straight to Phase 1.

**Contents:** the question, options evaluated with actual references or benchmarks, and a clear recommendation that the plan can act on.

---

### Phase 1 — `spec.md` — What the system must do

**Owner:** Engineer leading the feature
**Approver:** Another engineer or tech lead

This is a **technical spec**, not a product requirements doc. It describes what the system must do at the API/data/behaviour level — not business goals, user journeys, or personas. If you catch yourself writing "so that the user can feel confident," stop — that belongs in a product doc, not here.

**Sections:**

- **Context** — 2–3 sentences on why this needs to exist at the system level.
- **Technical requirements** — High-level functional requirements written technically. These feed directly into acceptance criteria.
- **Acceptance criteria** — FR-NNN numbered, Given-When-Then format (see below).
- **Out of scope** — Adjacent work explicitly excluded to prevent scope creep.
- **Open questions** — Unresolved technical questions that must be answered before moving to Phase 2.

#### Acceptance criteria format

Use `FR-NNN` numbering and **Given-When-Then** structure. The number gives every requirement a stable ID for tracing through plan and tasks. Given-When-Then forces the criterion to be testable without ambiguity.

```markdown
- [ ] **FR-001:** Invite by email
      Given an admin submits the invite form with a valid email and role
      When POST /api/users/invite is called
      Then an email is sent with a 72-hour accept link and an InviteToken
      exists in the DB; no User document is created yet.

- [ ] **FR-002:** Immediate deactivation
      Given an admin sets a user's status to inactive
      When the deactivated user makes any authenticated request
      Then 401 is returned, regardless of whether their access token is still
      within its TTL.
```

A criterion like "the invite flow works" can't be verified — it's a wish. `FR-001` above can be verified by any engineer who has never seen the feature.

**Independent testability:** each FR must be verifiable on its own, without other FRs being complete first. If two requirements are inseparable to test, they belong in a single entry. This rule is what makes parallel implementation strategies (see Phase 3) viable.

Don't move to Phase 2 until `status: approved`.

---

### Phase 2 — `plan.md` — How it will be built

**Owner:** Engineer or tech lead writing the plan
**Approver:** Senior engineer / architecture review

Takes the approved spec and adds: architecture overview, tech stack choices with rationale, data model, API contracts, integration points, ADRs for non-trivial decisions, and risks.

Every non-trivial choice needs an ADR entry: **Problem / Options considered / Chosen solution / Reasoning**. "We used X" is not an ADR. "We chose X over Y because Z, and accepted tradeoff Q" is.

#### Constitution check

The plan includes a **Constitution check** — a short list of org-level rules confirmed against this specific implementation before tasks can start.

```markdown
## Constitution check

- [ ] No new infrastructure dependency introduced without an ADR.
- [ ] All API errors follow `{ error: string }` shape.
- [ ] No business logic in route handlers — service layer owns it.
- [ ] All secrets managed via environment variables, never hardcoded.
- [ ] <add any feature-specific constraints here>
```

This connects the abstract principles in `CLAUDE.md` to the concrete decisions in this plan. If a checkbox can't be checked, either the plan changes or an ADR documents why the exception is justified. Re-evaluate whenever scope changes.

Don't start code based on a plan that isn't `status: approved`.

---

### Phase 3 — `tasks.md` — Implementation checklist

**Owner:** Engineer writing the plan (or whoever breaks it down)
**Reviewer:** Senior engineer (quick skim, not a full gate)

Breaks the plan into atomic tasks, each closeable in one PR with a concrete verify step.

#### Task format

```markdown
- [ ] **T001:** Define Mongoose schemas — users and invite_tokens, all indexes.
      Verify: db.users.getIndexes() shows expected indexes without errors.

- [ ] **T002 [P]:** Implement bootstrap admin logic. Satisfies: FR-001 (precondition).
      Verify: Fresh instance + env vars → one admin in DB. Second instance → no duplicate.

- [ ] **T003 [P] [US1]:** Implement JWT auth middleware and login/refresh endpoints.
      Verify: Tests pass for valid token, expired token, inactive user, tampered signature.
```

**Markers:**

| Marker | Meaning |
|---|---|
| `T001`, `T002` | Unique task ID — used in dependency diagrams and PR titles |
| `[P]` | Can run **in parallel** with other `[P]` tasks at the same dependency level |
| `[US1]` | References a user story or requirement from `spec.md` for traceability |

**`[P]` in practice:** Once `T001` merges, any tasks marked `[P]` at the next level can all start simultaneously. Without the marker, sequential is assumed.

#### Execution strategy

Pick one before writing the task list — it determines how you order work:

| Strategy | When to use | How it works |
|---|---|---|
| **MVP First** | Validating a design before full build-out | Complete foundations, then implement only the highest-priority story end-to-end. Ship and learn before going wider. |
| **Incremental delivery** | Sequential team, risk of changing requirements | Build and validate P1 → P2 → P3 in order. Each story is complete and testable before the next begins. |
| **Parallel team** | Multiple developers, independent stories | Once foundations are done, distribute stories across developers simultaneously. Only safe when stories share no conflicting state. |

Document the chosen strategy at the top of `tasks.md` so the team isn't guessing.

The file ends with a dependency tree:

```
T001 (schemas — foundational)
  ├─► T002 [P]  bootstrap admin
  ├─► T003 [P]  auth middleware
  └─► T004 [P]  invite flow API

       T003 ──► T005  admin endpoints
       T003 ──► T006 [P]  self-service endpoints

       T005 ──► T007 [P]  admin UI
       T004 ──► T008 [P]  invite UI
       T006 ──► T009 [P]  profile UI

       T007 + T008 + T009 ──► T010  runbook
```

---

### Phase 4 — Implementation

**Owner:** Developer agent (frontend / backend / fullstack)
**Approver:** Peer review → standard PR approval

Work through `tasks.md` top to bottom, checking off tasks as you go. Any deviation from the plan — a library didn't work, a query was too slow, a requirement turned out to be ambiguous — gets logged in `notes.md` with the date.

`notes.md` is **append-only**. Add a new dated entry; never edit past ones.

---

### Living specifications — when requirements change

Specs are not locked after approval. When requirements change during implementation, the rule is: **update the spec first, then cascade**.

1. Revise or add the relevant `FR-NNN` entries in `spec.md`.
2. Set `status: in-review`, get it re-approved.
3. Update `plan.md` — affected ADRs, data model, API contracts.
4. Update `tasks.md` — add, remove, or revise affected tasks.
5. Log the change and its reason in `notes.md`.

Never patch the implementation to cover a stale spec. A spec that no longer matches the code is actively harmful — it misleads the next engineer (or agent) who reads it.

---

### Session hygiene

**One chat per phase.** Start a fresh Claude conversation for each feature phase (spec, plan, tasks). Context from a previous phase bleeds into the next one — old decisions, rejected options, and abandoned directions all stay loaded and quietly influence outputs. A clean session keeps reasoning focused on the current phase only.

**One chat per feature.** Don't mix two features in the same conversation. When you switch features, start fresh. You keep the project-level context from CLAUDE.md; you drop the irrelevant baggage of the previous feature.

**Front-load context, don't re-explain mid-task.** Put all relevant background at the start of the session — the spec file, the constraint, the decision already made. Don't drip-feed context as you go; Claude works with what it had at the start.

---

### Starting a new feature

```bash
mkdir -p specs/<your-feature-slug>
cp templates/spec.md templates/plan.md templates/tasks.md templates/notes.md specs/<your-feature-slug>/
```

Open `specs/<your-feature-slug>/spec.md` and start with context + FR-NNN acceptance criteria. Each template has inline guidance.

---

### Approval gates

| Phase | File | Approver | Blocks |
|---|---|---|---|
| 0 | `research.md` | Tech lead (informal) | Phase 2 if research was required |
| 1 | `spec.md` | Senior engineer / tech lead | Phase 2 |
| 2 | `plan.md` | Senior engineer / arch review | Phase 3 |
| 3 | `tasks.md` | Senior engineer (informal) | Phase 4 |
| 4 | code / PR | Peer review → PR approval | Merge |

No phase starts until the previous file is `status: approved`.

---

## FAQ

**Do I have to use this for every task?**
No — only for features that would normally need a design discussion. Small fixes go straight to implementation.

**What if I skip a phase to save time?**
Don't. The point is catching bad architecture and ambiguous requirements before code exists, which is far cheaper than catching them in review or production.

**When do I need `research.md`?**
Only when there's a genuine technical unknown that could change the architecture. If the stack is understood, skip it.

**Why FR-NNN instead of a plain checklist?**
Numbered requirements create a stable ID you can reference from tasks (`T005` satisfies `FR-002, FR-003`), ADRs, and PR descriptions. A plain checklist can't be traced.

**Why Given-When-Then?**
It forces you to specify: what state the system is in before the action, what the action is, and what observable outcome proves it worked. That's the bar for "done" in Phase 4.

**What does `[P]` mean in tasks?**
That task can run in parallel with other `[P]` tasks at the same dependency level. Default is sequential.

**What if requirements change mid-implementation?**
Update `spec.md` first, bump `status` back to `in-review`, get it re-approved, then cascade changes into `plan.md` and `tasks.md`. Never patch the code to cover a stale spec — fix the spec. See the Living specifications section above.

**Which execution strategy should I pick for tasks?**
MVP First if you're validating the design before full build-out. Incremental if stories have unclear requirements or the team is sequential. Parallel if you have multiple developers and the stories are genuinely independent. When unsure, Incremental is the safest default.

**What does independent testability mean for FR-NNN?**
Each requirement must be verifiable on its own — without waiting for another FR to be complete first. If you can't test FR-003 without FR-004, merge them into one entry. Independent testability is what makes parallel task execution safe.

**Can I edit `notes.md` entries?**
No — append-only. Add a new dated entry instead of editing old ones.

---

## Quick reference

```bash
# Start a new feature
mkdir -p specs/my-feature
cp templates/spec.md templates/plan.md templates/tasks.md templates/notes.md specs/my-feature/

# Check phase status across all active features
grep -r "^status:" specs/*/spec.md

# Find features waiting on plan approval
grep -r "^status: in-review" specs/*/plan.md

# Find features still in draft
grep -r "^status: draft" specs/*/spec.md
```

For the full rationale behind this process, see `docs/spec-driven-development.md`.
