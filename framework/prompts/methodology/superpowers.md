# Superpowers Policy

Superpowers is the methodology layer. Use each skill only where it directly improves the agent's work.

## Skill Assignments

| Agent | Skill | Required or Optional |
|---|---|---|
| `architect` | `brainstorming` | Required |
| `architect` | `dispatching-parallel-agents` | Optional |
| `designer` | `brainstorming` | Optional |
| `designer` | `verification-before-completion` | Required |
| `designer` | `ui-ux-pro-max` | Optional - use only when installed and approved |
| `planner` | `writing-plans` | Required |
| `planner` | `dispatching-parallel-agents` | Optional |
| `dispatcher` | `using-git-worktrees` | Optional |
| `frontend-engineer` | `test-driven-development` | Required |
| `frontend-engineer` | `verification-before-completion` | Required |
| `frontend-engineer` | `systematic-debugging` | Optional - use when debugging failures |
| `frontend-engineer` | `requesting-code-review` | Optional |
| `frontend-engineer` | `receiving-code-review` | Optional |
| `frontend-polisher` | `verification-before-completion` | Required |
| `frontend-polisher` | `receiving-code-review` | Optional |
| `backend-engineer` | `test-driven-development` | Required |
| `backend-engineer` | `verification-before-completion` | Required |
| `backend-engineer` | `systematic-debugging` | Optional - use when debugging failures |
| `backend-engineer` | `requesting-code-review` | Optional |
| `backend-engineer` | `receiving-code-review` | Optional |
| `database-engineer` | `test-driven-development` | Required |
| `database-engineer` | `verification-before-completion` | Required |
| `database-engineer` | `receiving-code-review` | Optional |
| `cloud-architect` | `verification-before-completion` | Required |
| `cloud-architect` | `systematic-debugging` | Optional - use when diagnosing infrastructure issues |
| `cloud-architect` | `receiving-code-review` | Optional |
| `test-engineer` | `test-driven-development` | Required |
| `test-engineer` | `verification-before-completion` | Required |
| `test-engineer` | `receiving-code-review` | Optional |
| `reviewer` | `verification-before-completion` | Required |
| `reviewer` | `receiving-code-review` | Optional |
| `reviewer` | `finishing-a-development-branch` | Optional |
| `code-reviewer` | `verification-before-completion` | Required |
| `code-reviewer` | `receiving-code-review` | Optional |
| `security-reviewer` | `verification-before-completion` | Required |
| `security-reviewer` | `receiving-code-review` | Optional |
| `security-auditor` | `verification-before-completion` | Required |
| `security-auditor` | `receiving-code-review` | Optional |
| `high-engineer` | `test-driven-development` | Required |
| `high-engineer` | `systematic-debugging` | Optional - use when debugging failures |
| `high-engineer` | `requesting-code-review` | Optional |
| `high-engineer` | `receiving-code-review` | Optional |
| `high-engineer` | `executing-plans` | Optional |
| `high-architect` | `brainstorming` | Optional |
| `high-architect` | `systematic-debugging` | Optional |
| `high-architect` | `receiving-code-review` | Optional |
| `high-designer` | `brainstorming` | Optional |
| `high-designer` | `verification-before-completion` | Required |
| `high-designer` | `ui-ux-pro-max` | Optional - use only when installed and approved |
| `high-designer` | `receiving-code-review` | Optional |

## Optional Skill Rule

Optional skills may be loaded only when they are installed and useful for the current task. Optional third-party skills configured by `oowl init` must not be treated as required project dependencies.

## Prohibited

`dispatcher`, `builder`, `plan-reviewer`, `low-engineer`, `low-task-worker`, `low-architect`, and `low-designer` must not load Superpowers skills.
