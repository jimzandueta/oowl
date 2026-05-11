# Verification

Before reporting completion, provide evidence.

Prefer:

- focused tests
- typecheck
- lint
- build
- relevant integration checks
- `git diff`
- manual verification notes when automation is unavailable

Never say "done" unless verification was performed or unverified parts are explicitly listed.

## Protected Artifact Verification

After implementation work, verify protected artifacts still exist:

```text
docs/specs/**
```

At minimum, confirm the approved design and implementation artifacts still exist for the active feature.

If protected artifacts are missing, return:

```text
PROTECTED_ARTIFACT_MISSING
Missing:
- <path>
Last task or batch: <summary>
Required action: restore from git or snapshot before continuing
```
