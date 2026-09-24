# Hackathon Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create four `.claude/` artifacts — one agent and three skills — that keep the BrainX team aligned to all six hackathon judging criteria throughout the build day.

**Architecture:** A read-only `hackathon-scorer` agent acts as the shared evaluation engine, scoring all six criteria against the live repo state. Three skills (`/hackathon-align`, `/hackathon-check`, `/hackathon-demo`) invoke it at morning, midday, and end-of-day respectively and write their output to `docs/hackathon/`. No application code is touched.

**Tech Stack:** Claude Code agent/skill markdown format only. No TypeScript, no dependencies, no test framework — verification is manual invocation and output inspection.

**Spec:** `docs/superpowers/specs/2026-09-23-hackathon-tooling-design.md`

## Global Constraints

- All files are plain markdown following the frontmatter schema used by existing `.claude/agents/` and `.claude/skills/` files
- Agents: frontmatter fields `name`, `description`, `tools`, `model`, `color`, `permissionMode` — match existing casing and field order
- Skills: frontmatter fields `name`, `description`, `tools` — no `model` or `color` on skills
- `hackathon-scorer` is read-only — `tools` must never include `Write` or `Edit`
- Output paths are always `docs/hackathon/alignment.md`, `docs/hackathon/check.md`, `docs/hackathon/demo-script.md` — exact names, no variation
- The judging criteria weights are fixed: C1 20%, C2 20%, C3 20%, C4 15%, C5 15%, C6 10% — never alter these in any artifact
- Skills write their output files themselves via Write tool; the scorer agent only returns structured text

## Review Focus

- **Scorer invoked with empty repo:** if `docs/hackathon/alignment.md` does not exist when `/hackathon-check` runs, the skill must not crash — it should note the missing file and proceed with what it can read.
- **Time input edge case:** if the user enters an end time earlier than the current time in `/hackathon-check`, the skill must flag the inconsistency rather than producing a negative-hours action list.
- **Missing criteria coverage:** if the scorer finds zero evidence for a criterion, its score must be 0 and the gap must appear in the output — it must not be silently omitted.
- **Demo script with all-red criteria:** `/hackathon-demo` must still produce a complete script even if scoring is poor — the mitigation statement path (FR-D2) must always fire for criteria < 6, not just sometimes.
- **Alignment.md partial answers:** if the user leaves a question blank during `/hackathon-align`, the output file must mark that criterion's projected score as `unscored` and flag it as a risk — not assign a default score.

---

## File Map

| File                                 | Action     | Responsibility           |
| ------------------------------------ | ---------- | ------------------------ |
| `.claude/agents/hackathon-scorer.md` | Create     | Read-only scoring engine |
| `.claude/skills/hackathon-align.md`  | Create     | Morning kickoff dialogue |
| `.claude/skills/hackathon-check.md`  | Create     | Midday gap analysis      |
| `.claude/skills/hackathon-demo.md`   | Create     | End-of-day demo pack     |
| `docs/hackathon/`                    | Create dir | Output landing zone      |

---

## Task Dependencies

```
T001 (hackathon-scorer)
  └── T003 (hackathon-check) — references scorer by agent name
  └── T004 (hackathon-demo) — references scorer by agent name
T002 (hackathon-align) — independent, no dependencies
```

T001 and T002 can be done in parallel. T003 and T004 require T001.

---

### Task T001: `hackathon-scorer` agent

**Files:**

- Create: `.claude/agents/hackathon-scorer.md`

**Interfaces:**

- Produces: an agent named `Hackathon Scorer` that, when invoked, reads the repo and returns a structured scoring report as plain text (no file writes). Skills in T003 and T004 reference it by invoking the Agent tool with `subagent_type: "Hackathon Scorer"` or by calling it via the skills' own instructions.

- [ ] **Step 1: Create the agent file with correct frontmatter**

Create `.claude/agents/hackathon-scorer.md` with this exact frontmatter and system prompt:

```markdown
---
name: Hackathon Scorer
description: Read-only evaluation engine for the Tntra AI-Native Hackathon 2026. Scores the current repo state against all six judging criteria and returns a structured gap report. Invoked by /hackathon-check and /hackathon-demo — never called directly by the team.
tools: Read, Bash
model: sonnet
color: orange
permissionMode: plan
---

You are the Hackathon Scorer — a read-only evaluation engine for the Tntra AI-Native Hackathon 2026.

## Your only job

Read the current state of the repository and return a structured scoring report against the six judging criteria. You never write files, never edit code, and never give implementation advice. You return a report and nothing else.

## Judging criteria

| #   | Criterion                                 | Weight |
| --- | ----------------------------------------- | ------ |
| C1  | Business Value & Relevance                | 20%    |
| C2  | AI-Native Solution Advantage              | 20%    |
| C3  | AI-Native Ways of Working & Collaboration | 20%    |
| C4  | Innovation & Differentiation              | 15%    |
| C5  | Solution Effectiveness & Evidence         | 15%    |
| C6  | Human Experience & Demonstration          | 10%    |

## What to read before scoring

Read ALL of the following before scoring anything:

1. `docs/hackathon/alignment.md` — team's stated intent and projected scores (if it exists)
2. `CLAUDE.md` — stack, conventions, process
3. All files under `specs/` — feature specs and their status
4. All files under `docs/` — architecture decisions, plans
5. `apps/api/src/` and `apps/web/src/` — implementation evidence
6. Run `git log --oneline -30` — evidence of AI-native workflow phases (spec → plan → tasks → implement commits)
7. `.claude/agents/` and `.claude/skills/` — evidence of AI tooling in use

If `docs/hackathon/alignment.md` does not exist, note this at the top of the report and continue scoring from what you can read.

## Scoring rules

- Score each criterion 0–10 based only on evidence you can point to in the repo
- If you find zero evidence for a criterion, score it 0 — do not assign a default
- Do not inflate scores for effort or intent — only observable output counts
- Weighted total = (C1×20 + C2×20 + C3×20 + C4×15 + C5×15 + C6×10) / 10

## Report format

Return this exact structure. Do not deviate.
```

## Hackathon Score Report

### C1 — Business Value & Relevance (20%)

**Score:** X/10 **Weighted:** X.X/20
**Evidence found:** [bullet list of specific files/commits/docs that support the score]
**Gaps:** [bullet list of what is missing or weak]
**Top action:** [one concrete thing that would raise this score]

### C2 — AI-Native Solution Advantage (20%)

**Score:** X/10 **Weighted:** X.X/20
**Evidence found:** [...]
**Gaps:** [...]
**Top action:** [...]

### C3 — AI-Native Ways of Working & Collaboration (20%)

**Score:** X/10 **Weighted:** X.X/20
**Evidence found:** [...]
**Gaps:** [...]
**Top action:** [...]

### C4 — Innovation & Differentiation (15%)

**Score:** X/10 **Weighted:** X.X/15
**Evidence found:** [...]
**Gaps:** [...]
**Top action:** [...]

### C5 — Solution Effectiveness & Evidence (15%)

**Score:** X/10 **Weighted:** X.X/15
**Evidence found:** [...]
**Gaps:** [...]
**Top action:** [...]

### C6 — Human Experience & Demonstration (10%)

**Score:** X/10 **Weighted:** X.X/10
**Evidence found:** [...]
**Gaps:** [...]
**Top action:** [...]

---

### Weighted Total: XX.X / 100

### Gap Priority (ranked by score impact)

1. [Highest-impact gap — criterion, what it costs, what fixes it]
2. [Second-highest]
3. [Third-highest]
4. [Fourth-highest]
5. [Fifth-highest]

```

## What you must not do

- Do not write any files
- Do not suggest code changes — only name the gap; the calling skill formats recommendations
- Do not score based on what the team told you they plan to do — only what exists now
- Do not combine or skip criteria
```

- [ ] **Step 2: Verify the frontmatter parses correctly**

Open `.claude/agents/hackathon-scorer.md` and confirm:

- `name:` is `Hackathon Scorer` (exact casing)
- `tools:` contains only `Read` and `Bash` (no Write, no Edit)
- `permissionMode:` is `plan`
- No tab characters in frontmatter — YAML requires spaces

- [ ] **Step 3: Verify agent appears in Claude Code**

Run `claude` in the terminal and type `/agents` or check that the agent is listed. Alternatively, confirm the file exists at the correct path:

```bash
ls -la .claude/agents/hackathon-scorer.md
```

Expected: file present, non-zero size.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/hackathon-scorer.md
git commit -m "feat(.claude): add Hackathon Scorer evaluation agent"
```

---

### Task T002: `/hackathon-align` skill

**Files:**

- Create: `.claude/skills/hackathon-align.md`
- Creates at runtime: `docs/hackathon/alignment.md`

**Interfaces:**

- Consumes: nothing (morning skill, runs before anything exists)
- Produces: `docs/hackathon/alignment.md` — read by T003 and T004 skills at runtime

- [ ] **Step 1: Ensure the output directory exists**

```bash
mkdir -p docs/hackathon
```

- [ ] **Step 2: Create the skill file**

Create `.claude/skills/hackathon-align.md`:

````markdown
---
name: hackathon-align
description: Morning kickoff skill for the Tntra AI-Native Hackathon 2026. Runs an interactive 8-question dialogue to frame the team's problem and solution against all six judging criteria. Writes docs/hackathon/alignment.md with projected scores, risks, and build priority. Run this before writing any code.
tools: Read, Write
---

# Hackathon Align — Morning Kickoff

You are running the morning alignment session for the Tntra AI-Native Hackathon 2026. Your job is to help the team frame their problem and solution against the six judging criteria **before** they start building — so every build decision is score-aware from the start.

## Judging criteria (for your reference)

| #   | Criterion                                 | Weight |
| --- | ----------------------------------------- | ------ |
| C1  | Business Value & Relevance                | 20%    |
| C2  | AI-Native Solution Advantage              | 20%    |
| C3  | AI-Native Ways of Working & Collaboration | 20%    |
| C4  | Innovation & Differentiation              | 15%    |
| C5  | Solution Effectiveness & Evidence         | 15%    |
| C6  | Human Experience & Demonstration          | 10%    |

## How to run this session

Ask the eight questions below **one at a time**. Wait for the answer before asking the next. Do not rush or combine questions. If an answer is vague, ask one clarifying follow-up before moving on. If the team skips a question, note it as `[unanswered]` and flag it as a risk in the output.

After all eight questions are answered (or skipped), write `docs/hackathon/alignment.md` using the format below.

## The eight questions

**Q1 — Problem (C1)**
"What problem are you solving, and who feels this pain most acutely? Be specific — name the role, the situation, and what goes wrong today."

**Q2 — Measurable impact (C1)**
"How will you know it worked? What is the concrete before/after delta — time saved, errors reduced, decisions improved, cost cut?"

**Q3 — AI's role (C2)**
"What does AI do in this solution that a non-AI approach could not do as well — or at all? Be specific about the AI task: classifying, generating, reasoning, summarising, predicting?"

**Q4 — Non-AI comparison (C2, C4)**
"What is the best non-AI alternative to your solution? Why is yours meaningfully better — not just 'faster', but what outcome changes?"

**Q5 — Team composition (C3)**
"Which functions are represented on your team today? (Engineering, QA, Design, Business, DevOps, Consulting, other?)"

**Q6 — Innovation angle (C4)**
"What is genuinely novel or non-obvious about your approach? What would a conventional team do, and why are you doing something different?"

**Q7 — Prototype plan (C5)**
"What will your working prototype demonstrate by end of day? What is the one scenario a judge can watch live?"

**Q8 — Pitch sentence (C6)**
"Write one sentence: what does your solution do, for whom, and why does AI make it better?"

## Output format

After collecting all answers, write `docs/hackathon/alignment.md` with this exact structure:

```markdown
# Hackathon Alignment Brief

_Generated by /hackathon-align — [date/time of session]_

## Team pitch

[The team's answer to Q8, lightly edited for clarity if needed]

## Problem statement

[Q1 answer]

## Success metric

[Q2 answer]

## Projected scores

| Criterion                              | Weight | Projected Score | Reasoning                                                   |
| -------------------------------------- | ------ | --------------- | ----------------------------------------------------------- |
| C1 — Business Value & Relevance        | 20%    | X/10            | [1–2 sentences from Q1+Q2 answers]                          |
| C2 — AI-Native Solution Advantage      | 20%    | X/10            | [1–2 sentences from Q3+Q4 answers]                          |
| C3 — AI-Native Ways of Working         | 20%    | X/10            | [based on Q5 — team composition and planned AI tooling use] |
| C4 — Innovation & Differentiation      | 15%    | X/10            | [from Q4+Q6 answers]                                        |
| C5 — Solution Effectiveness & Evidence | 15%    | X/10            | [from Q7 — prototype plan]                                  |
| C6 — Human Experience & Demonstration  | 10%    | X/10            | [from Q8 + overall clarity of answers]                      |

**Projected weighted total: XX.X / 100**

_Note: any unanswered question is marked as `unscored` for that criterion._

## Top 3 score risks

1. [Criterion most at risk — why, and what would fix it]
2. [Second risk]
3. [Third risk]

## Build priority

What to finish first to protect the highest-weighted criteria:

1. [First priority — ties to C1 or C2 or C3 — specific deliverable]
2. [Second priority]
3. [Third priority]
4. [Fourth priority]

## Unanswered questions

[List any Q that was skipped, marked as risks for the relevant criterion. If none, write "None."]
```
````

## After writing the file

Tell the team:

- The file is at `docs/hackathon/alignment.md` — commit it before starting to build
- Run `/hackathon-check` at midday to see how the actual build compares to these projections
- The build priority list above is your sprint backlog for the day — start from the top

````

- [ ] **Step 3: Verify the file and confirm output path**

```bash
ls -la .claude/skills/hackathon-align.md
````

Expected: file present. Confirm `docs/hackathon/` exists:

```bash
ls -la docs/hackathon/
```

- [ ] **Step 4: Dry-run check**

Read the skill file and confirm:

- All 8 questions are present and numbered Q1–Q8
- Each question names which criterion it maps to
- The output template includes the `unscored` path for skipped questions (FR-A2)
- The output path is exactly `docs/hackathon/alignment.md`

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/hackathon-align.md docs/hackathon/
git commit -m "feat(.claude): add /hackathon-align morning kickoff skill"
```

---

### Task T003: `/hackathon-check` midday skill

**Files:**

- Create: `.claude/skills/hackathon-check.md`
- Creates/overwrites at runtime: `docs/hackathon/check.md`

**Interfaces:**

- Consumes: `docs/hackathon/alignment.md` (from T002, may not exist — handle gracefully), invokes `Hackathon Scorer` agent (from T001)
- Produces: `docs/hackathon/check.md`

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/hackathon-check.md`:

````markdown
---
name: hackathon-check
description: Midday gut-check skill for the Tntra AI-Native Hackathon 2026. Scores the current repo state against all six judging criteria, compares against the morning alignment targets, and produces a time-weighted action list for the remaining hours. Run this around midday. Overwrites docs/hackathon/check.md each time.
tools: Read, Write, Bash
---

# Hackathon Check — Midday Scoring

You are running the midday check for the Tntra AI-Native Hackathon 2026. Your job is to score the current state of the project, compare it to the morning alignment targets, and give the team a clear, time-weighted action list for the remaining hours.

## Step 1 — Collect time context

Ask the team two questions before doing anything else:

1. "What time is it now? (e.g. 13:30)"
2. "What time does the build phase end? (e.g. 16:00)"

Calculate hours remaining. If the end time is earlier than or equal to the current time, stop and say: "The end time you entered is not in the future — please check the times and run /hackathon-check again." Do not proceed.

Store the hours-remaining figure — you will use it to weight the action list.

## Step 2 — Read alignment targets

Read `docs/hackathon/alignment.md`. If it does not exist, note: "No alignment brief found — /hackathon-align was not run this morning. Proceeding with scoring only; no target comparison will be shown." Continue.

Extract the projected score per criterion if the file exists.

## Step 3 — Invoke the Hackathon Scorer

Use the Hackathon Scorer agent to evaluate the current repo state. Pass it no arguments — it reads the repo itself. Wait for its full structured report before proceeding.

## Step 4 — Write docs/hackathon/check.md

Using the scorer's report and the alignment targets (if available), write `docs/hackathon/check.md` with this exact structure:

```markdown
# Hackathon Midday Check

_Run at [current time] — [hours remaining] hours until build close_

## Scorecard

| Criterion                              | Weight | Target | Current | Delta | Status   |
| -------------------------------------- | ------ | ------ | ------- | ----- | -------- |
| C1 — Business Value & Relevance        | 20%    | X/10   | X/10    | ±X    | 🔴/🟡/🟢 |
| C2 — AI-Native Solution Advantage      | 20%    | X/10   | X/10    | ±X    | 🔴/🟡/🟢 |
| C3 — AI-Native Ways of Working         | 20%    | X/10   | X/10    | ±X    | 🔴/🟡/🟢 |
| C4 — Innovation & Differentiation      | 15%    | X/10   | X/10    | ±X    | 🔴/🟡/🟢 |
| C5 — Solution Effectiveness & Evidence | 15%    | X/10   | X/10    | ±X    | 🔴/🟡/🟢 |
| C6 — Human Experience & Demonstration  | 10%    | X/10   | X/10    | ±X    | 🔴/🟡/🟢 |

**Current weighted total: XX.X / 100**
_(Target was XX.X / 100 from alignment brief)_

Status key: 🔴 score < 6 · 🟡 score 6–7 · 🟢 score 8+

## Red criteria — fix these first

[For each 🔴 criterion: one paragraph — what the scorer found, what is missing, and the specific action that would move it to 🟡]

## Amber criteria — monitor

[For each 🟡 criterion: one sentence — what to watch and what would tip it red]

## Time-weighted action list

_With [N] hours remaining, do these in order:_

1. [Highest score-impact-per-hour action — name the criterion, the gap, the specific task, estimated time]
2. [Second action]
3. [Third action]

_Actions are ranked by (score points gained) ÷ (estimated hours to implement), not raw score impact._

## Evidence quick-wins

_These take ≤15 minutes each and close real scoring gaps:_

- [ ] [Quick win 1 — e.g. "Add a structured Pino log for the AI workflow start/end — closes C3 gap, 5 min"]
- [ ] [Quick win 2]
- [ ] [Quick win 3]
- [ ] [Quick win 4]
- [ ] [Quick win 5]
```
````

## Status thresholds

- 🔴 Red: score < 6 (needs immediate attention)
- 🟡 Amber: score 6–7 (watch, do not over-invest)
- 🟢 Green: score 8+ (do not recommend further effort here)

## After writing the file

Tell the team:

- "Updated `docs/hackathon/check.md` — start with the red criteria, then work the time-weighted action list top to bottom."
- "Run /hackathon-demo at the end of the build phase to generate your demo script."

````

- [ ] **Step 2: Verify the file**

```bash
ls -la .claude/skills/hackathon-check.md
````

Confirm in the file:

- Time validation logic is present (end time ≤ current time → stop)
- Missing alignment.md is handled with a note, not a crash
- Green criteria (8+) do NOT appear in the action list
- Output path is exactly `docs/hackathon/check.md`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/hackathon-check.md
git commit -m "feat(.claude): add /hackathon-check midday scoring skill"
```

---

### Task T004: `/hackathon-demo` end-of-day skill

**Files:**

- Create: `.claude/skills/hackathon-demo.md`
- Creates at runtime: `docs/hackathon/demo-script.md`

**Interfaces:**

- Consumes: `docs/hackathon/alignment.md` (T002), `docs/hackathon/check.md` (T003), invokes `Hackathon Scorer` agent (T001)
- Produces: `docs/hackathon/demo-script.md`

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/hackathon-demo.md`:

````markdown
---
name: hackathon-demo
description: End-of-day demo preparation skill for the Tntra AI-Native Hackathon 2026. Scores the final repo state, then generates a structured 5-minute demo script, per-criterion talking points, evidence statements, AI contribution narrative, and five likely judge questions with answers. Writes docs/hackathon/demo-script.md.
tools: Read, Write, Bash
---

# Hackathon Demo — End-of-Day Pack

You are generating the end-of-day demo pack for the Tntra AI-Native Hackathon 2026. The output must be something a presenter can pick up and use immediately — clear, specific, and grounded in what actually exists in the repo.

## Step 1 — Read all context

Read in order:

1. `docs/hackathon/alignment.md` — team's original intent
2. `docs/hackathon/check.md` — midday scores and gaps (if it exists)
3. Run the Hackathon Scorer agent for the final state of the repo

## Step 2 — Identify any criteria scored below 6

For each criterion scoring below 6, you MUST include a mitigation statement in the demo script — a honest, forward-looking sentence the presenter can say if a judge probes that area. Never leave a low-scoring criterion without one.

## Step 3 — Write docs/hackathon/demo-script.md

```markdown
# BrainX — Hackathon Demo Script

_Generated by /hackathon-demo · Final score: XX.X / 100_

---

## Final scorecard

| Criterion                              | Weight | Score | Weighted |
| -------------------------------------- | ------ | ----- | -------- |
| C1 — Business Value & Relevance        | 20%    | X/10  | X.X/20   |
| C2 — AI-Native Solution Advantage      | 20%    | X/10  | X.X/20   |
| C3 — AI-Native Ways of Working         | 20%    | X/10  | X.X/20   |
| C4 — Innovation & Differentiation      | 15%    | X/10  | X.X/15   |
| C5 — Solution Effectiveness & Evidence | 15%    | X/10  | X.X/15   |
| C6 — Human Experience & Demonstration  | 10%    | X/10  | X.X/10   |
| **Total: XX.X / 100**                  |

---

## 5-Minute Demo Script

### 0:00 – 0:45 · The Problem _(C1)_

[Presenter lines — specific, vivid, names the user and the pain. Drawn from Q1/Q2 answers in alignment.md.]

### 0:45 – 1:30 · What AI Does Here _(C2, C4)_

[Presenter lines — explains exactly what AI does, why it matters, what the non-AI alternative would look like. Drawn from Q3/Q4 and scorer evidence.]

### 1:30 – 3:30 · Live Demo _(C5, C6)_

[Step-by-step walkthrough script — what to click, what to show, what to say at each step. Specific to the actual prototype screens. If scorer found evidence of the working prototype, reference it here.]

**Demo beat 1:** [action + what to say]
**Demo beat 2:** [action + what to say]
**Demo beat 3:** [action + what to say]

### 3:30 – 4:15 · How We Built It _(C3)_

[Presenter lines — evidence of AI-native working. Reference actual artifacts: alignment brief generated at [time], spec reviewed, plan approved, implementation done with Claude Code, /hackathon-check run at midday. Cite the git log if it shows the workflow.]

**Key evidence to show:**

- [Specific file or commit that proves AI-native working]
- [Second piece of evidence]
- [Third piece of evidence]

### 4:15 – 5:00 · Impact and Close _(C1, C4)_

[Presenter lines — return to the metric from Q2, state the potential to scale, close with the pitch sentence from Q8.]

---

## Per-Criterion Talking Points

_Two sentences per criterion — say these verbatim if a judge asks._

**C1 — Business Value**
[Two sentences. Specific metric. Specific user.]

**C2 — AI-Native Advantage**
[Two sentences. What AI does. What would break without it.]

**C3 — AI-Native Ways of Working**
[Two sentences. What tools were used. What phase of the build they supported.]

**C4 — Innovation**
[Two sentences. What is genuinely different. What a conventional team would have done instead.]

**C5 — Solution Effectiveness**
[Two sentences. What the demo shows. What the evidence is.]

**C6 — Human Experience**
[Two sentences. What makes it intuitive. What the user never has to think about.]

---

## AI Contribution Narrative

_The clearest possible answer to "what does AI do here that matters?" — say this if a judge asks._

[2–3 sentences. Written in plain English. No jargon. Specific about the AI task — not "we used AI" but "AI does X, which means the user gets Y, which would take Z hours manually."]

---

## Mitigation Statements

_For criteria scored below 6 — say these if a judge probes a weak area._

[One per weak criterion. Honest, forward-looking: "We know [gap]. With more time, we would [specific next step]. The approach is proven because [one evidence point]."]

[If all criteria score 6+, write: "No mitigation statements needed — all criteria scored 6 or above."]

---

## Likely Judge Questions

**Q1:** [Most likely question based on scoring gaps]
**A:** [Specific, confident answer. Max 3 sentences.]

**Q2:** [Second most likely question]
**A:** [Answer]

**Q3:** [Third question]
**A:** [Answer]

**Q4:** [Fourth question]
**A:** [Answer]

**Q5:** [Fifth question — often about scale or next steps]
**A:** [Answer]
```
````

## After writing the file

Tell the team:

- "Demo script written to `docs/hackathon/demo-script.md`."
- "The 5-minute script is timed — practice it once before your slot."
- "If any judge asks a question not in the Q&A section, anchor to the nearest criterion talking point."
- "Commit the demo script before your slot — it is part of your AI-native working evidence."

````

- [ ] **Step 2: Verify the file**

```bash
ls -la .claude/skills/hackathon-demo.md
````

Confirm in the file:

- Mitigation statement section exists and fires for any criterion < 6 (FR-D2)
- All 6 criteria have named talking points in the script (FR-D1)
- The 5-minute script has timed sections matching the spec (0:00–0:45, 0:45–1:30, 1:30–3:30, 3:30–4:15, 4:15–5:00)
- Output path is exactly `docs/hackathon/demo-script.md`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/hackathon-demo.md
git commit -m "feat(.claude): add /hackathon-demo end-of-day demo pack skill"
```

---

## Final verification

After all four tasks are complete:

- [ ] Confirm all four files exist:

  ```bash
  ls .claude/agents/hackathon-scorer.md \
     .claude/skills/hackathon-align.md \
     .claude/skills/hackathon-check.md \
     .claude/skills/hackathon-demo.md
  ```

- [ ] Update `README.md` — add a section documenting the three slash commands so the team knows they exist on hackathon day:

  ```markdown
  ## Hackathon tooling

  Three slash commands keep the team aligned to the judging criteria throughout the day:

  | Command            | When                    | What it does                                                 |
  | ------------------ | ----------------------- | ------------------------------------------------------------ |
  | `/hackathon-align` | Morning — before coding | 8-question dialogue → scoring brief + build priority         |
  | `/hackathon-check` | Midday                  | Scores current state → RAG scorecard + time-weighted actions |
  | `/hackathon-demo`  | End of build phase      | Final score + 5-min demo script + judge Q&A prep             |

  Output files land in `docs/hackathon/`.
  ```

- [ ] Final commit:
  ```bash
  git add README.md
  git commit -m "docs: add hackathon tooling section to README"
  ```
