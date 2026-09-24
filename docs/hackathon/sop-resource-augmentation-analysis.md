# SOP Analysis: Resource Augmentation & IT Asset Request

**Process:** Internal Resource/Asset Request → Onboarding  
**Steps:** 15 | **Total Effort (as-is):** ~177 min per request  
**Analysis Framework:** Challenge 15 — Intelligent Workflow Automation Designer

---

## Current State Summary

| #   | Step                                | Owner                     | Effort |
| --- | ----------------------------------- | ------------------------- | ------ |
| 1   | Raise Requirement Request           | PM                        | 10 min |
| 2   | Requirement Completeness Check      | PMO                       | 8 min  |
| 3   | Project & Budget Validation         | Delivery Manager          | 10 min |
| 4   | Finance Budget Check                | Finance                   | 8 min  |
| 5   | Resource / Asset Availability Check | Operations                | 15 min |
| 6   | External Resource / Asset Sourcing  | HR / Procurement          | 20 min |
| 7   | Candidate / Asset Evaluation        | Project + Functional Team | 20 min |
| 8   | Commercial Validation               | Finance / Procurement     | 10 min |
| 9   | Delivery Manager Approval           | Delivery Manager          | 5 min  |
| 10  | Procurement / HR Approval           | Procurement / HR          | 8 min  |
| 11  | Security & Compliance Check         | IT / Security             | 10 min |
| 12  | Resource / Asset Onboarding         | HR / IT                   | 25 min |
| 13  | Project Allocation                  | PM                        | 10 min |
| 14  | Confirmation & Documentation        | PMO                       | 8 min  |
| 15  | Finance / Cost Allocation           | Finance                   | 10 min |

**Total:** 177 minutes of human effort per request (excludes wait time between steps)

---

## Friction & Redundancy Analysis

### 🔴 Magic Moment 1 — Triple Budget Check (Steps 3, 4, 8)

This is the clearest redundancy in the process.

| Step | Who                   | What they check                                          |
| ---- | --------------------- | -------------------------------------------------------- |
| 3    | Delivery Manager      | "Is there budget available for this project?"            |
| 4    | Finance               | "Is there budget available for this project?"            |
| 8    | Finance / Procurement | "Does the proposed cost fit within the approved budget?" |

**Root cause:** Organizational trust gap — Finance doesn't trust Delivery Manager's budget read; no system-of-record enforces the check, so humans repeat it.  
**Risk if removed:** None — the _control_ (budget governance) is genuine; the _duplication_ is not.  
**Solution:** One automated budget check against the financial system at point of submission (Step 1). If the system confirms budget exists, Steps 3, 4, and 8 collapse into a single human budget-authorization decision.

---

### 🔴 Magic Moment 2 — Sequential Approvals for Same Decision (Steps 9 & 10)

| Step | Who              | What they decide                              |
| ---- | ---------------- | --------------------------------------------- |
| 9    | Delivery Manager | Approves requirement, cost, proposed resource |
| 10   | Procurement / HR | Re-reviews and approves the same information  |

**Root cause:** Policy written for a world without digital audit trails — the second approval was added as a "check on the checker."  
**Risk if removed:** None for standard cases. Procurement/HR policy compliance is a real control but it checks rules, not judgment — rules can be enforced by the system.  
**Solution:** Automated policy rules engine validates the engagement type, vendor status, and rate against procurement policy. Human sign-off only for exceptions (new vendor, above-rate, non-standard contract).

---

### 🟡 Step 2 — Completeness Check Is a Process Tax

**Current:** PMO manually reviews every request for missing fields and sends it back.  
**Root cause:** Step 1 (the request form) has no validation.  
**Solution:** Form validation at submission. AI validates completeness, role/skill clarity, and budget reference in real time. Step 2 is eliminated entirely.

---

### 🟡 Step 5 — Manual Inventory Lookup

**Current:** Operations manually checks resource pool and asset inventory — a database lookup done by a human.  
**Root cause:** No system integration between request workflow and inventory systems.  
**Solution:** Fully automated. On submission, system queries resource pool (HRMS/project management tool) and asset inventory. Result returned in seconds. Human only reviews the output if availability is partial or zero.

---

### 🟡 Steps 13, 14, 15 — Manual System Updates After Decision

These three steps are entirely clerical — they update records after the actual decision is made:

| Step | Action                                        | Automatable?                                  |
| ---- | --------------------------------------------- | --------------------------------------------- |
| 13   | Assign resource to project in tracker         | ✅ Yes — trigger on approval                  |
| 14   | Update master spreadsheet / send confirmation | ✅ Yes — auto-generate, eliminate spreadsheet |
| 15   | Map cost to project in finance system         | ✅ Yes — integration to finance system        |

**Root cause:** Systems don't talk to each other; humans act as the integration layer.  
**Solution:** Workflow completion triggers automated writes to project management tool, finance system, and documentation store. Zero human effort.

---

## Step-by-Step Redesign Decision

| #   | Original Step                       | Recommendation                             | Reason                                                                                           | Assigned Role                         |
| --- | ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------- |
| 1   | Raise Requirement Request           | **Keep + Simplify**                        | Core entry point; add AI-assisted form with real-time validation and budget check                | 🤝 AI + Human                         |
| 2   | Requirement Completeness Check      | **Remove**                                 | Replaced by form validation at Step 1; redundant if input is validated at source                 | — Eliminated                          |
| 3   | Project & Budget Validation         | **Simplify**                               | System confirms budget automatically; human reviews AI summary and authorizes                    | 🤝 AI + Human                         |
| 4   | Finance Budget Check                | **Remove**                                 | Redundant — system already confirmed budget in Step 3                                            | — Eliminated                          |
| 5   | Resource / Asset Availability Check | **Automate**                               | Pure database lookup; no human judgment required                                                 | ⚙️ Automation                         |
| 6   | External Resource / Asset Sourcing  | **AI-Assist**                              | AI pre-screens vendor list, drafts outreach, surfaces ranked options; human engages              | 🤝 AI + Human                         |
| 7   | Candidate / Asset Evaluation        | **AI-Assist**                              | AI scores CVs/specs against requirements and ranks; human makes final selection                  | 🤝 AI + Human                         |
| 8   | Commercial Validation               | **Remove**                                 | Redundant — budget was confirmed at Step 3; rate validated automatically against approved budget | — Eliminated                          |
| 9   | Delivery Manager Approval           | **Keep**                                   | Genuine delivery authorization; simplified because AI has pre-validated all inputs               | 🧑 Human                              |
| 10  | Procurement / HR Approval           | **Automate (standard) / Keep (exception)** | Policy rules engine validates compliance; human only for new vendor or above-rate                | ⚙️ Automation + 🧑 Human (exceptions) |
| 11  | Security & Compliance Check         | **AI-Assist**                              | AI runs standard compliance checklist, flags issues; human reviews and signs off                 | 🤝 AI + Human                         |
| 12  | Resource / Asset Onboarding         | **Automate**                               | Account creation, access provisioning, asset assignment triggered by approval                    | ⚙️ Automation                         |
| 13  | Project Allocation                  | **Automate**                               | Project tracker updated automatically on approval completion                                     | ⚙️ Automation                         |
| 14  | Confirmation & Documentation        | **Automate**                               | System auto-generates confirmation, updates audit trail; no manual spreadsheet                   | ⚙️ Automation                         |
| 15  | Finance / Cost Allocation           | **Automate**                               | Cost mapping to project triggered automatically                                                  | ⚙️ Automation                         |

---

## Future State Workflow

```
[PM submits request via AI-assisted form]
    ↓ Real-time: form validation + budget check + availability lookup (automated)

[Delivery Manager reviews AI summary → Authorizes]
    ↓ If internal resource/asset available → skip to Step 6b

[AI surfaces ranked vendors/candidates → PM selects]
    ↓ Rate auto-validated against budget

[Policy engine checks compliance]
    ↓ Standard: auto-approved
    ↓ Exception: Procurement/HR reviews

[Delivery Manager gives final approval]
    ↓
[Automated: onboarding provisioned + project updated + cost allocated + confirmation sent]
```

**Future state steps: 6 human-touched steps** (down from 15)  
**Human effort per request: ~55 min** (down from 177 min)

---

## Benefit Projection

| Metric                       | Current State      | Future State                               | Improvement               |
| ---------------------------- | ------------------ | ------------------------------------------ | ------------------------- |
| Total steps                  | 15                 | 9 (6 human + 3 automated in parallel)      | −40% steps                |
| Human effort per request     | 177 min            | ~55 min                                    | −69% effort               |
| Steps eliminated (redundant) | —                  | 3 removed (Steps 2, 4, 8)                  | 3 fewer approvals         |
| Fully automated steps        | 0                  | 6 (Steps 5, 12, 13, 14, 15 + policy check) | Zero human touch          |
| Wait time (inter-step)       | Multiple days      | Hours (parallel tracks)                    | Estimated −70% cycle time |
| Audit trail                  | Manual spreadsheet | Auto-generated, real-time                  | 100% automated            |

---

## Controls Preserved

Every genuine risk control survives the redesign:

| Control                               | Original Step | Status in Future State                                 |
| ------------------------------------- | ------------- | ------------------------------------------------------ |
| Business justification (project need) | Step 3        | ✅ Kept — Delivery Manager still authorizes            |
| Budget governance                     | Steps 3, 4, 8 | ✅ Kept — automated check + single human authorization |
| Requirement fit                       | Step 7        | ✅ Kept — AI-assisted, human decides                   |
| Policy compliance                     | Step 10       | ✅ Kept — automated for standard, human for exceptions |
| Security & compliance                 | Step 11       | ✅ Kept — AI-assisted, human signs off                 |
| Audit trail                           | Step 14       | ✅ Kept — automated, more complete than manual         |
| Financial reporting                   | Step 15       | ✅ Kept — automated integration                        |

---

## Automation Architecture (BrainX Implementation)

### Agent Pipeline

```
sop-parser.agent          → Structures raw SOP into step objects
friction-detector.agent   → Flags Steps 2, 4, 8 as redundant; 5,13,14,15 as automatable
control-auditor.agent     → Confirms budget control is preserved through Step 3 alone
redesign-proposer.agent   → Outputs future-state with rationale per step
benefit-calculator.agent  → Projects 69% effort reduction, 3 eliminations, 6 automations
```

### System Integrations (Future State Execution)

| Integration               | Purpose                       | Trigger                    |
| ------------------------- | ----------------------------- | -------------------------- |
| HRMS / Resource Pool API  | Step 5: availability check    | Auto on submission         |
| Finance System API        | Steps 3, 8: budget validation | Auto on submission         |
| IT Asset Inventory        | Step 5: asset availability    | Auto on submission         |
| Vendor/Recruitment Portal | Step 6: vendor shortlist      | On internal unavailability |
| Project Management Tool   | Step 13: allocation update    | On final approval          |
| Finance Ledger            | Step 15: cost mapping         | On final approval          |
| Notification System       | Step 14: confirmation         | On final approval          |

### Approval Rules (Automation vs Human)

```
Standard flow (auto-approved at Step 10):
  - Known vendor (approved vendor list)
  - Rate ≤ approved budget
  - Role matches pre-defined role catalogue
  - Duration ≤ 6 months

Exception → Human (Procurement/HR reviews):
  - New vendor
  - Rate > approved budget (requires budget amendment)
  - Non-standard contract terms
  - Duration > 6 months
  - Security classification above threshold
```

---

## Synthetic SOP Input (For Demo)

```json
{
  "processName": "Resource Augmentation & IT Asset Request",
  "steps": [
    {
      "id": "S01",
      "actor": "Project Manager",
      "action": "Submit resource/asset request",
      "cycleTimeMinutes": 10,
      "controlType": "none"
    },
    {
      "id": "S02",
      "actor": "PMO",
      "action": "Completeness check",
      "cycleTimeMinutes": 8,
      "controlType": "check"
    },
    {
      "id": "S03",
      "actor": "Delivery Manager",
      "action": "Project & budget validation",
      "cycleTimeMinutes": 10,
      "controlType": "approval"
    },
    {
      "id": "S04",
      "actor": "Finance",
      "action": "Independent budget check",
      "cycleTimeMinutes": 8,
      "controlType": "approval"
    },
    {
      "id": "S05",
      "actor": "Operations",
      "action": "Resource/asset availability check",
      "cycleTimeMinutes": 15,
      "controlType": "check"
    },
    {
      "id": "S06",
      "actor": "HR/Procurement",
      "action": "External sourcing",
      "cycleTimeMinutes": 20,
      "controlType": "none"
    },
    {
      "id": "S07",
      "actor": "Project + Functional",
      "action": "Candidate/asset evaluation",
      "cycleTimeMinutes": 20,
      "controlType": "check"
    },
    {
      "id": "S08",
      "actor": "Finance/Procurement",
      "action": "Commercial validation",
      "cycleTimeMinutes": 10,
      "controlType": "approval"
    },
    {
      "id": "S09",
      "actor": "Delivery Manager",
      "action": "Final approval",
      "cycleTimeMinutes": 5,
      "controlType": "approval"
    },
    {
      "id": "S10",
      "actor": "Procurement/HR",
      "action": "Policy compliance approval",
      "cycleTimeMinutes": 8,
      "controlType": "approval"
    },
    {
      "id": "S11",
      "actor": "IT/Security",
      "action": "Security & compliance check",
      "cycleTimeMinutes": 10,
      "controlType": "check"
    },
    {
      "id": "S12",
      "actor": "HR/IT",
      "action": "Onboarding",
      "cycleTimeMinutes": 25,
      "controlType": "none"
    },
    {
      "id": "S13",
      "actor": "Project Manager",
      "action": "Project allocation",
      "cycleTimeMinutes": 10,
      "controlType": "none"
    },
    {
      "id": "S14",
      "actor": "PMO",
      "action": "Confirmation & documentation",
      "cycleTimeMinutes": 8,
      "controlType": "none"
    },
    {
      "id": "S15",
      "actor": "Finance",
      "action": "Cost allocation",
      "cycleTimeMinutes": 10,
      "controlType": "none"
    }
  ],
  "approvalRules": {
    "autoApprove": ["known_vendor", "rate_within_budget", "standard_role", "duration_under_6m"],
    "escalateToHuman": [
      "new_vendor",
      "rate_exceeds_budget",
      "non_standard_contract",
      "duration_over_6m"
    ]
  }
}
```

---

## Demo Talking Points

1. **"We found a triple budget check"** — Steps 3, 4, and 8 all verify budget. The system traced the intent of each step, confirmed all three guard the same condition, and collapsed them to one automated check + one human authorization. No financial control was weakened.

2. **"Two approvals doing the same job"** — Steps 9 and 10 are sequential approvals of identical information. Step 10 (Procurement/HR) adds no new judgment for standard requests. The system routes standard cases through an automated policy engine and reserves the human only for genuine exceptions.

3. **"Six steps that are just data entry"** — Steps 5, 12, 13, 14, 15 and the completeness check (Step 2) are pure system tasks done by humans because systems don't talk to each other. The future state connects them.

4. **"The controls that matter all survived"** — Budget governance, security review, requirement fit, and audit trail are all present in the future state — just not duplicated three times.
