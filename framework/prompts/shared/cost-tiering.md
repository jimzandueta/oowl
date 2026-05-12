# Cost Tiering

This framework runs three cost tiers. Use the cheapest tier that can do the work safely. Escalate when the work outgrows the tier.

## Tiers

| Tier | Agents | Use for |
|---|---|---|
| Low | `low-engineer`, `low-task-worker`, `low-architect`, `low-designer` | small, bounded, well-specified work with clear scope and no new feature behavior |
| Mid | `architect`, `planner`, `reviewer`, `designer`, `frontend-engineer`, `frontend-polisher`, `backend-engineer`, `database-engineer`, `cloud-architect`, `test-engineer`, `code-reviewer`, `security-reviewer`, `plan-reviewer` | the default workflow path; substantial features and reviews |
| High | `high-engineer`, `high-architect`, `high-designer`, `security-auditor` | escalations only \u2014 hard problems where mid-tier capability is insufficient |

## Why no `low-planner`

Planning is the most consequential decision in the workflow. A bad plan compounds across every downstream task. `planner` runs at mid-tier by design; there is no low-tier planner.

## When to Escalate

A subagent must return `ESCALATION_REQUEST` when one or more of the following is true:

- the work crosses module or service boundaries the agent cannot safely reason about
- the change exceeds the assignment's stated file count or line budget
- the task prompt is ambiguous and a guess could produce silent incorrect behavior
- the agent attempted a fix and verification failed in a way it cannot diagnose
- the agent encounters sensitive data or sensitive code paths (see `sensitive-data.md`)

## When to De-escalate

`dispatcher` and `planner` may route work to a lower tier when:

- the change is small (a few lines), local (a single file or a tightly bounded set), and obvious
- the verification is local (lint, typecheck, focused unit test)
- no sensitive area is touched (see `sensitive-data.md`)
- no architectural decision is required

The trivial-fix fast-path in `routing.md` formalizes this for the most common case.

## Low-Tier Limits

Low-tier edit limits and test-first routing rules are defined in `implementation-safety.md`.

Low-tier agents must not be used as a TDD bypass. If the work exceeds that shared policy, escalate instead of implementing.

## Escalation Targets

| From | To | When |
|---|---|---|
| `low-engineer` | `frontend-engineer` / `backend-engineer` / etc. | the change requires domain judgment |
| any mid-tier implementer | `high-engineer` | multi-file refactor, performance-critical change, or root-cause debugging |
| `architect` | `high-architect` | escalated architecture, reliability, or cross-system tradeoff |
| `designer` | `high-designer` | escalated UX or product-design decision |
| `security-reviewer` | `security-auditor` | deep audit needed (threat modeling, IAM, PII, compliance) |
