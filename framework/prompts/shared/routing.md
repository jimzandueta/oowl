# Routing

The workflow has one execution model.

```text
dispatcher routes and dispatches
builder schedules
implementation agents execute
reviewer verifies and reports
```

## Default Flow

```text
dispatcher
  -> architect
  -> user approves design.md and ui-spec.md when applicable
  -> planner
  -> plan-reviewer
  -> user approves implementation.md
  -> builder
      -> REQUEST_CONSULT or REQUEST_CONSULT_BATCH
  -> dispatcher dispatches assigned implementation agents
  -> builder receives implementation results
  -> reviewer
```

## Trivial Fix Path

`dispatcher` may bypass the full workflow and route directly to an implementer when **all** of the following are true:

- the change is small (under ~20 lines, under 3 files)
- no schema, auth, security, payment, IAM, secrets, PII, or production configuration is touched (see `sensitive-data.md`)
- no new dependencies are introduced
- no architectural decision is required (the fix is mechanical or obvious)

On the trivial fix path:

- no `design.md`, `implementation.md`, or `review.md` is created
- `dispatcher` returns `TRIVIAL_FIX_DISPATCH` and dispatches one implementation agent with a complete task prompt and verification requirements
- `reviewer` runs only if the user requests a final review

If any condition is uncertain, route through the default flow.

## Artifact Flow

- `architect` creates `docs/specs/<feature>/design.md`.
- `designer` creates `docs/specs/<feature>/ui-spec.md` when UI is involved.
- `planner` creates `docs/specs/<feature>/implementation.md`.
- `reviewer` creates `docs/specs/<feature>/review.md`.

Owner agents may create or update their own artifacts. Non-owner agents may read but must not modify protected artifacts.

## Protected Artifact Routing

- `planner` must not assign implementation locks under `docs/**`.
- `plan-reviewer` must reject unsafe protected-artifact mutations.
- `builder` must not schedule tasks that modify protected artifacts.
- `dispatcher` must stop if protected artifacts disappear after a task or batch.
- implementation agents may read `docs/specs/**` but must not modify it.
