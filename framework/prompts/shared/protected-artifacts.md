# Protected Artifacts

## Invariants

These rules are absolute. The frontmatter of every agent enforces them; this file is the single source of truth.

1. **Owner agents** may edit or update their own artifact. They must not delete it.
2. **Non-owner agents** must not edit, write, move, or delete any file under `docs/specs/**`.
3. **No agent** may delete any file under `docs/specs/**` or modify `AGENTS.md` under any circumstance.

## Artifact Ownership

| Artifact            | Owner       | Path                                     | Phase                |
| ------------------- | ----------- | ---------------------------------------- | -------------------- |
| Design spec         | `architect` | `docs/specs/<feature>/design.md`         | design               |
| UI spec             | `designer`  | `docs/specs/<feature>/ui-spec.md`        | design (when UI)     |
| Implementation spec | `planner`   | `docs/specs/<feature>/implementation.md` | planning             |
| Review report       | `reviewer`  | `docs/specs/<feature>/review.md`         | review               |

The design phase establishes a stable feature slug. All artifacts for one feature live under the same `docs/specs/<feature>/` directory.

## Owner Rule

Owner agents must create `docs/specs/<feature>/` if needed and write their artifact before returning completion. Owner agents must not summarize their artifact in chat instead of writing it.

## Implementation-Agent Rule

Implementation agents may read `docs/specs/**` for context. They must not edit, delete, overwrite, move, or regenerate any file under `docs/specs/**`.

## Stop Protocol

If protected artifacts are missing after an implementation task or batch, return `PROTECTED_ARTIFACT_MISSING`. The workflow must stop until they are restored.
