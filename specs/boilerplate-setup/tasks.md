---
feature: boilerplate-setup
status: draft
owner: <engineer-name>
created: <YYYY-MM-DD>
execution-strategy: <MVP First | Risk First | Dependency Order>   # how to sequence tasks
---

# Tasks: Boilerplate Setup

> Do not start this file until `plan.md` has `status: approved`. Each task should be small enough to close in a single PR and should state how to verify it's done.

Task ID format: `T001`, `T002`, … — used for traceability back to `FR-NNN` requirements.
`[P]` marks tasks that can run in parallel with other `[P]` tasks at the same dependency level.
`Satisfies: FR-NNN` links each task to the acceptance criterion it implements.

- [ ] **T001:** <description>
      Satisfies: FR-001
      Verify: <how you'll confirm this is correct>
- [ ] **T002 [P]:** <description>
      Satisfies: FR-002
      Verify: <how you'll confirm this is correct>
- [ ] **T003 [P]:** <description>
      Satisfies: FR-003
      Verify: <how you'll confirm this is correct>

## Dependencies between tasks

Note any ordering constraints not obvious from the list above. Show which tasks block others and which can run in parallel.
