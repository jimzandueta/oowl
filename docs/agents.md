# Agents

oowl ships 23 agents across 6 classes.

## Agent classes

| Class | Agents |
| --- | --- |
| Orchestration | `dispatcher`, `builder` |
| Artifact owners | `architect`, `designer`, `planner`, `reviewer` |
| Implementation | `frontend-engineer`, `frontend-polisher`, `backend-engineer`, `database-engineer`, `cloud-architect`, `test-engineer` |
| Review | `code-reviewer`, `plan-reviewer`, `security-reviewer`, `security-auditor` |
| Escalation | `high-engineer`, `high-architect`, `high-designer` |
| Low-tier bounded | `low-engineer`, `low-task-worker`, `low-architect`, `low-designer` |

Agent files live in `framework/agents/` and are copied to `.opencode/agents/` on install.

---

## Superpowers usage policy

Superpowers skills are loaded selectively — not by every agent.

| Agent or group | Superpowers behavior |
| --- | --- |
| `architect` | Required `brainstorming` for architecture exploration |
| `designer` | Optional `brainstorming` for UI/UX exploration |
| `planner` | Required `writing-plans` so `implementation.md` is mechanical and executable |
| `frontend-engineer`, `backend-engineer`, `database-engineer`, `test-engineer`, `high-engineer` | Required `test-driven-development` |
| `frontend-engineer`, `backend-engineer`, `cloud-architect`, `high-engineer`, `high-architect` | Optional `systematic-debugging` when diagnosing failures |
| `frontend-polisher`, `cloud-architect`, `test-engineer`, `reviewer`, `code-reviewer`, `security-reviewer`, `security-auditor` | Required `verification-before-completion` |
| `high-architect`, `high-designer` | Optional `brainstorming` for escalated design work |
| `dispatcher`, `builder`, `plan-reviewer` | Do not load skills |
| `low-engineer`, `low-task-worker`, `low-architect`, `low-designer` | Do not load skills |

---

## Cost tiers

| Tier | Agents | Profile key |
| --- | --- | --- |
| Cheap/fast | `dispatcher`, `builder`, `low-engineer`, `low-task-worker`, `low-architect`, `low-designer` | `cheap-fast` |
| Mid/balanced | `architect`, `planner`, `plan-reviewer`, `reviewer`, `designer`, `frontend-engineer`, `frontend-polisher`, `backend-engineer`, `database-engineer`, `cloud-architect`, `test-engineer`, `code-reviewer`, `security-reviewer` | `mid-balanced` |
| Premium/deep | `high-engineer`, `high-architect`, `high-designer`, `security-auditor` | `premium-deep` |

---

## Slash commands

23 slash commands mirror the agent structure:

| Class | Commands |
| --- | --- |
| Workflow | `build`, `check-plan`, `design`, `plan`, `review` |
| Domain | `domain-architect`, `domain-backend-engineer`, `domain-cloud-architect`, `domain-code-reviewer`, `domain-database-engineer`, `domain-designer`, `domain-frontend-engineer`, `domain-frontend-polisher`, `domain-security-auditor`, `domain-security-reviewer`, `domain-test-engineer` |
| Escalation | `high-architect`, `high-designer`, `high-engineer` |
| Low-tier | `low-architect`, `low-designer`, `low-engineer`, `low-task-worker` |

Command files live in `framework/commands/`.
