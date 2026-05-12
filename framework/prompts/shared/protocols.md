# Protocols

Use exact protocol names. Do not invent variants.

## Universal Agent Constraints

All agents must not:

- invoke the Task tool (except `dispatcher`)
- use `general`
- use `explore`

These are enforced by frontmatter and restated here for reference.

All agents should use Caveman Lite (see `caveman.md`) for runtime protocol blocks, routing summaries, and scheduling notes. Do not compress human-reviewed artifacts, code blocks, file paths, JSON/YAML, protocol blocks, approval questions, security warnings, or irreversible-action confirmations.

## NEEDS_USER_INPUT

```text
NEEDS_USER_INPUT
Question: <one clear question>
Why needed: <brief reason>
Default if unanswered: <safe default>
Subagent summary: <brief summary>
```

## REQUEST_CONSULT

`builder` and other phase agents use this to ask `dispatcher` to dispatch a named agent.

This is a text protocol, not a Task invocation. Non-dispatcher agents must return this block to `dispatcher`; they must not call Task themselves.

```text
REQUEST_CONSULT
Target agent: <agent-name>
Task ID: <task id, if any>
File locks:
- <path>
Task prompt: |
  <complete prompt dispatcher should send directly>
Expected output: <expected result>
Verification requirements:
- <check>
Subagent summary: <current state>
```

## REQUEST_CONSULT_BATCH

`REQUEST_CONSULT_BATCH` is atomic.

When `dispatcher` receives a valid batch with 2-3 eligible tasks, it must issue all Task calls in the same assistant message before waiting for any result.

This is a text protocol, not a Task invocation. Non-dispatcher agents must return this block to `dispatcher`; they must not call Task themselves.

```text
REQUEST_CONSULT_BATCH
Max parallel: 3
Wave: <wave id>
Parallel group: <group id>
Atomic dispatch required: yes
Tasks:
- Target agent: <agent-name>
  Task ID: <task id>
  File locks:
    - <path>
  Task prompt: |
    <complete prompt dispatcher should send directly>
  Expected output: <expected result>
  Verification requirements:
    - <check>
  Reason parallel-safe: <reason>
Subagent summary: <why this batch is safe>
```

Serializing a valid `REQUEST_CONSULT_BATCH` is a protocol violation.

## PHASE_COMPLETE

```text
PHASE_COMPLETE
Phase: <design | implementation-spec | build | review | ui-spec>
Summary: <summary>
Artifacts:
- <file created or modified>
Next phase: <user-design-approval | user-implementation-approval | plan-reviewer | build | review | done>
Risks: <remaining risks>
Verification:
- <checks performed or required>
```

## PLAN_APPROVED

```text
PLAN_APPROVED
Summary: <why this plan is executable>
Next phase: user-implementation-approval
Risks: <remaining risks>
Verification: <expected verification>
```

## PLAN_REJECTED

```text
PLAN_REJECTED
Issues:
- <BLOCKER or WARNING>: <issue>
Required changes:
- <specific fix>
Return to: planner
```

## ESCALATION_REQUEST

```text
ESCALATION_REQUEST
Target agent: <high-engineer | high-architect | high-designer | security-auditor>
Why cheaper agents are insufficient: <reason>
What was attempted: <summary>
Specific output needed: <decision or deliverable>
Risk if wrong: <impact>
```

## TASK_COMPLETE

```text
TASK_COMPLETE
Task ID: <task id>
Files changed:
- <file>
Verification:
- <command/result>
Risks:
- <risk or none>
Notes:
- <brief note>
Protected artifacts:
- confirmed docs/specs/** unchanged and present
```

## REVIEW_COMPLETE

```text
REVIEW_COMPLETE
Summary: <summary>
Findings:
- <finding count by severity>
Blocking issues: <yes/no>
Verification gaps:
- <gap or none>
```

## ESCALATION_COMPLETE

```text
ESCALATION_COMPLETE
Reason escalation was justified: <reason>
Result: <summary>
Files changed or decisions made:
- <item>
Verification:
- <command/result or recommended check>
Remaining risks:
- <risk or none>
```

## PARALLEL_DISPATCH_FAILED

```text
PARALLEL_DISPATCH_FAILED
Reason: <why concurrent dispatch was not possible>
Fallback proposed: <serial execution | smaller batch | user decision>
```

## PROTECTED_ARTIFACT_MISSING

Use this when protected workflow artifacts are missing after an implementation task or batch.

```text
PROTECTED_ARTIFACT_MISSING
Missing:
- <path>
Last task or batch: <summary>
Required action: restore from git or snapshot before continuing
```

The workflow must stop until protected artifacts are restored.

## TRIVIAL_FIX_DISPATCH

`dispatcher` uses this when bypassing the full workflow for a trivial fix (see `routing.md`).

```text
TRIVIAL_FIX_DISPATCH
Justification:
- under ~20 lines and under 3 files
- no sensitive area touched
- no new dependencies
- no architectural decision required
Target agent: <agent-name>
Task prompt: |
  <complete prompt>
Files: <expected files>
Verification: <required checks>
```

After the implementer returns `TASK_COMPLETE`, `dispatcher` summarizes for the user. `reviewer` runs only if the user requests it.
