---
description: Run implementation-plan review through the plan-reviewer.
agent: plan-reviewer
subtask: true
---

Review the implementation plan and return `PLAN_APPROVED` or `PLAN_REJECTED`.

Use the `plan-reviewer` prompt, workflow rules, and shared protocol files. Treat `$ARGUMENTS` as the implementation-plan context. Return only the required decision protocol.

$ARGUMENTS
