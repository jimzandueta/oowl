# Approval Gates

Substantial work must pass explicit approval gates. Approval must apply to the current artifact and current phase.

## Design Approval

After `architect` creates `docs/specs/<feature>/design.md` and `designer` creates `docs/specs/<feature>/ui-spec.md` when UI is involved, `dispatcher` must stop and request user approval.

Do not proceed to planning until the user explicitly approves the design artifacts for this feature.

## Implementation Approval

After `planner` creates `docs/specs/<feature>/implementation.md` and `plan-reviewer` returns `PLAN_APPROVED`, `dispatcher` must stop and request user approval.

Do not proceed to build until the user explicitly approves the implementation artifact for this feature.

## Explicit Approval Examples

Approval:

```text
approved
approve design
approve implementation
yes, proceed to planning
yes, proceed to build
```

Not approval:

```text
looks good, but...
almost
what do you think?
can you explain this?
```

## Artifact Requirement

Approval gates require written artifacts at the protected paths.

Do not request design approval without `design.md`.

Do not request implementation approval without `implementation.md`.
