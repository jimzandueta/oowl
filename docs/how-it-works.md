# How it works

## The full workflow

Substantial work follows one path:

```text
USER
  |
  v
DISPATCHER
  |-- trivial, non-sensitive task ----------------------.
  |                                                       v
  |                                                ONE IMPLEMENTER
  |                                                       |
  |                                                       v
  |                                                     DONE
  |
  '-- substantial task
        |
        v
  GIT BRANCH GATE (when inside a Git worktree)
        |
        v
  ARCHITECT  +  DESIGNER when UI is involved
        |          |
        '----.-----'
             v
      user approves design artifacts
             |
             v
          PLANNER
             |
             v
       PLAN-REVIEWER
             |-- PLAN_REJECTED --> PLANNER revises implementation.md
             |
             '-- PLAN_APPROVED
                    |
                    v
          user approves implementation.md
                    |
                    v
                 BUILDER
          schedules only; does not edit or invoke Task
                    |
                    v
      REQUEST_CONSULT or REQUEST_CONSULT_BATCH
                    |
                    v
                DISPATCHER
          dispatches assigned implementation agents
                    |
                    v
      frontend / backend / database / cloud / test / low / high agents
          each follows its task prompt, file locks, and verification requirements
                    |
                    v
                 BUILDER
          receives results and schedules next wave if needed
                    |
                    v
                REVIEWER
          may consult code-reviewer, security-reviewer, or security-auditor
                    |
                    v
          BRANCH HANDOFF (if dispatcher created a feature branch)
                    |
                    v
                  DONE
```

## Step by step

### 1. Dispatch

`dispatcher` classifies the request and routes it. It does not implement.

Trivial-fix criteria — all must be true:
- under ~20 lines, under 3 files
- no schema, auth, security, payment, IAM, secrets, PII, or production config touched
- no new dependency introduced
- no architectural decision required

Trivial work emits `TRIVIAL_FIX_DISPATCH` and routes to one implementer. No `design.md`, `implementation.md`, or `review.md` is created.

Substantial work routes to `architect`, and to `designer` if UI is involved.

### 2. Git branch gate

Before substantial work reaches `architect`, `dispatcher` checks whether the session is inside a Git worktree.

If Git is active, it asks whether to create a new feature branch or continue on the current branch. If the user chooses a new branch, `dispatcher` creates and switches to it before design starts. If no Git worktree is active, it skips this gate and continues normally.

### 3. Design

`architect` writes `docs/specs/<feature>/design.md` — solution approach, tradeoffs, risks, boundaries.

If UI is involved, `designer` writes `docs/specs/<feature>/ui-spec.md`.

Dispatcher asks the user to approve. Planning does not start without approval.

### 4. Plan

`planner` writes `docs/specs/<feature>/implementation.md`. Every task declares:

- the assigned agent
- exact file locks
- the full task prompt
- a test-first step for new or changed behavior, including the test file to create or update
- required verification
- whether it can run in parallel

`planner` uses Superpowers `writing-plans` so the plan is mechanical and executable.

If automated tests are not appropriate for a behavior change, `implementation.md` must include a specific no-test rationale and manual verification plan.

### 5. Plan review

`plan-reviewer` audits `implementation.md` and returns `PLAN_APPROVED` or `PLAN_REJECTED`.

Checks:
- every task has a complete prompt, file locks, and verification
- new or changed behavior includes test-first work or a no-test rationale
- low-tier agents are not assigned feature behavior or test-writing work
- parallel tasks do not collide on file locks
- sensitive work is not assigned to low-tier agents
- protected artifacts are not implementation targets
- the plan fully covers the approved design

After `PLAN_APPROVED`, dispatcher asks the user to approve the plan. Implementation does not start without approval.

### 6. Build

`builder` is scheduler-only. It emits `REQUEST_CONSULT` or `REQUEST_CONSULT_BATCH` and does nothing else — no file edits, no shell commands, no Task invocations.

`dispatcher` is the only agent that may invoke implementation agents.

Each implementation agent must:
- edit only files inside its lock
- avoid `docs/specs/**`
- run the required verification
- return `TASK_COMPLETE` with evidence or `NEEDS_USER_INPUT` with a reason

### 7. Review

`reviewer` writes `docs/specs/<feature>/review.md`:
- summary of what shipped
- verification evidence from implementers
- issues by severity
- readiness recommendation: ship, fix, or rework

`reviewer` may consult `code-reviewer`, `security-reviewer`, or `security-auditor`.

`security-auditor` is reserved for deep escalation — threat modeling, IAM, PII, compliance, auth flows, secrets, production risk.

### 8. Branch handoff and done

After reviewer approval, `dispatcher` says that the feature was created. If it created a feature branch at the start, it asks whether to merge the branch to `main`, leave it for the user to merge manually, or continue working on the same branch.

Automatic merge only proceeds after explicit user approval and a clean worktree. If there are uncommitted changes, `dispatcher` leaves the user on the feature branch and reports that the merge must be handled after committing or otherwise managing those changes.

Durable record in `docs/specs/<feature>/`:
- `design.md`
- `ui-spec.md` (if UI was involved)
- `implementation.md`
- `review.md`

---

## Security model

### Sensitive areas requiring explicit user approval

- secrets, credentials, API keys, certificates, signing keys
- PII and customer data
- payment processing and regulated financial flows
- authentication and authorization logic
- IAM policies and access-control configuration
- production infrastructure and production configuration
- destructive database migrations on production-shaped data
- compliance-bound data (HIPAA, GDPR, PCI, SOC 2)
- cryptography, sessions, tokens, signing

If a task touches a sensitive area, the agent stops and returns `NEEDS_USER_INPUT`. Low-tier agents also return `ESCALATION_REQUEST`.

### Protected artifacts

| Artifact | Owner |
| --- | --- |
| `docs/specs/<feature>/design.md` | `architect` |
| `docs/specs/<feature>/ui-spec.md` | `designer` |
| `docs/specs/<feature>/implementation.md` | `planner` |
| `docs/specs/<feature>/review.md` | `reviewer` |

Implementation agents may read but must not edit, delete, or overwrite protected artifacts.

If a protected artifact disappears, the workflow stops with `PROTECTED_ARTIFACT_MISSING`.

### What this does not guarantee

- File locks are workflow contracts, not OS-level ACLs
- Agents can still make mistakes — verification and review remain required
- Model profiles are defaults, not pricing guarantees or benchmarks
- oowl does not replace CI, branch protection, code owners, secret scanning, or human review

---

## Guardrails

| Guardrail | Effect |
| --- | --- |
| Central dispatch | Only `dispatcher` invokes implementation agents |
| Scheduler-only builder | `builder` cannot implement, edit, run shell, or invoke Task |
| File locks | Every implementation task declares exact paths it may edit |
| Parallel-safety review | `plan-reviewer` rejects parallel groups with lock collisions |
| Protected artifacts | Non-owner agents may read `docs/specs/**` but not modify it |
| Mandatory verification | Implementers must provide evidence before `TASK_COMPLETE` |
| Sensitive-area routing | Sensitive work requires approval; low-tier agents must escalate |
| Caveman-Lite boundaries | Runtime chatter can be compressed; artifacts, code, paths, warnings cannot |
| Trivial-fix fast path | Small, mechanical, non-sensitive fixes skip unnecessary ceremony |
