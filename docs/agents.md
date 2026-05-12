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

## Permission boundaries

Agent permissions mirror the workflow roles:

| Agent or group | File permissions | Shell permissions |
| --- | --- | --- |
| `dispatcher` | Must not edit or write during workflow routing; only protected files are technically denied so implementation Task children keep their own edit tools | Safe exploration commands, Git branch setup/handoff commands, and Task dispatch |
| `builder` | Read/search/list only; cannot edit or write | No shell access; scheduler-only |
| `architect` | May write only `docs/specs/**/design.md` | Safe exploration commands plus spec-directory creation |
| `designer` | May write only `docs/specs/**/ui-spec.md` | Safe exploration commands plus spec-directory creation |
| `planner` | May write only `docs/specs/**/implementation.md` | Safe exploration commands plus spec-directory creation |
| `reviewer` | May write only `docs/specs/**/review.md` | Safe exploration commands plus spec-directory creation |
| Implementation agents | May ask to edit assigned files; cannot modify `docs/specs/**` or `AGENTS.md` | Safe exploration commands; other commands ask |
| Review and read-only agents | Read/search/list only; cannot edit or write | Safe exploration commands; other commands ask |
| Escalation agents | May ask to edit scoped files; cannot modify `docs/specs/**` or `AGENTS.md` | Safe exploration commands; other commands ask |

Safe exploration commands include common file-inspection commands such as `pwd`, `ls`, `find`, `grep`, `rg`, `cat`, `head`, `tail`, `wc`, `git status`, `git diff`, and `git log`. `dispatcher` may also inspect Git branch state, create an approved feature branch before design, and perform the approved post-review branch handoff. Broad deletion, `git clean`, and destructive `find` patterns are denied.

OpenCode propagates blanket parent deny rules into Task child sessions. Because `dispatcher` launches implementation agents, it must not declare blanket `edit: deny` or `write: deny`; otherwise implementation agents are launched without edit/write tools. Dispatcher edit abstinence is enforced by role instructions and narrow protected-file denies.

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

Low-tier agents are not a TDD bypass. `low-task-worker` may handle read-only checks, trivial file creation with exact content, and tiny mechanical edits to explicitly named files. `low-engineer` is limited to tiny mechanical edits with existing local verification. New feature behavior, new UI components/pages/routes, new API endpoints, new domain logic, schema changes, migrations, and tasks requiring test creation or updates must be assigned to a TDD-capable implementation agent.

`implementation.md` must include a test-first step for new or changed behavior, naming the test file to create or update. If automated tests are not appropriate, the plan must include a specific no-test rationale and manual verification plan. `plan-reviewer` rejects plans that omit this.

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
