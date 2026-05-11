# Model Mapping

The framework defines three semantic model tiers. The provider-agnostic profile (`.opencode/model-profiles/provider-agnostic.json`) uses these as placeholders. Map them to concrete models for your provider.

## Tiers

| Placeholder       | Used by                                                                                                                         | What you want                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `cheap-fast`      | `dispatcher`, `builder`, all `low-*` agents                                                                                     | low cost, low latency, good enough for bounded work    |
| `mid-balanced`    | `architect`, `planner`, `reviewer`, `designer`, all mid-tier implementers, `code-reviewer`, `security-reviewer`, `plan-reviewer` | strong general capability, the default workflow path   |
| `premium-deep`    | `high-engineer`, `high-architect`, `high-designer`, `security-auditor`                                                          | best reasoning, escalations only                       |

## Suggested Mappings

These are starting points. Pick the variant that matches your account access and budget.

### Anthropic

| Placeholder    | Model                          |
| -------------- | ------------------------------ |
| `cheap-fast`   | `anthropic/claude-haiku-3.5`   |
| `mid-balanced` | `anthropic/claude-haiku-4-5`   |
| `premium-deep` | `anthropic/claude-opus-4.5`    |

### OpenAI

| Placeholder    | Model                          |
| -------------- | ------------------------------ |
| `cheap-fast`   | `openai/gpt-4o-mini`           |
| `mid-balanced` | `openai/gpt-5.1-codex`         |
| `premium-deep` | `openai/gpt-5.5`               |

### Google

| Placeholder    | Model                              |
| -------------- | ---------------------------------- |
| `cheap-fast`   | `google/gemini-2.0-flash`          |
| `mid-balanced` | `google/gemini-2.5-pro`            |
| `premium-deep` | `google/gemini-3.1-pro`            |

### OpenCode-Go (curated marketplace)

| Placeholder    | Model                                |
| -------------- | ------------------------------------ |
| `cheap-fast`   | `opencode-go/deepseek-v4-flash`      |
| `mid-balanced` | `opencode-go/qwen3.5-plus`           |
| `premium-deep` | `opencode-go/deepseek-v4-pro`        |

### GitHub Copilot

| Placeholder    | Model                                |
| -------------- | ------------------------------------ |
| `cheap-fast`   | `github-copilot/gpt-4.1-mini`        |
| `mid-balanced` | `github-copilot/claude-sonnet-4.5`   |
| `premium-deep` | `github-copilot/claude-opus-4.5`     |

## Applying

```bash
scripts/apply-profile-models.sh provider-agnostic
```

If your environment cannot resolve the placeholder strings as real models, edit the agent frontmatter files to substitute concrete model identifiers, or apply one of the included concrete profiles (`low`, `balanced`, `high`).

## Mixed Mappings

Mixing providers per tier is supported. For example: `cheap-fast` from one provider for cost, `premium-deep` from another for capability. Each agent's frontmatter holds its own `model:` value, so any combination is valid.
