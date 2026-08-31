# Model Strategy

Profile: `low`

Cost-first profile for small projects and long sessions. Cheap models everywhere, with gpt-5.6-luna (cheap but strong) for core reasoning and a mid-tier bump only for security and data-integrity risk.

This file is generated from:

```text
./framework/model-profiles/low.json
```

Do not edit model assignments here directly. Update a JSON profile and run:

```bash
scripts/apply-profile-models.sh <free|low|balanced|high|openai|provider-agnostic|path-to-json>
```

The `oowl profile` command and model-profile script both update runtime agent frontmatter and this strategy file. They do not update `AGENTS.md`.

## Global Settings

| Setting | Value |
|---|---|
| model | `opencode-go/minimax-m2.7` |
| small_model | `opencode/nemotron-3-ultra-free` |
| default_agent | `dispatcher` |

## Agent Model Map

| Agent | Model | Reason |
|---|---|---|
| `dispatcher` | `opencode-go/minimax-m2.7` | Low-mid — routing and complete prompt framing. |
| `architect` | `opencode-go/gpt-5.6-luna` | Cheap frontier — design exploration and tradeoffs. |
| `planner` | `opencode-go/gpt-5.6-luna` | Cheap frontier — task decomposition and dependency ordering. |
| `plan-reviewer` | `opencode-go/gpt-5.6-luna` | Cheap frontier — validation and file lock overlap checks. |
| `builder` | `opencode-go/minimax-m2.7` | Low-mid — turns implementation.md into concrete task specs. |
| `reviewer` | `opencode-go/gpt-5.6-luna` | Cheap frontier — review coordination and verification summary. |
| `designer` | `opencode-go/gpt-5.6-luna` | Cheap frontier — UI/UX design and ui-spec.md. |
| `frontend-engineer` | `opencode-go/gpt-5.6-luna` | Cheap frontier — frontend implementation, debugging, tests. |
| `frontend-polisher` | `opencode-go/minimax-m2.7` | Cheapest — visual tweaks and interaction polish. |
| `backend-engineer` | `opencode-go/gpt-5.6-luna` | Cheap frontier — APIs, domain logic, and integrations. |
| `database-engineer` | `opencode-go/qwen3.6-plus` | Mid — schema design and data integrity need broader context. |
| `cloud-architect` | `opencode-go/qwen3.6-plus` | Mid — infra design, IaC, and reliability decisions. |
| `test-engineer` | `opencode-go/mimo-v2.5` | Cheapest — test creation and coverage analysis. |
| `code-reviewer` | `opencode-go/gpt-5.6-luna` | Cheap frontier — code correctness and maintainability. |
| `security-reviewer` | `opencode-go/glm-5.3` | Mid — first-pass security analysis needs quality. |
| `security-auditor` | `opencode-go/glm-5.3` | Mid — security audit for production risk. |
| `low-engineer` | `opencode-go/deepseek-v4-flash` | Cheapest — non-sensitive bounded mechanical edits. |
| `low-task-worker` | `opencode-go/deepseek-v4-flash` | Cheapest — read/check/summarize only. |
| `low-architect` | `opencode-go/mimo-v2.5` | Cheapest — bounded non-sensitive architecture notes. |
| `low-designer` | `opencode-go/mimo-v2.5` | Cheapest — bounded non-sensitive design notes. |
| `high-engineer` | `opencode-go/minimax-m3` | Low-mid — escalation coding needs better reasoning. |
| `high-architect` | `opencode-go/glm-5.3` | Mid — escalation architecture and risk decisions. |
| `high-designer` | `opencode-go/minimax-m3` | Low-mid — escalation design needs better quality. |

## Runtime Rule

The runtime source of truth is each agent file frontmatter:

```text
.opencode/agents/<agent>.md
```

The selected JSON profile is materialized into those frontmatter blocks by:

```bash
oowl profile <free|low|balanced|high|openai>
scripts/apply-profile-models.sh
```
