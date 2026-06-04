# Dispatcher Routing Guidelines

This file supplements `workflow/routing.md`. It does not replace approval gates, protected artifact rules, sensitive-data rules, or the full workflow.

## Routing Priority

When selecting an agent, classify the task by highest-risk applicable category first:

1. Sensitive security work: route through `execution/sensitive-data.md`; use `security-reviewer`, `security-auditor`, or the appropriate high-tier agent after approval.
2. Architecture or cross-system decisions: `architect`, `high-architect`, or `high-engineer`.
3. Database schema, migrations, indexing, or transaction behavior: `database-engineer`.
4. UI/UX design artifacts: `designer` or `high-designer`.
5. Frontend implementation: `frontend-engineer` or `frontend-polisher`.
6. Backend implementation: `backend-engineer`.
7. Tests-only implementation: `test-engineer`.
8. Review-only work: `code-reviewer`, `security-reviewer`, or `reviewer`.
9. Trivial mechanical fixes: `low-engineer` or `low-task-worker` only when every trivial-fix rule passes.

## Low-Tier Routing

- `low-engineer`: tiny mechanical edits; no new behavior, no tests, no domain judgment.
- `low-task-worker`: read-only checks, trivial file creation with exact content, or tiny mechanical edits.
- Never route security, database, architecture, production config, schema, auth, payment, IAM, PII, or multi-file reasoning work to low-tier agents.
- If the task needs tests, route to a TDD-capable agent named in `execution/implementation-safety.md`.

## Required Dispatch Check

Before dispatching, `dispatcher` must identify:

- trivial vs substantial workflow path
- sensitive-area status
- protected artifact impact
- target agent and why that agent fits
- verification expected from the agent

If any item is unclear and the safe default would change user-visible behavior, ask one `NEEDS_USER_INPUT` question.

## Escalation

- If a mid-tier agent reports the task exceeds its capability, escalate to the corresponding `high-*` agent.
- If the task requires a deep security audit, escalate to `security-auditor`.
- If an agent returns `ESCALATION_REQUEST`, do not re-dispatch the same scope to a cheaper agent.
