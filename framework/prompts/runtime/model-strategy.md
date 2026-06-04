# Model Strategy

Profile: `low`

Cost-first profile for long sessions and routine development. Uses Flash and Budget tiers for most agents, Mid and High only where production risk demands it.

This file is generated from:

```text
./framework/model-profiles/low.json
```

Do not edit model assignments here directly. Update a JSON profile and run:

```bash
scripts/apply-profile-models.sh <free|low|balanced|high|provider-agnostic|path-to-json>
```

The `oowl profile` command and model-profile script both update runtime agent frontmatter and this strategy file. They do not update `AGENTS.md`.

## Global Settings

| Setting | Value |
|---|---|
| model | `opencode-go/deepseek-v4-flash` |
| small_model | `opencode/nemotron-3-super-free` |
| default_agent | `dispatcher` |

## Agent Model Map

| Agent | Model | Reason |
|---|---|---|
| `dispatcher` | `opencode-go/deepseek-v4-flash` | Cheapest — pure routing, no reasoning needed. |
| `architect` | `opencode-go/minimax-m2.7` | Low-mid — sufficient for design exploration and tradeoffs. |
| `planner` | `opencode-go/minimax-m2.7` | Low-mid — task decomposition and dependency ordering. |
| `plan-reviewer` | `opencode-go/minimax-m2.7` | Low-mid — validation, file lock overlap checking. |
| `builder` | `opencode-go/deepseek-v4-flash` | Cheapest — scheduler only, no implementation. |
| `reviewer` | `opencode-go/minimax-m2.7` | Low-mid — review coordination and verification summary. |
| `designer` | `opencode-go/minimax-m2.7` | Low-mid — UI/UX design and ui-spec.md. |
| `frontend-engineer` | `opencode-go/minimax-m2.7` | Low-mid — implementation, debugging, tests. |
| `frontend-polisher` | `opencode-go/minimax-m2.5` | Cheapest — visual tweaks, interaction polish. |
| `backend-engineer` | `opencode-go/minimax-m2.7` | Low-mid — APIs, domain logic, integrations. |
| `database-engineer` | `opencode-go/qwen3.6-plus` | Mid — schema design and data integrity need broader context. |
| `cloud-architect` | `opencode-go/qwen3.6-plus` | Mid — infra design, IaC, reliability decisions. |
| `test-engineer` | `opencode-go/mimo-v2.5` | Cheapest — test creation and coverage analysis. |
| `code-reviewer` | `opencode-go/minimax-m2.7` | Low-mid — code correctness and maintainability. |
| `security-reviewer` | `opencode-go/glm-5` | Mid — first-pass security analysis needs quality. |
| `security-auditor` | `opencode-go/glm-5.1` | High — production risk decisions need strongest model. |
| `low-engineer` | `opencode-go/deepseek-v4-flash` | Cheapest — non-sensitive bounded tasks. |
| `low-task-worker` | `opencode-go/deepseek-v4-flash` | Cheapest — read/check/summarize only. |
| `low-architect` | `opencode-go/mimo-v2.5` | Cheapest — bounded non-sensitive architecture reasoning. |
| `low-designer` | `opencode-go/mimo-v2.5` | Cheapest — bounded non-sensitive design work. |
| `high-engineer` | `opencode-go/minimax-m3` | Mid — escalation coding needs better reasoning. |
| `high-architect` | `opencode-go/glm-5.1` | High — escalation architecture and risk decisions. |
| `high-designer` | `opencode-go/minimax-m3` | Mid — escalation design needs better quality. |

## Runtime Rule

The runtime source of truth is each agent file frontmatter:

```text
.opencode/agents/<agent>.md
```

The selected JSON profile is materialized into those frontmatter blocks by:

```bash
oowl profile <free|low|balanced|high>
scripts/apply-profile-models.sh
```
