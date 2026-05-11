# Model Strategy

Profile: `balanced`

Balanced profile for daily fullstack work. Uses stronger models for planning, backend, database, code review, cloud, polished frontend, and deep security only where quality pays off.

This file is generated from:

```text
./opencode/model-profiles/balanced.json
```

Do not edit model assignments here directly. Update a JSON profile and run:

```bash
scripts/apply-profile-models.sh <low|balanced|high|provider-agnostic|path-to-json>
```

This script updates runtime agent frontmatter and this strategy file. It does not update `AGENTS.md`.

## Global Settings

| Setting | Value |
|---|---|
| model | `opencode-go/deepseek-v4-flash` |
| small_model | `opencode/nemotron-3-super-free` |
| default_agent | `dispatcher` |

## Agent Model Map

| Agent | Model | Reason |
|---|---|---|
| `dispatcher` | `opencode-go/deepseek-v4-flash` | Cheap foreground routing, approval gates, and Task dispatch. |
| `architect` | `opencode-go/minimax-m2.5` | Design, architecture tradeoffs, and design.md creation. |
| `planner` | `opencode-go/minimax-m2.5` | Implementation planning, file locks, task prompts, and parallel groups. |
| `plan-reviewer` | `opencode-go/minimax-m2.5` | Strict plan validation, task completeness, and parallel-safety review. |
| `builder` | `opencode-go/deepseek-v4-flash` | Scheduler-only build coordination; does not implement or invoke Task. |
| `reviewer` | `opencode-go/qwen3.5-plus` | Review coordination, verification summary, and readiness recommendation. |
| `designer` | `opencode-go/qwen3.5-plus` | UI/UX design, layout, flows, accessibility, and ui-spec.md. |
| `frontend-engineer` | `opencode-go/qwen3.5-plus` | React, TypeScript, forms, accessibility, frontend state, and tests. |
| `frontend-polisher` | `opencode-go/kimi-k2.6` | High-polish UI, refined interaction behavior, and visual quality. |
| `backend-engineer` | `opencode-go/minimax-m2.5` | APIs, services, workers, validation, integrations, and domain logic. |
| `database-engineer` | `opencode-go/minimax-m2.5` | Schema, migrations, indexes, transactions, and data integrity. |
| `cloud-architect` | `opencode-go/deepseek-v4-pro` | Cloud, IaC, deployment, IAM, reliability, observability, and rollback safety. |
| `test-engineer` | `opencode-go/qwen3.5-plus` | Unit tests, integration tests, regression coverage, fixtures, and verification. |
| `code-reviewer` | `opencode-go/minimax-m2.5` | Read-only correctness, maintainability, performance, and architecture review. |
| `security-reviewer` | `opencode-go/qwen3.5-plus` | First-pass read-only security review. |
| `security-auditor` | `opencode-go/glm-5.1` | Deep security review for auth, IAM, secrets, PII, and production risk. |
| `low-engineer` | `opencode-go/deepseek-v4-flash` | Lowest-cost bounded non-sensitive coding. |
| `low-task-worker` | `opencode-go/deepseek-v4-flash` | Lowest-cost bounded non-sensitive read/check/summarize work. |
| `low-architect` | `opencode-go/qwen3.5-plus` | Cost-effective non-sensitive architecture reasoning. |
| `low-designer` | `opencode-go/qwen3.5-plus` | Cost-effective non-sensitive UI/product design. |
| `high-engineer` | `github-copilot/gpt-5.5` | Premium coding escalation. |
| `high-architect` | `github-copilot/claude-sonnet-4.6` | Premium architecture, reliability, cloud, and security escalation. |
| `high-designer` | `github-copilot/claude-opus-4.7` | Premium UX, product, and system-design escalation. |

## Runtime Rule

The runtime source of truth is each agent file frontmatter:

```text
.opencode/agents/<agent>.md
```

The selected JSON profile is materialized into those frontmatter blocks by:

```bash
scripts/apply-profile-models.sh
```
