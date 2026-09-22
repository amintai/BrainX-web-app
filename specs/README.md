# specs/

This folder holds the live feature work for this project. Each feature gets its own subdirectory.

## Structure

```
specs/
└── <feature-slug>/
    ├── spec.md      ← what the system must do (FR-NNN acceptance criteria)
    ├── plan.md      ← how it will be built (architecture, ADRs)
    ├── tasks.md     ← atomic implementation checklist
    └── notes.md     ← append-only decision log
```

No phase starts until the previous file has `status: approved` in its frontmatter.

## Starting a new feature

```bash
mkdir -p specs/<feature-slug>
cp ~/ai-engineering-playbook/templates/spec.md \
   ~/ai-engineering-playbook/templates/plan.md \
   ~/ai-engineering-playbook/templates/tasks.md \
   ~/ai-engineering-playbook/templates/notes.md \
   specs/<feature-slug>/
```

Then open Claude Code and run:

```
Use the Product Manager agent to write the spec for [feature name].
Context: [2–3 sentences on what this needs to do at the system level].
```

## Process reference

Full workflow and templates: https://github.com/Tntra/ai-engineering-playbook
