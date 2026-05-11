<!-- markdownlint-disable MD033 MD041 -->
<h1 align="center">oowl</h1>

<p align="center">
  <strong>OpenCode Opinionated Workflow Layer.</strong><br />
  Cheap models. Real process. Production-grade output.
</p>

<p align="center">
  <a href="https://github.com/jimzandueta/oowl/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/jimzandueta/oowl/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/@jimzandueta/oowl"><img alt="npm" src="https://img.shields.io/npm/v/@jimzandueta/oowl?label=npm" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <img alt="Runtime: OpenCode" src="https://img.shields.io/badge/runtime-OpenCode-blue" />
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> &middot;
  <a href="#how-it-works">How it works</a> &middot;
  <a href="#model-profiles">Model profiles</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#things-that-trip-people-up">Common issues</a> &middot;
  <a href="https://jimzandueta.github.io/oowl">Docs</a>
</p>

---

oowl installs a structured multi-agent workflow on top of [OpenCode](https://opencode.ai/). Instead of one agent doing everything, it routes work through named roles: dispatcher, architect, planner, implementers, reviewer. Two user approval gates before any code is written.

---

## Quick start

**Prerequisites:** [OpenCode](https://opencode.ai/) installed, Node.js 18+.

```bash
npx @jimzandueta/oowl init
```

The wizard asks where to install (local project or global), whether you have an OpenCode Go subscription, and which models to use. Then open OpenCode in your project and talk to `dispatcher`.

- **Substantial request** (new feature, refactor, anything touching auth or data) → design → your approval → plan → your approval → implementation → review.
- **Trivial fix** (under ~20 lines, under 3 files, nothing sensitive) → one implementer, done.

### The three commands

```bash
npx @jimzandueta/oowl init      # first-time setup wizard
npx @jimzandueta/oowl profile   # switch model profiles
npx @jimzandueta/oowl update    # update framework files with conflict detection
```

---

## What you get

- **23 role-specific agents** across orchestration, design, implementation, review, escalation, and low-tier bounded work
- **23 slash commands** for workflow phases and domain specialists
- **Two user approval gates** before substantial implementation begins
- **Workflow-level file locks** on every implementation task, with parallel collision checks
- **Protected design artifacts**: `design.md`, `implementation.md`, `review.md` under `docs/specs/`
- **Mandatory verification evidence** before any agent can return `TASK_COMPLETE`
- **Sensitive-area safeguards** for auth, IAM, payments, PII, secrets, and production config
- **Switchable model profiles**: `low`, `balanced`, `high`, and `custom` (built from your connected models)
- **Superpowers methodology** for design, planning, TDD, debugging, and review
- **Caveman-Lite** for terse, token-efficient agent handoffs

---

## How it works

### The fast version

```text
your request → dispatcher
  trivial?  → one implementer → done
  substantial?
    → architect writes design.md
    → [you approve]
    → planner writes implementation.md
    → plan-reviewer validates it
    → [you approve]
    → builder schedules implementation waves
    → dispatcher runs assigned agents, each with file locks + verification
    → reviewer writes review.md
    → done
```

### Why this instead of one big agent

| One mega-agent | oowl |
| --- | --- |
| Edits unrelated files | File locks constrain every task |
| Design lives in chat history | Design, plan, review live in `docs/specs/<feature>/` |
| "Looks done" is enough | Verification evidence required |
| Model choice is manual | Profiles assign cheap/mid/premium by role |
| Security review if remembered | Sensitive areas trigger approval + escalation |
| Agent handoffs are verbose | Caveman-Lite keeps runtime summaries concise |

Full workflow detail → [docs/how-it-works.md](docs/how-it-works.md)

---

## Model profiles

Agents are grouped into three cost tiers:

| Tier | Use for | Agents |
| --- | --- | --- |
| Cheap/fast | Routing, scheduling, bounded tasks | `dispatcher`, `builder`, `low-engineer`, `low-task-worker`, `low-architect`, `low-designer` |
| Mid/balanced | Design, planning, implementation, review | `architect`, `planner`, specialists, reviewers |
| Premium/deep | Escalations, hard problems, deep security | `high-*`, `security-auditor` |

### Bundled profiles (OpenCode Go)

| Profile | Purpose |
| --- | --- |
| `low` | Cost-first for long sessions and routine work |
| `balanced` | Daily fullstack. Stronger models where quality pays. |
| `high` | Quality-first for higher-stakes sessions |

No OpenCode Go? `oowl init` and `oowl profile → custom` scan your connected models and let you assign them to tiers manually.

Switch anytime:

```bash
oowl profile
```

Full profile details → [MODEL_PROFILES.md](MODEL_PROFILES.md)

---

## Install

All three commands are interactive. No flags needed.

### `oowl init`

Prompts for install location (local `.opencode/` or global `~/.config/opencode/`), model setup, and conflict handling on existing files. Local installs also write `opencode.jsonc` and `AGENTS.md` to your project root.

### `oowl profile`

Switches the active model profile. Updates agent frontmatter, `opencode.jsonc` global settings, and saves the active profile.

### `oowl update`

Updates framework files to the latest package version. Files you haven't modified update silently. Modified files show a unified diff and let you keep yours or accept the update.

### Global install

```bash
npm install -g @jimzandueta/oowl
oowl init
```

### Uninstall

```bash
# local
rm -rf .opencode opencode.jsonc AGENTS.md .oowl.json

# global
rm -rf ~/.config/opencode ~/.oowl.json
```

---

## Things that trip people up

**Agents aren't showing up in OpenCode**
OpenCode must be launched from the directory that contains `opencode.jsonc`. For a local install, that's your project root.

**`oowl` not found after `npm install -g`**
Your global npm bin directory may not be on `PATH`. Run `npm bin -g` to find it, or keep using `npx @jimzandueta/oowl`.

**Wrong model after switching profiles**
Use `oowl profile`: it updates agent frontmatter, `opencode.jsonc`, and `profile-models.json` as one operation. The legacy shell script doesn't update `opencode.jsonc` unless you pass the project root as a second argument.

**Fewer than 3 models found during init**
oowl needs at least one model per tier. Connect more providers in OpenCode settings, then run `oowl init` again, or choose "enter manually" to type model IDs directly.

**`oowl update` shows everything as modified**
`.oowl.json` is missing or predates checksum tracking. Run `oowl init` (choose "skip existing files") to regenerate it. Future updates will detect changes correctly.

**Protected artifact disappeared mid-workflow**
Restore from Git:
```bash
git checkout -- docs/specs/<feature>/design.md
```
Commit approved specs before implementation starts so they're recoverable.

**Caveman-Lite not activating**
The Caveman plugin is loaded via `opencode.jsonc`. Make sure OpenCode is running from the correct directory so it picks up the config.

**Workflow feels like too much ceremony**
Tell `dispatcher` explicitly: "this is a trivial fix, skip the design phase." Or adjust the routing thresholds in `framework/prompts/shared/routing.md`.

---

## Plugins loaded

oowl's `opencode.jsonc` loads two plugins automatically:

- [obra/superpowers](https://github.com/obra/superpowers): methodology layer (TDD, brainstorming, writing plans, debugging, review)
- [juliusbrussee/caveman](https://github.com/juliusbrussee/caveman): Caveman-Lite for terse agent handoffs

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the verification matrix, coding conventions, and PR process.

```bash
npm test
node bin/oowl.js --help
npm pack --dry-run
```

Core invariants to preserve: dispatcher owns dispatch, builder schedules only, protected artifacts are owner-controlled, implementation tasks require file locks, verification evidence is required before completion.

---

## License

MIT. See [LICENSE](LICENSE).

---

## Acknowledgments

- [OpenCode](https://opencode.ai/): the runtime this framework builds on
- [obra/superpowers](https://github.com/obra/superpowers): methodology layer
- [juliusbrussee/caveman](https://github.com/juliusbrussee/caveman): Caveman-Lite communication pattern
