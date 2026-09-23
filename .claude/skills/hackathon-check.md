---
name: hackathon-check
description: Midday gut-check skill for the Tntra AI-Native Hackathon 2026. Scores the current repo state against all six judging criteria, compares against morning alignment targets, and produces a time-weighted action list for the remaining hours. Run this around midday. Overwrites docs/hackathon/check.md each time.
tools: Read, Write, Bash
---

# Hackathon Check — Midday Scoring

You are running the midday check for the Tntra AI-Native Hackathon 2026. Score the current state of the project, compare it to the morning alignment targets, and give the team a clear, time-weighted action list for the remaining hours.

## Step 1 — Collect time context

Ask the team two questions before doing anything else:

1. "What time is it now? (e.g. 13:30)"
2. "What time does the build phase end? (e.g. 16:00)"

Calculate hours remaining. **If the end time is earlier than or equal to the current time, stop and say:** "The end time you entered is not in the future — please check the times and run /hackathon-check again." Do not proceed.

Store the hours-remaining figure — you will use it to weight the action list.

## Step 2 — Read alignment targets

Read `docs/hackathon/alignment.md`. If it does not exist, output this note at the top of the report: "⚠️ No alignment brief found — /hackathon-align was not run this morning. Proceeding with scoring only; no target comparison will be shown." Then continue.

Extract the projected score per criterion if the file exists.

## Step 3 — Invoke the Hackathon Scorer

Use the **Hackathon Scorer** agent to evaluate the current repo state. It reads the repo itself — pass it no arguments. Wait for its full structured report before proceeding.

## Step 4 — Write docs/hackathon/check.md

Using the scorer's report and the alignment targets (if available), write `docs/hackathon/check.md`:

```markdown
# Hackathon Midday Check

_Run at [current time] — [N] hours until build close_

[⚠️ No alignment brief found — /hackathon-align was not run this morning. | omit this line if alignment.md exists]

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
_(Target was XX.X / 100 from alignment brief — omit if no alignment.md)_

Status: 🔴 score < 6 · 🟡 score 6–7 · 🟢 score 8+

## 🔴 Red criteria — fix these first

[For each red criterion: what the scorer found, what is missing, the specific action that would move it to amber. Omit section if no red criteria.]

## 🟡 Amber criteria — monitor

[For each amber criterion: one sentence — what to watch, what would tip it red. Omit section if no amber criteria.]

## Time-weighted action list

_With [N] hours remaining, do these in order:_

1. [Action — criterion, gap, specific task, estimated time. Ranked by score-points-gained ÷ hours-to-implement.]
2. [Second action]
3. [Third action]

_Do not include actions for 🟢 criteria — effort there does not improve the score._

## Evidence quick-wins

_≤15 minutes each, real scoring gaps:_

- [ ] [e.g. "Add a structured Pino log for AI workflow start/end — closes C3 evidence gap, ~5 min"]
- [ ] [Quick win 2]
- [ ] [Quick win 3]
- [ ] [Quick win 4]
- [ ] [Quick win 5]
```

## Status thresholds

- 🔴 Red: score < 6 — needs immediate attention
- 🟡 Amber: score 6–7 — watch, do not over-invest
- 🟢 Green: score 8+ — do not recommend further effort

## After writing the file

Tell the team:

- "Updated `docs/hackathon/check.md` — start with the red criteria, then work the time-weighted action list top to bottom."
- "Run `/hackathon-demo` at the end of the build phase to generate your demo script."
