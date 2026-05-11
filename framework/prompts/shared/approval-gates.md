# Approval Gates

Substantial work must pass explicit approval gates.

## Design Approval

After `architect` creates `docs/specs/<feature>/design.md` and `designer` creates `docs/specs/<feature>/ui-spec.md` when UI is involved, `dispatcher` must stop and request user approval.

Do not proceed to planning until the user explicitly approves the design artifacts.

## Implementation Approval

After `planner` creates `docs/specs/<feature>/implementation.md` and `plan-reviewer` returns `PLAN_APPROVED`, `dispatcher` must stop and request user approval.

Do not proceed to build until the user explicitly approves the implementation artifact.

## Explicit Approval Examples

Approval:

```text
approved
yes, proceed
ship it
continue to the next phase
```

Not approval:

```text
looks good, but...
maybe
what do you think?
can you explain this?
```

## Artifact Requirement

Approval gates require written artifacts.

Do not request design approval without `design.md`.

Do not request implementation approval without `implementation.md`.
