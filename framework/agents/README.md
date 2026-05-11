# Agents

Agents are organized by class. The OpenCode runtime uses the file basename as the agent name, so `orchestration/dispatcher.md` registers as `dispatcher`.

| Class directory | Agents |
|---|---|
| `orchestration/` | `dispatcher`, `builder` |
| `artifact-owners/` | `architect`, `designer`, `planner`, `reviewer` |
| `implementation/` | `frontend-engineer`, `frontend-polisher`, `backend-engineer`, `database-engineer`, `cloud-architect`, `test-engineer` |
| `review/` | `code-reviewer`, `security-reviewer`, `security-auditor`, `plan-reviewer` |
| `escalation/` | `high-engineer`, `high-architect`, `high-designer` |
| `low-tier/` | `low-engineer`, `low-task-worker`, `low-architect`, `low-designer` |

See `.opencode/prompts/shared/cost-tiering.md` for the three-tier framework and `.opencode/prompts/shared/routing.md` for default flow and the trivial-fix path.
