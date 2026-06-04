# Implementation Safety

Use this policy to keep behavior changes test-first, prevent low-tier shortcuts, and route mechanical work to the cheapest capable tier.

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

## Mechanical vs Reasoning Dispatch

To reduce cost, `builder` routes **mechanical** tasks to `low-engineer` even if the planner assigned a mid-tier agent.

A task is **mechanical** if ALL of the following are true:

- the input is a clear, unambiguous spec (complete design, exact file path, exact intended content or a well-defined template)
- no design decisions, architecture choices, or domain judgment are required
- no tests need to be created or updated
- the output is a direct translation of the spec into code or configuration
- verification is local (lint, typecheck, build)

A task is **reasoning** if ANY of the following is true:

- design decisions, component structure, or API shape must be inferred
- tests must be created or updated
- the spec is ambiguous or incomplete
- the change crosses module or service boundaries
- sensitive data or security logic is involved

`builder` routes mechanical tasks to `low-engineer` and reasoning tasks to the assigned mid-tier agent.

If `low-engineer` receives a mechanical task that turns out to require reasoning, it must return `ESCALATION_REQUEST` so `builder` can re-dispatch to the full agent.

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
- `plan-reviewer` validates that mechanical tasks have a clear, unambiguous spec - tasks with ambiguous specs must be marked as reasoning.
- `builder` schedules only approved task specs from `implementation.md`; it must not rewrite task scope.
- `builder` may route mechanical tasks to `low-engineer` even if the planner assigned a different agent. This is cost-optimized dispatch within the same task scope.
- If `builder` finds a ready task that violates this policy, it stops and returns `NEEDS_USER_INPUT` asking `dispatcher` to send the plan back for planner revision.
