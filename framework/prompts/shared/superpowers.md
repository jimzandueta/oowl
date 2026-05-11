# Superpowers Policy

Superpowers is the methodology layer. Use each skill only where it directly improves the agent's work.

## Skill Assignments

| Agent               | Skill                            | Required or Optional                                 |
| ------------------- | -------------------------------- | ---------------------------------------------------- |
| `architect`         | `brainstorming`                  | Required                                             |
| `designer`          | `brainstorming`                  | Optional                                             |
| `planner`           | `writing-plans`                  | Required                                             |
| `frontend-engineer` | `test-driven-development`        | Required                                             |
| `frontend-engineer` | `systematic-debugging`           | Optional — use when debugging failures               |
| `frontend-polisher` | `verification-before-completion` | Required                                             |
| `backend-engineer`  | `test-driven-development`        | Required                                             |
| `backend-engineer`  | `systematic-debugging`           | Optional — use when debugging failures               |
| `database-engineer` | `test-driven-development`        | Required                                             |
| `cloud-architect`   | `verification-before-completion` | Required                                             |
| `cloud-architect`   | `systematic-debugging`           | Optional — use when diagnosing infrastructure issues |
| `test-engineer`     | `test-driven-development`        | Required                                             |
| `test-engineer`     | `verification-before-completion` | Required                                             |
| `high-engineer`  | `test-driven-development`        | Required                                             |
| `high-engineer`  | `systematic-debugging`           | Optional — use when debugging failures               |
| `high-architect`    | `brainstorming`                  | Optional                                             |
| `high-architect`    | `systematic-debugging`           | Optional                                             |
| `high-designer`     | `brainstorming`                  | Optional                                             |
| `reviewer`          | `verification-before-completion` | Required                                             |
| `code-reviewer`     | `verification-before-completion` | Required                                             |
| `security-reviewer` | `verification-before-completion` | Required                                             |
| `security-auditor`  | `verification-before-completion` | Required                                             |

## Prohibited

`dispatcher`, `builder`, `plan-reviewer`, `low-engineer`, `low-task-worker`, `low-architect`, and `low-designer` must not load Superpowers skills.
