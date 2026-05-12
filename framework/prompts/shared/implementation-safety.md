# Implementation Safety

Use this policy to keep feature work test-first and prevent low-tier shortcuts from bypassing required methodology.

## Test-First Rule

New or changed behavior must be planned with test-first coverage.

For each behavior-changing task, `implementation.md` must include:

- a test-first step that creates or updates a focused automated test before implementation
- the expected test file path or existing test file to update
- verification commands and done criteria

If automated tests are not appropriate, the task must include a specific no-test rationale and manual verification plan.

## TDD-Capable Agents

Assign new or changed behavior to a TDD-capable agent:

- `frontend-engineer`
- `backend-engineer`
- `database-engineer`
- `test-engineer`
- `high-engineer`

## Low-Tier Limits

Low-tier agents do not load Superpowers and must not be used to bypass TDD.

- `low-task-worker` may handle read-only checks, trivial file creation with exact path and full intended content or mechanical template, and tiny mechanical edits to explicitly named files.
- `low-task-worker` must not delete files, perform broad formatting, refactor, infer missing behavior, implement feature behavior, or create/update tests.
- `low-engineer` may handle only tiny mechanical edits where no new behavior is introduced and existing local verification is enough.
- `low-engineer` must not create new feature behavior, new UI components/pages/routes, new API endpoints, new domain logic, schema changes, migrations, or create/update tests.
- If a low-tier task would require creating or updating tests, assign it to a TDD-capable agent instead.
- If a low-tier agent discovers that the assignment needs tests or feature judgment, it must return `ESCALATION_REQUEST`.

## Review And Scheduling

- `plan-reviewer` rejects any behavior-changing task without test-first work or a specific no-test rationale.
- `plan-reviewer` rejects low-tier assignments that exceed the limits above.
- `builder` schedules only approved task specs from `implementation.md`; it must not silently down-tier or rewrite assignments.
- If `builder` finds a ready task that violates this policy, it stops and returns `NEEDS_USER_INPUT` asking `dispatcher` to send the plan back for planner revision.
