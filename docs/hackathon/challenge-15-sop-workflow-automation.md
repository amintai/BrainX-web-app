# Challenge 15: SOP → Intelligent Workflow Automation Designer

**Track:** Business Operations  
**Source:** Tntra AI-Native Hackathon 2026, Challenge Details Row 19  
**Category:** AI-Native Process Redesign

---

## Challenge Summary

Build an AI-native assistant that takes a bounded Standard Operating Procedure (SOP) as input, analyzes it for friction and redundant work, and outputs a redesigned future-state workflow with clearly assigned Human, AI, and Automation responsibilities.

The core insight: **automating a bad process makes a bad process faster**. The system must _challenge_ the process — not just map it.

---

## Real-World Context

Organizations accumulate process debt over time:

- Approval chains that rubber-stamp rather than govern
- Handoffs between teams that introduce delays without adding value
- Manual checks that duplicate validation already done upstream
- Forms and spreadsheets that exist because no one ever removed them
- Controls added after incidents that are never revisited or rationalized

When these processes are automated as-is, the inefficiency is preserved (and sometimes amplified). The first step must be a principled analysis of which steps still justify their existence.

---

## Core Problem

Given a process with 10–15 steps, the system must determine:

| Question                                             | Purpose                                 |
| ---------------------------------------------------- | --------------------------------------- |
| Which steps create genuine value?                    | Eliminate low-value steps               |
| Which controls are necessary?                        | Preserve what matters                   |
| Which activities duplicate upstream checks?          | Collapse redundant approvals            |
| Which steps are automatable without human oversight? | Assign to automation                    |
| Which steps need AI assistance but human decision?   | Assign AI-augmented human role          |
| Which steps must remain purely human?                | Protect human judgment where it belongs |

---

## AI-Native Magic Moment

> The system identifies an approval as **redundant** because an earlier step already validates the same condition — then redesigns the process without weakening the actual control.

This is the demonstration of genuine intelligence: not just labeling steps, but understanding the _intent_ behind each control, tracing whether that intent is already satisfied elsewhere, and safely eliminating duplication without introducing risk.

---

## Suggested Experience Flow

```
Input SOP
    │
    ▼
Step 1: Parse & Structure
    Decompose SOP into discrete steps with metadata:
    actor, action, trigger, output, control type, cycle time
    │
    ▼
Step 2: Friction Analysis
    Flag: bottlenecks, handoff delays, manual re-entry,
    wait states, approval queues, redundant checks
    │
    ▼
Step 3: Control Audit
    For each control point, ask:
    - What risk does this mitigate?
    - Is this risk already covered upstream?
    - Is there a lower-friction equivalent?
    │
    ▼
Step 4: Root Cause Classification
    Classify each friction point:
    - Legacy process debt
    - Organizational trust gap
    - Regulatory requirement
    - Technical limitation (now solvable)
    - Genuine risk control
    │
    ▼
Step 5: Redesign Proposal
    For each step: Remove / Simplify / Automate / AI-Assist / Keep
    Produce future-state process with rationale per change
    │
    ▼
Step 6: Role Assignment
    Each future-state step labeled:
    🧑 Human | 🤖 AI | ⚙️ Automation | 🤝 AI + Human
    │
    ▼
Step 7: Benefit Projection
    Estimate: cycle-time reduction, FTE hours saved,
    error rate reduction, step count delta
```

---

## Use Cases

### Use Case 1: Employee Onboarding SOP

**Current state:** 14-step process involving HR, IT, Finance, and Manager — spanning 5 business days.  
**Friction identified:** IT account creation waits for Finance payroll confirmation; Manager approval gates access provisioning despite IT already validating role.  
**AI action:** Identifies that role validation at step 3 makes the manager approval at step 9 redundant for standard roles. Proposes parallel tracks and removes the duplicate gate.  
**Result:** 5-day process → 2-day process.

---

### Use Case 2: Vendor Invoice Approval

**Current state:** 12-step approval chain with 3 separate sign-offs for invoices under $5,000.  
**Friction identified:** All three approvers review the same PO match — no approver adds distinct judgment.  
**AI action:** Proposes a single AI-validated PO match with one human sign-off for amounts under threshold; flags exceptions to senior approver automatically.  
**Result:** 3 approvals → 1 approval + automated validation. Cycle time: 4 days → same day.

---

### Use Case 3: Customer Complaint Resolution

**Current state:** 10-step process; complaint routed through 4 teams before resolution.  
**Friction identified:** Steps 4–6 are information-gathering that could be done by AI before any human sees the ticket.  
**AI action:** Inserts AI triage layer that pre-classifies, pre-populates context, and routes directly to the responsible team. Removes two intermediate handoffs.  
**Result:** First-response time: 48 hours → 4 hours.

---

## MVP Build Scope (One-Day)

### Input

- Accept a synthetic SOP as structured text (JSON or plain text list of steps)
- Each step includes: step ID, actor, action description, estimated cycle time, control type (approval / check / transform / notify)

### Processing (AI Agent Pipeline)

1. **Parser Agent** — Converts raw SOP text into structured step objects
2. **Friction Detector Agent** — Identifies bottlenecks, redundancies, and low-value steps
3. **Control Auditor Agent** — Evaluates each control point for necessity and coverage overlap
4. **Redesign Agent** — Proposes future-state with Remove/Simplify/Automate/AI-Assist/Keep decision per step
5. **Benefit Calculator** — Projects improvement in step count, cycle time, and effort

### Output

- Side-by-side: Current State vs Future State step list
- Per-step change rationale (evidence-based, not just assertions)
- Role assignment table: Human / AI / Automation / Hybrid
- Summary metrics: steps removed, time saved, controls preserved

### Synthetic Inputs to Prepare

- A 12–14 step SOP (e.g., procurement request, incident response, or employee onboarding)
- Cycle time estimates per step (minutes or hours)
- Approval rules (who approves, under what conditions)
- Sample cases (normal, exception, edge)

---

## Demo Script (Strong Demo Criteria)

| Criterion                                     | How to Demonstrate                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Challenges the process, not just documents it | Show a redundant approval being eliminated with reasoning                  |
| Recommendations are evidence-based            | Display the specific upstream step that makes the downstream one redundant |
| Controls that matter remain                   | Show a genuine risk control that the system flags as "keep" with reason    |
| Future state is measurably simpler            | Show before/after step count, cycle time delta, and FTE effort change      |

---

## Technical Architecture (BrainX Stack)

```
apps/web/                         # React + Vite frontend
  └── SOP Upload / Text Input UI
  └── Step-by-step analysis view
  └── Current vs Future State diff view
  └── Role assignment visual

apps/api/src/
  ├── agents/
  │   ├── sop-parser.agent.ts       # Parses raw SOP into structured steps
  │   ├── friction-detector.agent.ts # Flags redundancies and bottlenecks
  │   ├── control-auditor.agent.ts   # Evaluates control coverage
  │   ├── redesign-proposer.agent.ts # Produces future-state with rationale
  │   └── benefit-calculator.agent.ts # Projects improvement metrics
  ├── routes/
  │   └── sop.routes.ts             # POST /api/v1/sop/analyze
  ├── validators/
  │   └── sop.schema.ts             # Zod schemas for SOP input + AI output
  └── services/
      └── sop.service.ts            # Orchestrates agent pipeline
```

Each agent has a single, clearly defined responsibility (per CLAUDE.md convention). All AI output is structured JSON validated with Zod before use.

---

## Zod Output Schema (Example)

```typescript
const StepAnalysisSchema = z.object({
  stepId: z.string(),
  originalAction: z.string(),
  frictionType: z.enum(['redundant', 'bottleneck', 'low-value', 'manual-re-entry', 'none']),
  controlNecessity: z.enum(['essential', 'covered-upstream', 'eliminable']),
  recommendation: z.enum(['remove', 'simplify', 'automate', 'ai-assist', 'keep']),
  rationale: z.string(),
  assignedRole: z.enum(['human', 'ai', 'automation', 'ai-human-hybrid']),
  cycleTimeSavedMinutes: z.number().optional(),
});

const SOPAnalysisOutputSchema = z.object({
  processName: z.string(),
  originalStepCount: z.number(),
  futureStepCount: z.number(),
  stepAnalyses: z.array(StepAnalysisSchema),
  totalCycleTimeSavedMinutes: z.number(),
  controlsPreserved: z.number(),
  controlsEliminated: z.number(),
  magicMoments: z.array(z.string()), // The "AI-native" highlight findings
});
```

---

## API Contract

### Request

```
POST /api/v1/sop/analyze
Content-Type: application/json

{
  "processName": "Vendor Invoice Approval",
  "steps": [
    {
      "id": "S01",
      "actor": "Finance Clerk",
      "action": "Receive invoice from vendor email",
      "cycleTimeMinutes": 15,
      "controlType": "none"
    },
    ...
  ],
  "approvalRules": [...],
  "sampleCases": [...]
}
```

### Response

```
{
  "success": true,
  "data": {
    "analysis": { ...SOPAnalysisOutput }
  }
}
```

---

## Stretch Goals (If Time Remains)

- **BPMN-like visual** — Render current and future state as a swimlane diagram (using SVG or a lightweight charting library)
- **Cycle-time simulation** — Animate a "case" flowing through current vs future process showing time-to-completion
- **What-if mode** — Let user toggle individual recommendations on/off and re-calculate projected savings
- **Export** — Download redesigned process as a structured PDF or JSON

---

## Success Metrics

| Metric                 | Target                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| Step reduction         | ≥ 25% fewer steps in future state                                |
| Cycle time saved       | ≥ 30% reduction                                                  |
| Controls preserved     | 100% of genuine risk controls retained                           |
| Magic moments surfaced | At least 1 non-obvious redundancy identified with clear evidence |
| Demo flow completeness | Full current → analysis → future state in one session            |

---

## Notes

- Keep the demo SOP to 10–15 steps — complexity is a distraction at demo time
- Synthetic data is fine; realism of the process matters more than real org data
- The magic moment (redundant approval detection) should be built first — it's the strongest differentiator
- Human approval gates should be preserved for anything involving financial authority, regulatory compliance, or irreversible actions
