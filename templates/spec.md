---
feature: <feature-slug>
status: draft   # draft -> in-review -> approved
owner: <engineer-name>
created: <YYYY-MM-DD>
# approved-by: <name>        # fill in at approval time
# approved-date: <YYYY-MM-DD>
---

# Spec: <Feature Name>

> Do not mix "what the system must do" with "how it will be built." Tech stack and implementation choices belong in `plan.md`.

## Context

Why does this need to exist? What problem does it solve at the system level? 2–3 sentences max — enough to explain the "why" without becoming a product doc.

## Technical requirements

High-level functional requirements, written technically. These feed directly into acceptance criteria below.

- The system must …
- The API must …
- Performance: …

## Acceptance criteria

Use `FR-NNN` numbering for traceability from requirement to task. Each criterion uses Given-When-Then so it can be verified end-to-end without ambiguity.

- [ ] **FR-001:** <short title>
      Given <precondition>
      When <action>
      Then <observable outcome>

- [ ] **FR-002:** <short title>
      Given <precondition>
      When <action>
      Then <observable outcome>

## Out of scope

Adjacent work explicitly excluded. Prevents scope creep during planning and implementation.

- …

## Open questions

Unresolved technical questions that must be answered before this can move to `status: approved`.

- …
