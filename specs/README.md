# specs/

This folder holds the live feature work for this project. Each feature gets its own subdirectory.

## Structure

```
specs/
└── <feature-slug>/
    ├── spec.md      ← what the system must do (FR-NNN acceptance criteria)
    ├── plan.md      ← how it will be built (architecture, ADRs)
    └── tasks.md     ← atomic implementation checklist
```

No phase starts until the previous file has `status: approved` in its frontmatter.

## Starting a new feature

Open Claude Code and tell the Product Manager agent what to build:

```
Use the Product Manager agent to write the spec for [feature name].
Context: [2–3 sentences on what this needs to do at the system level].
```

The agent creates `specs/<feature-slug>/` and scaffolds all phase files automatically.

## Process reference

Full workflow: https://github.com/Tntra/ai-engineering-playbook
