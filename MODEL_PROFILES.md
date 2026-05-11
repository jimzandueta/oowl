# Model Profiles

oowl ships three cost profiles. Each profile assigns every agent to a specific model.

## Available profiles

| Profile | Use case |
|---------|----------|
| `low` | Maximum cost savings — open models, cheap tiers everywhere |
| `balanced` | Mixed: cheap models for simple tasks, mid-tier for core work |
| `high` | Premium models for high-stakes or complex codebases |

## Switching profiles

The recommended way is the interactive wizard:

```bash
oowl profile
```

To apply a profile non-interactively (power users):

```bash
bash scripts/apply-profile-models.sh low
bash scripts/apply-profile-models.sh balanced
bash scripts/apply-profile-models.sh high
```

To apply a custom JSON profile:

```bash
cp framework/model-profiles/balanced.json framework/model-profiles/my-profile.json
# edit my-profile.json with your model assignments
bash scripts/apply-profile-models.sh framework/model-profiles/my-profile.json
```

## Profile files

```text
framework/model-profiles/low.json
framework/model-profiles/balanced.json
framework/model-profiles/high.json
framework/profile-models.json   ← active profile (updated by oowl profile)
```

## Agent tiers

Agents are grouped into three cost tiers. `oowl profile` maps each tier to a model:

| Tier | Agents |
|------|--------|
| `cheap-fast` | dispatcher, builder, low-engineer, low-task-worker |
| `mid-balanced` | architect, planner, plan-reviewer, reviewer, designer, frontend-engineer, frontend-polisher, backend-engineer, database-engineer, test-engineer, code-reviewer, security-reviewer, security-auditor, low-architect, low-designer |
| `premium-deep` | cloud-architect, high-engineer, high-architect, high-designer |
