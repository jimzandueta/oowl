# AI Development Workflow

This is the low-cost OpenCode profile with switchable model maps.

Runtime definitions live in:

```text
.opencode/
```

Model profiles live in:

```text
.opencode/model-profiles/
```

Apply a model profile from the profile root:

```bash
scripts/apply-profile-models.sh low
scripts/apply-profile-models.sh balanced
scripts/apply-profile-models.sh high
```

The model-profile script updates runtime agent frontmatter, `opencode.jsonc`, `.opencode/profile-models.json`, and `.opencode/prompts/shared/model-strategy.md`.

It does not update this file.

## Default Workflow

All substantial work follows:

```text
dispatcher
  -> architect
  -> user approves design.md and ui-spec.md when applicable
  -> planner
  -> plan-reviewer
  -> user approves implementation.md
  -> builder
      -> REQUEST_CONSULT or REQUEST_CONSULT_BATCH
  -> dispatcher dispatches assigned implementation agents
  -> builder receives implementation results
  -> reviewer
```

## Execution Model

The workflow uses one execution model.

```text
builder schedules
dispatcher dispatches
implementation agents execute
reviewer verifies
```

Only `dispatcher` may invoke the Task tool.

`builder` is scheduler-only. It must not invoke Task, call implementation agents, edit files, write files, run bash, or implement code.

`REQUEST_CONSULT_BATCH` is atomic. When `builder` returns a valid batch, `dispatcher` must issue all eligible Task calls in the same assistant message before waiting for results.

OpenCode built-in `general` and `explore` subagents are not used.

## Test-First Implementation Policy

The source of truth is `.opencode/prompts/shared/implementation-safety.md`.

New or changed behavior must be planned with test-first coverage or a specific no-test rationale. Low-tier agents must not be used to bypass TDD.

## Protected Artifacts

`docs/specs/**` contains workflow approval artifacts and is protected.

Protection means:

- owner agents may create or update their own artifacts
- non-owner agents may read artifacts
- non-owner agents must not edit, delete, overwrite, move, regenerate, or clean artifacts

| Artifact | Owner |
|---|---|
| `docs/specs/<feature>/design.md` | `architect` |
| `docs/specs/<feature>/ui-spec.md` | `designer` |
| `docs/specs/<feature>/implementation.md` | `planner` |
| `docs/specs/<feature>/review.md` | `reviewer` |

Implementation agents may read protected artifacts but must not modify them.

Targeted deletion may ask only for exact paths inside assigned file locks, never under `docs/**`, and only when the approved task requires it.

Broad deletion, root deletion, `git clean`, `find . -delete`, and docs deletion are denied.

If protected artifacts are missing after a task or batch, the workflow stops:

```text
PROTECTED_ARTIFACT_MISSING
Missing:
- <path>
Last task or batch: <summary>
Required action: restore from git or snapshot before continuing
```

Recommended recovery safeguard after implementation approval:

```bash
git add docs/specs
git commit -m "chore: preserve approved specs"
```

Alternative snapshot:

```bash
mkdir -p .opencode/snapshots/specs
cp -R docs/specs ".opencode/snapshots/specs/$(date +%Y%m%d-%H%M%S)"
```

## Superpowers Policy

Superpowers is used only by agents with methodology responsibilities.

| Agent group | Superpowers behavior |
|---|---|
| `architect` | uses `brainstorming` |
| `designer` | may use `brainstorming` for UI/UX exploration |
| `planner` | uses `writing-plans` |
| implementation specialists | use TDD/debugging/verification skills when relevant |
| `reviewer` and review agents | use review/verification discipline |
| `dispatcher` | does not load skills |
| `builder` | does not load skills |
| `plan-reviewer` | does not load skills |
| low-tier workers | do not load skills |

## Approval Gates

After design artifacts are created, `dispatcher` asks for user approval before planning.

After `implementation.md` is created and `plan-reviewer` returns `PLAN_APPROVED`, `dispatcher` asks for user approval before build.

Do not skip approval gates for non-trivial work.

## Manual Commands

Workflow commands:

```text
/design
/plan
/check-plan
/build
/review
```

Domain commands:

```text
/domain-designer
/domain-frontend-engineer
/domain-frontend-polisher
/domain-backend-engineer
/domain-database-engineer
/domain-cloud-architect
/domain-test-engineer
/domain-code-reviewer
/domain-security-reviewer
/domain-security-auditor
```

Low/high commands:

```text
/low-engineer
/low-task-worker
/low-architect
/low-designer
/high-engineer
/high-architect
/high-designer
```

## Caveman Policy

Caveman Lite may be used for runtime communication such as routing summaries, review findings, builder scheduling notes, and subagent completion summaries.

Do not compress human-reviewed artifacts, code blocks, commands, file paths, JSON/YAML, protocol blocks, approval questions, security warnings, or irreversible-action confirmations.

## Verification Policy

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
