# Plan Completeness Checklist

Every `implementation.md` must be specific enough for `builder` to schedule without inventing missing details. `plan-reviewer` must reject plans that fail the required checks below.

## Required Sections

- feature slug and scope
- assumptions and non-goals
- affected files and protected-artifact statement
- task waves with dependency order
- verification plan
- rollback or recovery notes when risk warrants it

## Required Task Fields

Each task must include:

- unique task ID
- target agent
- objective
- exact file locks
- create/update/delete classification for each file
- test-first step for behavior changes, or a specific no-test rationale
- implementation steps
- expected output
- verification commands
- dependencies and parallel-safety reason

## Rejection Conditions

`plan-reviewer` must return `PLAN_REJECTED` when any condition is true:

- a behavior-changing task lacks a test-first step or no-test rationale
- file locks are missing, broad, overlapping without coordination, or include `docs/**`
- parallel tasks lack explicit parallel-safety reasons
- low-tier assignments exceed `execution/implementation-safety.md`
- sensitive work is assigned to low-tier or lacks approval handling
- verification is absent or only says "manual check" without steps
- task prompts require implementation agents to infer architecture, scope, or hidden requirements

## Review Output

Approval must use `PLAN_APPROVED`. Rejection must use `PLAN_REJECTED` with specific issues and suggested changes.
