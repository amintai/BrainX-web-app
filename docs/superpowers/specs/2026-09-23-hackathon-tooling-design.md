# Hackathon Tooling Design

_2026-09-23 · BrainX · Tntra AI-Native Hackathon 2026_

## Purpose

Equip the BrainX team with Claude Code skills and an agent that keep every
build decision aligned to the six judging criteria throughout hackathon day.
The goal is to maximise the weighted score, not just ship a feature.

---

## Judging Criteria Reference

| #   | Criterion                                 | Weight |
| --- | ----------------------------------------- | ------ |
| 1   | Business Value & Relevance                | 20%    |
| 2   | AI-Native Solution Advantage              | 20%    |
| 3   | AI-Native Ways of Working & Collaboration | 20%    |
| 4   | Innovation & Differentiation              | 15%    |
| 5   | Solution Effectiveness & Evidence         | 15%    |
| 6   | Human Experience & Demonstration          | 10%    |

---

## Artifacts

```
.claude/
├── agents/
│   └── hackathon-scorer.md
└── skills/
    ├── hackathon-align.md
    ├── hackathon-check.md
    └── hackathon-demo.md

docs/hackathon/
├── alignment.md        ← written by /hackathon-align
├── check.md            ← overwritten by /hackathon-check (each run)
└── demo-script.md      ← written by /hackathon-demo
```

---

## Component 1 — `hackathon-scorer` Agent

**Role:** Shared evaluation engine. Read-only. Invoked by `/hackathon-check`
and `/hackathon-demo`; never called directly by the team.

**Inputs it reads:**

- `docs/hackathon/alignment.md` (team's stated intent)
- All files under `.claude/`, `specs/`, `docs/`
- `apps/web/src/` and `apps/api/src/` (implementation evidence)
- Git log (evidence of AI-native workflow phases)

**What it produces (structured report, not written to disk):**

For each of the 6 criteria:

- Score 0–10
- Evidence found in the codebase/docs that supports the score
- Specific gaps — what is missing or weak
- One concrete action that would raise the score

Plus:

- Weighted total (out of 100)
- Ranked gap list by score impact (highest-impact gaps first)

**Constraints:**

- Read-only — never writes files, never edits code
- Returns structured output only; the calling skill formats and writes the result
- Does not hallucinate evidence — only cites things it can point to in the repo

---

## Component 2 — `/hackathon-align` Skill

**When:** Morning kickoff, before significant code is written (~10 minutes).

**Mode:** Interactive dialogue. Claude asks 8 questions one at a time and
waits for each answer before proceeding. No question is skipped.

**Questions (in order):**

1. What problem are you solving? Who feels this pain most acutely?
2. How do you measure success — what is the concrete before/after delta?
3. What does AI do in this solution that a non-AI approach could not do as well or at all?
4. What is the best non-AI alternative? Why is your solution meaningfully better?
5. Which functions are represented on the team (Engineering, QA, Design, Business, DevOps, etc.)?
6. What is genuinely novel or non-obvious about your approach?
7. What will your working prototype demonstrate by end of day?
8. Write one sentence: what does BrainX do, for whom, and why does AI make it better?

**Output written to `docs/hackathon/alignment.md`:**

- Projected score per criterion (0–10) with reasoning from the team's answers
- Top 3 score risks — criteria most at risk given current direction
- Priority build list — what to finish first to protect the highest-weighted criteria
- Draft pitch sentence the team can refine
- Timestamp of when the session ran

**FR-A1:** Given the skill is run at the start of the day, when all 8 questions
are answered, then `docs/hackathon/alignment.md` is written with projected
scores, risks, build priority, and pitch sentence.

**FR-A2:** Given a question is skipped or left blank, then the skill prompts
once more before accepting a placeholder — it never silently skips a criterion.

---

## Component 3 — `/hackathon-check` Skill

**When:** Mid-day (recommended ~2 hours before end of build time).

**Mode:** Non-interactive. Asks two quick context questions upfront (current
time and total hackathon end time), then invokes `hackathon-scorer` and
formats the result.

**Context questions:**

1. What time is it now?
2. What time does the build phase end?

**Output written to `docs/hackathon/check.md`** (overwritten each run):

- Scorecard table: criterion / target score from alignment / current score / delta / RAG status
- Red criteria: specific 1–2 sentence fix for each
- Amber criteria: what to monitor
- Time-weighted action list: "With N hours left, do these things in this order" — actions are prioritised by score impact per hour of effort
- Evidence quick-wins: things that cost ≤15 minutes but close a scoring gap (e.g. add a structured log, write one test, document an AI decision in a comment)

**FR-C1:** Given the skill is run with time remaining, when scoring is
complete, then the action list is ranked by score-impact-per-hour, not
raw score impact.

**FR-C2:** Given a criterion is already scoring 8+, then the skill does not
recommend effort on it — it surfaces only the gaps.

---

## Component 4 — `/hackathon-demo` Skill

**When:** End of build phase, before the demo slot.

**Mode:** Reads `docs/hackathon/alignment.md` and `docs/hackathon/check.md`,
invokes `hackathon-scorer` for final state, then generates the demo pack.

**Output written to `docs/hackathon/demo-script.md`:**

1. **5-minute demo script** with timed beats:
   - 0:00–0:45 — Problem and user (Criterion 1)
   - 0:45–1:30 — What AI does and why it matters (Criteria 2 & 4)
   - 1:30–3:30 — Live demo walkthrough (Criteria 5 & 6)
   - 3:30–4:15 — Evidence: how we built it AI-natively (Criterion 3)
   - 4:15–5:00 — Impact, scale potential, close (Criteria 1 & 4)

2. **Per-criterion talking points** — two sentences per criterion, verbatim,
   the presenter can say during Q&A.

3. **Evidence statements** — specific, citable facts from the repo
   (e.g. "We ran `/hackathon-align` at 9 AM, spec was reviewed at 10 AM,
   implementation started after plan approval — here is the git log.")

4. **AI contribution narrative** — the clearest possible answer to
   "what does AI do here that matters?" (2–3 sentences, judge-ready).

5. **5 likely judge questions** with suggested answers.

**FR-D1:** Given the final scorer output, when the demo script is generated,
then each of the 6 criteria has at least one named talking point in the script.

**FR-D2:** Given a criterion scored below 6, then the demo script includes a
mitigation statement — what the team would improve with more time — rather
than ignoring the gap.

---

## Out of Scope

- Automated scoring via CI — manual invocation only
- Integration with any external judging portal
- Multi-team comparison or leaderboard features
- Persistent scoring history across multiple runs (check.md is overwritten)

---

## Open Questions

_None. All design decisions are resolved._

---

## Status

`draft` — pending team review
