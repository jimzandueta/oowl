# Routing

The workflow has one execution model.

```text
dispatcher routes and dispatches
dispatcher handles substantial-work Git branch gates
builder schedules
implementation agents execute
reviewer verifies and reports
```

## Default Flow

```text
dispatcher
  -> Git branch gate when inside a Git worktree
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
  -> Git branch handoff when dispatcher created a feature branch
```

## Git Branch Gate

For substantial work, `dispatcher` checks whether the session is inside a Git worktree before it dispatches `architect`.

If Git is active, `dispatcher` asks whether to create a new feature branch or continue on the current branch. When the user chooses a new branch, `dispatcher` creates and switches to it before design begins, then tracks the original branch and feature branch for the rest of the workflow.

After review approval, if `dispatcher` created the feature branch, it asks whether to merge it to `main`, leave it for manual merge, or continue working on the same branch. Automatic merge is allowed only with explicit user approval and a clean worktree.

## Trivial Fix Path

`dispatcher` may bypass the full workflow and route directly to an implementer when **all** of the following are true:

- the change is small (under ~20 lines, under 3 files)
- no schema, auth, security, payment, IAM, secrets, PII, or production configuration is touched (see `sensitive-data.md`)
- no new dependencies are introduced
- no architectural decision is required (the fix is mechanical or obvious)
- no new feature behavior, new UI component/page/route, new API endpoint, or new domain behavior is introduced
- no test creation or test update is required

On the trivial fix path:

- no `design.md`, `implementation.md`, or `review.md` is created
- `dispatcher` returns `TRIVIAL_FIX_DISPATCH` and dispatches one implementation agent with a complete task prompt and verification requirements
- low-tier routing must follow `implementation-safety.md`
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
