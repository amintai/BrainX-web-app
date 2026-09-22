---
feature: <feature-slug>
status: draft   # draft -> in-review -> approved
owner: <engineer-name>
created: <YYYY-MM-DD>
# approved-by: <name>        # fill in at approval time
# approved-date: <YYYY-MM-DD>
---

# Plan: <Feature Name>

> Do not start this file until `spec.md` has `status: approved`.

## Architecture overview

High-level approach. Diagram if useful (Mermaid is fine, Claude can render it).

## Tech stack & rationale

List the key languages, frameworks, and libraries this feature uses. State any deviations from the project's existing stack and why.

## Data model

## API contracts

Request/response shapes, error cases, versioning notes. All errors must follow `{ error: string }` shape per the constitution check.

## Integration points

External services, third-party APIs, internal services this feature depends on or affects.

## Constitution check

Gate: all items must be checked before tasks can start. Re-evaluate after any scope change.

- [ ] No new infrastructure dependency introduced without an ADR.
- [ ] All API errors follow `{ error: string }` shape.
- [ ] No business logic in route handlers — service layer owns it.
- [ ] All secrets managed via environment variables, never hardcoded.
- [ ] _Add project-specific checks here._

## Architecture Decision Records (ADRs)

One ADR per non-trivial decision (library choice, infra dependency, data model trade-off, etc.).

### ADR-1: <Decision title>

- **Problem:**
- **Options considered:**
- **Chosen solution:**
- **Reasoning:**

## Risks

What could go wrong, and the mitigation.
