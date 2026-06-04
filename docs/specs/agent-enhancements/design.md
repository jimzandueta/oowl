# Agent Enhancements Design

**Feature slug:** `agent-enhancements`
**Branch:** `feat/agent-enhancements`
**Owner:** architect

---

## 1. Executive Summary

This feature enhances all 23 oowl agents with curated, quality-vetted skills drawn from four verified sources plus the Superpowers built-in methodology layer. The `oowl` CLI bootstraps everything: `oowl install` deploys the framework and applies a model cost profile; `oowl init` runs per-project discovery to select and activate Optional skills, clones skill source repositories, and writes agent permissions. The work is structured into four phases — Phase 1A wires existing Superpowers skills, Phase 1B wires Required third-party skills (always-on), Phase 1C implements Optional skill selection and skill source installation via `oowl init`, and Phase 2 creates four custom guideline files registered via the `instructions` field in `opencode.jsonc`.

---

## 2. CLI Architecture

### 2.1 Command Reference

| Command | Purpose | When to run |
|---|---|---|
| `oowl install` | Install framework into `.opencode/` + apply model cost profile | Once per project |
| `oowl init` | Project discovery → Optional skill recommendation → approval → write permissions → clone skill repos → install CLI tools → prompt restart | After install; re-run when project scope changes |
| `oowl init --reset` | Clear all Optional skill selections and re-run questionnaire from scratch | When project direction changes fundamentally |
| `oowl init --list` | Display currently configured Optional skills from `.oowl.json` | Auditing |
| `oowl init --apply` | Re-write `opencode.jsonc` agent permissions from `.oowl.json` without re-running questionnaire | After manual `.oowl.json` edit |
| `oowl init --help` | Show usage | |

`oowl install` takes no flags. It handles framework setup and profile selection only. All skill source installation is `oowl init`'s responsibility.

### 2.2 Dependency Chain

```
oowl install
  → installs framework files (agents, commands, prompts, model-profiles)
  → applies model cost profile (low/balanced/high/custom)
  → registers built-in plugin entries (superpowers, caveman) in opencode.jsonc
  → writes .oowl.json install metadata
  → prints: "Run 'oowl init' to configure Optional skills for your project."

oowl init                     ← separate command; requires local install
  → checks .opencode/ exists
  → project discovery (describe or questions)
  → deterministic recommendation pass (40+ rules)
  → quality gate filter
  → approval UX
  → writes approved Optional skills to opencode.jsonc agent permissions
  → adds third-party plugin entries to installed opencode.jsonc
  → writes optionalSkills + projectAnswers to .oowl.json
  → clones 3 git repos into .opencode/plugins/ (git clone --depth 1)
  → npm install uipro-cli + uipro init --ai opencode
  → prompts user to restart OpenCode session
```

### 2.3 Scoping Rules

- `oowl init` is always local and project-scoped. There is no `oowl init global`.
- If `.opencode/` is not found in the current directory, `oowl init` exits with: `"No local install found. Run 'oowl install local' first."`
- Skills are project-specific by design. Global installs do not support `oowl init`.

---

## 3. Skill Sources

### 3.1 Source Catalog

| Source | Skills | Stars | Quality Gate | Install Method |
|---|---|---|---|---|
| Superpowers (obra/superpowers) | 10 | — | Trusted built-in | Plugin: `superpowers@git+...` |
| alirezarezvani/claude-skills | 23 | 16,800 | ✅ Stars + MIT + v2.9.0 May 2026 | Git clone: `git clone --depth 1` |
| gabelul/stitch-kit (Google Stitch) | 9 | 30 | ✅ Official provider (Google Stitch) | Git clone: `git clone --depth 1` |
| wondelai/skills | 5 | 1,200 | ✅ Stars + MIT | Git clone: `git clone --depth 1` |
| nextlevelbuilder/ui-ux-pro-max (uipro-cli) | 1 | 86,100 | ✅ Stars + MIT + npm clean | CLI: `npm install -g uipro-cli && uipro init --ai opencode` |
| **Total Optional** | **38** | | **All 38 passed** | |
| **Grand Total (+ 10 built-ins)** | **48** | | **48 / 48 passed** | |

### 3.2 Plugin-Based vs Git-Clone-Based Sources

**Built-in plugins** are registered as `"plugin"` array entries in the framework source `opencode.jsonc`. OpenCode handles cloning, caching, and updates automatically. The framework source contains only the two built-in methodology plugins:

```jsonc
// framework/opencode.jsonc — built-in plugin entries only
"plugin": [
  "superpowers@git+https://github.com/obra/superpowers.git",
  "caveman@git+https://github.com/julius.brussee/caveman.git"
]
```

**Third-party plugin entries** are written to the **installed** copy of `opencode.jsonc` by `oowl init` via the `addThirdPartyPlugins()` function. The framework source stays clean. When `oowl init` approves Optional skills from third-party sources, it adds these entries to the installed config:

```jsonc
// Installed .opencode/opencode.jsonc — third-party entries added by oowl init
"claude-skills@git+https://github.com/alirezarezvani/claude-skills.git",
"stitch-kit@git+https://github.com/gabelul/stitch-kit.git",
"wondelai-skills@git+https://github.com/wondelai/skills.git"
```

**Git-clone-based** sources (claude-skills, stitch-kit, wondelai-skills) are cloned non-interactively into `.opencode/plugins/` by `oowl init`:

```bash
# Implemented in runSkillSourceInstalls() — runs at user runtime during oowl init
git clone --depth 1 https://github.com/alirezarezvani/claude-skills.git ".opencode/plugins/claude-skills"
git clone --depth 1 https://github.com/gabelul/stitch-kit.git ".opencode/plugins/stitch-kit"
git clone --depth 1 https://github.com/wondelai/skills.git ".opencode/plugins/wondelai-skills"
```

**CLI-based** source (ui-ux-pro-max) is installed via npm:

```bash
npm install -g uipro-cli && uipro init --ai opencode
```

All install commands are non-interactive. No `npx skills add` or interactive prompts are used.

### 3.3 Quality Gate

All 38 Optional skills and all 4 sources have been verified against the quality gate. Every source passes.

**Gate criteria (all must pass):**
- Repository stars ≥ 1,000, OR skill is from an official provider (Google Stitch)
- Last commit ≤ 18 months
- Maintainer responded to at least one issue in the last 6 months
- No known supply chain issues (OSV / npm audit / GitHub Advisory)
- MIT, Apache 2.0, BSD, MPL-2.0, or equivalent permissive license

Full per-source verification results are in `skills-registry.json`.

---

## 4. Agent Skill Assignments

### 4.1 Required vs Optional Semantic

**Required skills** are always-on. They are hardcoded in `framework/prompts/shared/superpowers.md` during `oowl install`. Every project using that agent gets these skills unconditionally. They represent domain baselines so fundamental that no project context is needed.

**Optional skills** are project-specific. They are not in the framework source `superpowers.md`. `oowl init` selects them based on project discovery and writes approved skills to `opencode.jsonc` agent permissions (`agent.<name>.permission.skill`).

### 4.2 Per-Agent Skill Table

#### Architect

| Skill | Source | Activation |
|---|---|---|
| `brainstorming` | superpowers | Required |
| `senior-architect` | alirezarezvani/claude-skills | Optional |
| `design-everyday-things` | wondelai/skills | Optional |
| `hooked-ux` | wondelai/skills | Optional |
| `database-designer` | alirezarezvani/claude-skills | Optional |
| `stitch-ideate` | gabelul/stitch-kit | Optional |
| `stitch-orchestrator` | gabelul/stitch-kit | Optional |
| `ui-ux-pro-max` | nextlevelbuilder/uipro-cli | Optional |

> **Note:** Architecture principles from Clean Architecture, DDD, DDIA, and Pragmatic Programmer are provided via `framework/prompts/architecture-principles.md`, registered as an `instructions` entry in `opencode.jsonc`. This replaces the former agent-rules-books skill-based approach with a concise, always-in-context reference file.

#### Designer

| Skill | Source | Activation |
|---|---|---|
| `brainstorming` | superpowers | Optional |
| `verification-before-completion` | superpowers | Required |
| `ux-heuristics` | wondelai/skills | Required |
| `ui-ux-pro-max` | nextlevelbuilder/uipro-cli | Required |
| `apple-hig-expert` | alirezarezvani/claude-skills | Optional |
| `landing-page-generator` | alirezarezvani/claude-skills | Optional |
| `ios-hig-design` | wondelai/skills | Optional |
| `hooked-ux` | wondelai/skills | Optional |
| `stitch-design-system` | gabelul/stitch-kit | Optional |
| `stitch-react-components` | gabelul/stitch-kit | Optional |
| `stitch-shadcn-ui` | gabelul/stitch-kit | Optional |
| `stitch-swiftui-components` | gabelul/stitch-kit | Optional |
| `stitch-ideate` | gabelul/stitch-kit | Optional |
| `stitch-orchestrator` | gabelul/stitch-kit | Optional |
| `microinteractions` | wondelai/skills | Optional |
| `design-everyday-things` | wondelai/skills | Optional |
| `stitch-a11y` | gabelul/stitch-kit | Optional |
| `stitch-animate` | gabelul/stitch-kit | Optional |

#### Planner

| Skill | Source | Activation |
|---|---|---|
| `writing-plans` | superpowers | Required |
| `codebase-onboarding` | alirezarezvani/claude-skills | Optional |
| `runbook-generator` | alirezarezvani/claude-skills | Optional |

#### Frontend-Engineer

| Skill | Source | Activation |
|---|---|---|
| `test-driven-development` | superpowers | Required |
| `verification-before-completion` | superpowers | Required |
| `systematic-debugging` | superpowers | Optional |
| `receiving-code-review` | superpowers | Optional |
| `requesting-code-review` | superpowers | Optional |
| `stitch-react-components` | gabelul/stitch-kit | Optional |
| `stitch-shadcn-ui` | gabelul/stitch-kit | Optional |
| `stitch-react-native-components` | gabelul/stitch-kit | Optional |
| `stitch-swiftui-components` | gabelul/stitch-kit | Optional |
| `playwright-pro` | alirezarezvani/claude-skills | Optional |

#### Frontend-Polisher

| Skill | Source | Activation |
|---|---|---|
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |
| `microinteractions` | wondelai/skills | Optional |
| `stitch-a11y` | gabelul/stitch-kit | Optional |
| `stitch-animate` | gabelul/stitch-kit | Optional |
| `ui-ux-pro-max` | nextlevelbuilder/uipro-cli | Optional |

#### Backend-Engineer

| Skill | Source | Activation |
|---|---|---|
| `test-driven-development` | superpowers | Required |
| `verification-before-completion` | superpowers | Required |
| `systematic-debugging` | superpowers | Optional |
| `receiving-code-review` | superpowers | Optional |
| `requesting-code-review` | superpowers | Optional |
| `api-design-reviewer` | alirezarezvani/claude-skills | Optional |
| `api-test-suite-builder` | alirezarezvani/claude-skills | Optional |
| `dependency-auditor` | alirezarezvani/claude-skills | Optional |
| `performance-profiler` | alirezarezvani/claude-skills | Optional |

#### Database-Engineer

| Skill | Source | Activation |
|---|---|---|
| `test-driven-development` | superpowers | Required |
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |
| `database-designer` | alirezarezvani/claude-skills | Required |
| `database-schema-designer` | alirezarezvani/claude-skills | Required |
| `migration-architect` | alirezarezvani/claude-skills | Required |

#### Cloud-Architect

| Skill | Source | Activation |
|---|---|---|
| `verification-before-completion` | superpowers | Required |
| `systematic-debugging` | superpowers | Optional |
| `receiving-code-review` | superpowers | Optional |
| `aws-solution-architect` | alirezarezvani/claude-skills | Optional |
| `observability-designer` | alirezarezvani/claude-skills | Optional |
| `incident-commander` | alirezarezvani/claude-skills | Optional |
| `cicd-pipeline-builder` | alirezarezvani/claude-skills | Optional |
| `release-manager` | alirezarezvani/claude-skills | Optional |

#### Test-Engineer

| Skill | Source | Activation |
|---|---|---|
| `test-driven-development` | superpowers | Required |
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |
| `playwright-pro` | alirezarezvani/claude-skills | Optional |
| `api-test-suite-builder` | alirezarezvani/claude-skills | Optional |

#### Code-Reviewer

| Skill | Source | Activation |
|---|---|---|
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |
| `pr-review-expert` | alirezarezvani/claude-skills | Required |
| `dependency-auditor` | alirezarezvani/claude-skills | Required |
| `api-design-reviewer` | alirezarezvani/claude-skills | Optional |
| `tech-debt-tracker` | alirezarezvani/claude-skills | Optional |

#### Security-Reviewer

| Skill | Source | Activation |
|---|---|---|
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |

Security-reviewer has no Optional skills from the third-party registry. The Trail of Bits security skill catalog was evaluated but not included — it was a meta-catalog without actual installable skill files. Adding dedicated security Optional skills is a future enhancement.

#### Security-Auditor

| Skill | Source | Activation |
|---|---|---|
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |
| `skill-security-auditor` | alirezarezvani/claude-skills | Optional |

Security-auditor has one Optional skill from the registry (`skill-security-auditor`). The Trail of Bits security skill catalog was evaluated but not included for the same reason as security-reviewer. Expanding the security-auditor's Optional skill set is a future enhancement.

#### Reviewer

| Skill | Source | Activation |
|---|---|---|
| `verification-before-completion` | superpowers | Required |
| `finishing-a-development-branch` | superpowers | Optional |
| `receiving-code-review` | superpowers | Optional |
| `pr-review-expert` | alirezarezvani/claude-skills | Required |
| `release-manager` | alirezarezvani/claude-skills | Optional |
| `changelog-generator` | alirezarezvani/claude-skills | Optional |

#### High-Engineer

| Skill | Source | Activation |
|---|---|---|
| `test-driven-development` | superpowers | Required |
| `systematic-debugging` | superpowers | Optional |
| `receiving-code-review` | superpowers | Optional |
| `requesting-code-review` | superpowers | Optional |
| `executing-plans` | superpowers | Optional |
| `performance-profiler` | alirezarezvani/claude-skills | Optional |
| `incident-commander` | alirezarezvani/claude-skills | Optional |
| `tech-debt-tracker` | alirezarezvani/claude-skills | Optional |
| `monorepo-navigator` | alirezarezvani/claude-skills | Optional |

#### High-Architect

| Skill | Source | Activation |
|---|---|---|
| `brainstorming` | superpowers | Optional |
| `systematic-debugging` | superpowers | Optional |
| `receiving-code-review` | superpowers | Optional |
| `senior-architect` | alirezarezvani/claude-skills | Optional |
| `aws-solution-architect` | alirezarezvani/claude-skills | Optional |
| `incident-commander` | alirezarezvani/claude-skills | Optional |
| `observability-designer` | alirezarezvani/claude-skills | Optional |

> **Note:** Architecture principles from Clean Architecture, DDD, DDIA, and Pragmatic Programmer are provided via `framework/prompts/architecture-principles.md`, registered as an `instructions` entry in `opencode.jsonc`. This replaces the former agent-rules-books skill-based approach with a concise, always-in-context reference file.

#### High-Designer

| Skill | Source | Activation |
|---|---|---|
| `brainstorming` | superpowers | Optional |
| `verification-before-completion` | superpowers | Required |
| `receiving-code-review` | superpowers | Optional |
| `ui-ux-pro-max` | nextlevelbuilder/uipro-cli | Required |
| `ux-heuristics` | wondelai/skills | Required |
| `ios-hig-design` | wondelai/skills | Optional |
| `apple-hig-expert` | alirezarezvani/claude-skills | Optional |
| `landing-page-generator` | alirezarezvani/claude-skills | Optional |
| `stitch-design-system` | gabelul/stitch-kit | Optional |

#### Low-Tier Agents (low-engineer, low-task-worker, low-architect, low-designer)

No skills loaded. Per Superpowers policy, low-tier agents do not load skills. The dispatcher routing guard prevents these agents from receiving tasks requiring skill-based reasoning.

#### Non-skill Agents (dispatcher, builder, plan-reviewer)

No skills loaded per Superpowers policy.

---

## 5. Skill Activation Mechanism

### 5.1 Two-Layer Architecture

| Layer | File | Controls |
|---|---|---|
| Required skills (always-on) | `framework/prompts/shared/superpowers.md` | Unconditional "load on startup" semantic |
| Optional skills (project-specific) | `.opencode/opencode.jsonc` | `agent.<name>.permission.skill` access control |
| Approval record | `.oowl.json` | Source of truth for re-runs; `optionalSkills` + `projectAnswers` |

### 5.2 superpowers.md (Required Skills)

Required skills are hardcoded in the framework source `superpowers.md`. They load unconditionally for the assigned agent on every task. `oowl init` does not modify `superpowers.md`.

### 5.3 opencode.jsonc Agent Permissions (Optional Skills)

`oowl init` writes approved Optional skills to the **installed** `opencode.jsonc` under `agent.<name>.permission.skill`:

```jsonc
"agent": {
  "designer": {
    "permission": {
      "skill": {
        "ui-ux-pro-max": "allow",
        "ux-heuristics": "allow"
      }
    }
  },
  "high-designer": {
    "permission": {
      "skill": {
        "ui-ux-pro-max": "allow",
        "ux-heuristics": "allow"
      }
    }
  },
  "architect": {
    "permission": {
      "skill": {
        "ui-ux-pro-max": "allow"
      }
    }
  },
  "database-engineer": {
    "permission": {
      "skill": {
        "database-designer": "allow",
        "database-schema-designer": "allow",
        "migration-architect": "allow"
      }
    }
  },
  "code-reviewer": {
    "permission": {
      "skill": {
        "pr-review-expert": "allow",
        "dependency-auditor": "allow"
      }
    }
  },
  "reviewer": {
    "permission": {
      "skill": {
        "pr-review-expert": "allow"
      }
    }
  }
}
```

The framework source `opencode.jsonc` contains these Required skill permission blocks. `oowl init` merges additional Optional skill entries into the installed copy. The write is idempotent: re-running `oowl init` replaces the existing permission block for each agent.

### 5.4 JSONC Parser

The `opencode-config-writer.ts` module uses a character-by-character JSONC parser (`cleanJsonc()`) that tracks `inString` state. This ensures `//` inside JSON string values (such as URLs like `https://github.com/...`) is never mistaken for a line comment. The parser handles:

- Escape sequences inside strings (`\"`, `\\`)
- Line comments (`//`) only outside strings
- Block comments (`/* */`) only outside strings
- Trailing comma removal before `}` or `]`

### 5.5 Full oowl init Flow

The complete `oowl init` flow — hybrid discovery, keyword-based parsing, 5-question path, `ProjectAnswers` schema, recommendation rules (40+ rules), quality gate enforcement, approval UX, `.oowl.json` persistence, skill source cloning, and restart prompt — is implemented in `src/commands/init.ts` and documented in `skill-activation.md`.

---

## 6. Implementation Phases

### Phase 1A: Wire Existing Superpowers Skills

Targets: framework files only. No external dependencies.

| Task | File | Change |
|---|---|---|
| 1A.1 | `framework/prompts/shared/superpowers.md` | Add `verification-before-completion: Required` to `frontend-engineer`, `backend-engineer`, `database-engineer`, `designer`, `high-designer` |
| 1A.2 | `framework/prompts/shared/superpowers.md` | Add Optional skills: `requesting-code-review` → frontend/backend/high-engineer; `receiving-code-review` → all implementation agents; `executing-plans` → high-engineer; `finishing-a-development-branch` → reviewer |
| 1A.3 | `framework/agents/04-review/security-auditor.md` | Change blanket `write: deny` to granular: allow `docs/specs/**/security-audit.md`, deny all else. Same for `edit`. |
| 1A.4 | `framework/prompts/shared/protocols.md` | Replace `PLAN_REJECTED` with enhanced `PLAN_REJECTION` protocol including `rejection_reason`, `specific_issues[]`, and `suggested_changes[]` structured fields |
| 1A.5 | `framework/agents/01-orchestration/dispatcher.md` | Add Low-Tier Routing Guard section: `low-*` agents must never receive security decisions, DB schema changes, architecture decisions, 5+ file tasks, or costly-to-reverse tasks |

**Already completed:** Removal of the `docs/specs/**` blanket deny from dispatcher permissions (required for child agents to inherit edit/write tools).

### Phase 1B: Wire Required Third-Party Skills

Targets: `superpowers.md` Required rows, `opencode.jsonc` Required skill permissions.

| Task | File | Change |
|---|---|---|
| 1B.1 | `framework/opencode.jsonc` | Verify built-in plugin entries: `superpowers` + `caveman` only. Third-party plugin entries are NOT in the framework source — they are added to the installed copy by `oowl init`. |
| 1B.2 | `src/commands/install.ts` | Framework setup + profile selection only. No skill source installs. `oowl install` handles location choice, framework copy, profile application, and prints prompt to run `oowl init`. |
| 1B.3 | `framework/opencode.jsonc` | Add Required skill permission entries for agents with always-on third-party skills: `designer`, `high-designer`, `architect`, `database-engineer`, `code-reviewer`, `reviewer` |
| 1B.4 | `framework/prompts/shared/superpowers.md` | Add Required skill rows for: `ui-ux-pro-max`, `ux-heuristics` (designer, high-designer); `database-designer`, `database-schema-designer`, `migration-architect` (database-engineer); `pr-review-expert`, `dependency-auditor` (code-reviewer); `pr-review-expert` (reviewer) |

### Phase 1C: Optional Skills via oowl init

Targets: `src/commands/init.ts` (new), `src/lib/skill-recommender.ts` (new), `src/lib/opencode-config-writer.ts` (new), `framework/skills-registry.json`.

| Task | File | Change |
|---|---|---|
| 1C.1 | `src/commands/init.ts` | Implement `oowl init` command: prerequisite check, hybrid discovery (describe/questions), recommendation pass, approval UX, `.oowl.json` write, `opencode.jsonc` permission write, third-party plugin injection, skill source cloning, npm install uipro-cli, restart prompt |
| 1C.2 | `src/lib/skill-recommender.ts` | Implement `recommend(answers)` function (40+ rules), `filterByQualityGate()`, `loadSkillsRegistry()`, `getQualityGatedSkills()`. Registry-driven — reads skill IDs from `skills-registry.json`, not hardcoded. |
| 1C.3 | `src/lib/opencode-config-writer.ts` | Implement `writeAgentPermissions()` — idempotent write of `agent.<name>.permission.skill` blocks to installed `opencode.jsonc`. Implement `addThirdPartyPlugins()` — adds third-party plugin entries to installed copy. Character-by-character JSONC parser (`cleanJsonc()`) that preserves URLs. |
| 1C.4 | `framework/skills-registry.json` | Create registry with all 38 Optional skills. Each entry has `id`, `name`, `source`, `sourceUrl`, `stars`, `category`, `qualityGate`, `assignedAgents`, `activation`. |
| 1C.5 | `src/index.ts` | Register `init` command separate from `install` |
| 1C.6 | `tests/commands/init.test.ts`, `tests/lib/skill-recommender.test.ts` | Tests for recommend(), filterByQualityGate(), writeAgentPermissions() idempotency, addThirdPartyPlugins(), cleanJsonc(), full init wizard flow |

### Phase 2: Custom Guidelines

Targets: four new plain markdown files + `opencode.jsonc` `instructions` entries.

| Task | File | Change |
|---|---|---|
| 2.1 | `framework/prompts/dispatcher-routing.md` | Structured routing decision guide — makes low-tier guard concrete as a checklist; includes explicit criteria for routing decisions |
| 2.2 | `framework/prompts/plan-completeness.md` | Checklist for `implementation.md` completeness — required fields, test-first steps, file locks, rollback strategies |
| 2.3 | `framework/prompts/security-review-checklist.md` | OWASP Top 10 adapted to oowl CLI context — scoped to CLI framework running AI agents |
| 2.4 | `framework/prompts/architecture-principles.md` | Concise ~4.5KB file with ~30 distilled rules from Clean Architecture, DDD, DDIA, and Pragmatic Programmer — replaces the former agent-rules-books skill-based approach |
| 2.5 | `framework/opencode.jsonc` | Add `"instructions"` array with all four guideline file paths |

Phase 2 files use the `instructions` field in `opencode.jsonc` — plain markdown, no SKILL.md format, no frontmatter.json, no skill tool invocation. OpenCode auto-includes them in every agent's context.

---

## 7. opencode.jsonc Changes

### Plugin Array (Framework Source)

The framework source `opencode.jsonc` contains only built-in methodology plugins:

```jsonc
"plugin": [
  "superpowers@git+https://github.com/obra/superpowers.git",
  "caveman@git+https://github.com/julius.brussee/caveman.git"
]
```

### Plugin Array (Installed Copy — After oowl init)

`oowl init` adds third-party plugin entries to the installed copy via `addThirdPartyPlugins()`:

```jsonc
"plugin": [
  "superpowers@git+https://github.com/obra/superpowers.git",
  "caveman@git+https://github.com/julius.brussee/caveman.git",
  "claude-skills@git+https://github.com/alirezarezvani/claude-skills.git",
  "stitch-kit@git+https://github.com/gabelul/stitch-kit.git",
  "wondelai-skills@git+https://github.com/wondelai/skills.git"
]
```

### Per-Agent Skill Permissions (Framework Source — Required Skills)

```jsonc
"agent": {
  "designer": {
    "permission": {
      "skill": {
        "ui-ux-pro-max": "allow",
        "ux-heuristics": "allow"
      }
    }
  },
  "high-designer": {
    "permission": {
      "skill": {
        "ui-ux-pro-max": "allow",
        "ux-heuristics": "allow"
      }
    }
  },
  "architect": {
    "permission": {
      "skill": {
        "ui-ux-pro-max": "allow"
      }
    }
  },
  "database-engineer": {
    "permission": {
      "skill": {
        "database-designer": "allow",
        "database-schema-designer": "allow",
        "migration-architect": "allow"
      }
    }
  },
  "code-reviewer": {
    "permission": {
      "skill": {
        "pr-review-expert": "allow",
        "dependency-auditor": "allow"
      }
    }
  },
  "reviewer": {
    "permission": {
      "skill": {
        "pr-review-expert": "allow"
      }
    }
  }
}
```

### Per-Agent Skill Permissions (Installed Copy — After oowl init)

`oowl init` merges approved Optional skills into the installed `opencode.jsonc`. The entries above are the framework baseline; `oowl init` adds project-specific Optional skills on top.

### Instructions Array (Phase 2)

```jsonc
"instructions": [
  "prompts/dispatcher-routing.md",
  "prompts/plan-completeness.md",
  "prompts/security-review-checklist.md",
  "prompts/architecture-principles.md"
]
```

---

## 8. Model Profiles

Three cost profiles map each of the 23 agents to specific `opencode-go/*` models:

| Profile | Global model | Use case |
|---|---|---|
| `low` | Cost-optimized models | Quick tasks, read-only checks, trivial edits |
| `balanced` | Mixed tiering | Daily fullstack work — stronger models for planning, review, database, cloud |
| `high` | Premium models | Deep architecture, security, escalation |

Each profile assigns models per agent. For example, the `balanced` profile:

| Agent | Model | Rationale |
|---|---|---|
| `dispatcher` | `opencode-go/deepseek-v4-flash` | Cheap routing and approval gates |
| `architect` | `opencode-go/minimax-m3` | Design and architecture tradeoffs |
| `planner` | `opencode-go/minimax-m3` | Implementation planning |
| `plan-reviewer` | `opencode-go/kimi-k2.6` | Strict plan validation |
| `builder` | `opencode-go/deepseek-v4-flash` | Scheduler-only coordination |
| `reviewer` | `opencode-go/kimi-k2.6` | Review coordination |
| `database-engineer` | `opencode-go/glm-5` | Schema and data integrity |
| `cloud-architect` | `opencode-go/glm-5` | Cloud, IaC, reliability |
| `security-reviewer` | `opencode-go/glm-5.1` | First-pass security review |
| `security-auditor` | `opencode-go/deepseek-v4-pro` | Deep security audit |
| `high-engineer` | `opencode-go/deepseek-v4-pro` | Premium coding escalation |
| `high-architect` | `opencode-go/qwen3.7-max` | Premium architecture escalation |
| `high-designer` | `opencode-go/qwen3.7-max` | Premium design escalation |

A `custom` profile is also supported for users without an OpenCode Go subscription, built from their connected models.

---

## 9. Risk Assessment

### Phase 1A

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Adding `verification-before-completion` to designer slows simple UI specs | Low | Low | Verification is lightweight; Optional `brainstorming` covers complex cases |
| `PLAN_REJECTION` rename breaks existing callers | Medium | Medium | Keep `PLAN_REJECTED` as alias during transition period |
| security-auditor write permission too broad | Low | Medium | Exact path pattern `docs/specs/**/security-audit.md` — not `docs/**` |
| Low-tier routing guard is guidance-only | Medium | High | Named section in dispatcher.md with explicit enumerated criteria — not a doc reference |

### Phase 1B

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Plugin entry corrupts opencode.jsonc | Low | High | Character-by-character JSONC parser preserves URLs; validate schema before writing |
| Skill version drift | Medium | Low | Git clone pins to HEAD at clone time; re-run `oowl init` to refresh |

### Phase 1C

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `oowl init` writes invalid JSON to opencode.jsonc | Medium | High | `cleanJsonc()` parser handles URLs correctly; validate schema before writing; backup opencode.jsonc before first write |
| 38 Optional skills overwhelms agent context | Low | Medium | `oowl init` filters to project-relevant skills only; quality gate limits pool |
| `agent.*.permission.skill` schema changes | Low | Medium | Pin opencode version; document schema version |
| `stitch-kit` requires Google Stitch MCP access | Low | Medium | Verify Stitch MCP credentials before recommending |
| `oowl init` in non-interactive CI environment | Low | Low | Detect non-TTY; write `optionalSkills: {}` and exit cleanly |
| Git clone fails due to network | Low | Low | Each clone is independent; already-cloned repos are skipped on re-run |

### Phase 2

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Guideline content drifts from framework behavior | Low | Low | Guideline files are co-located with framework prompts; review alongside agent updates |

### Security Skill Gap

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| security-reviewer and security-auditor lack Optional third-party security skills | Medium | Medium | Both agents retain Superpowers `verification-before-completion` Required skill. `skill-security-auditor` from claude-skills is available for security-auditor. Expanding the security skill catalog with vetted sources is a future enhancement. |

---

## 10. File Manifest

### Already Completed

| File | Change |
|---|---|
| `framework/agents/01-orchestration/dispatcher.md` | `docs/specs/**` blanket deny removed |

### Phase 1A — Modify

| File | Change |
|---|---|
| `framework/prompts/shared/superpowers.md` | Add 5 Required + 4 Optional skill entries |
| `framework/prompts/shared/protocols.md` | Replace `PLAN_REJECTED` with enhanced `PLAN_REJECTION` |
| `framework/agents/01-orchestration/dispatcher.md` | Add Low-Tier Routing Guard section |
| `framework/agents/04-review/security-auditor.md` | Granular write/edit permission for `docs/specs/**/security-audit.md` |

### Phase 1B — Modify

| File | Change |
|---|---|
| `framework/opencode.jsonc` | Verify built-in plugin entries (superpowers + caveman); add Required skill permission blocks for 6 agents |
| `framework/prompts/shared/superpowers.md` | Add Required skill rows for designer, high-designer, database-engineer, code-reviewer, reviewer |
| `src/commands/install.ts` | Framework setup + profile selection only (no skill source installs) |

### Phase 1C — Create

| File | Purpose |
|---|---|
| `src/commands/init.ts` | `oowl init` command — full pipeline including skill source installation |
| `src/lib/skill-recommender.ts` | Recommendation engine + quality gate (registry driven) |
| `src/lib/opencode-config-writer.ts` | `opencode.jsonc` agent permissions writer + third-party plugin injector + JSONC parser |
| `framework/skills-registry.json` | Optional skill registry (38 entries) |
| `tests/commands/init.test.ts` | Tests for init wizard |
| `tests/lib/skill-recommender.test.ts` | Tests for recommendation engine |

### Phase 1C — Modify

| File | Change |
|---|---|
| `src/lib/installer.ts` | Extend `.oowl.json` schema with `optionalSkills` + `projectAnswers` |
| `src/index.ts` | Register `init` command |

### Phase 2 — Create

| File | Purpose |
|---|---|
| `framework/prompts/dispatcher-routing.md` | Routing decision guide |
| `framework/prompts/plan-completeness.md` | Implementation plan completeness checklist |
| `framework/prompts/security-review-checklist.md` | OWASP Top 10 adapted to oowl context |
| `framework/prompts/architecture-principles.md` | Distilled architecture rules from Clean Architecture, DDD, DDIA, Pragmatic Programmer |

### Phase 2 — Modify

| File | Change |
|---|---|
| `framework/opencode.jsonc` | Add `"instructions"` array with 4 entries |

---

## 11. Summary Metrics

| Metric | Value |
|---|---|
| Skill sources | 4 (plus Superpowers built-in) |
| Optional skills in registry | 38 |
| Superpowers built-in skills | 10 |
| Total skills | 48 |
| Agent blocks in framework opencode.jsonc | 6 |
| Plugin entries in framework source | 2 (superpowers, caveman) |
| Plugin entries in installed copy (after init) | 5 (2 built-in + 3 third-party) |
| Instructions entries | 4 (dispatcher-routing, plan-completeness, security-review-checklist, architecture-principles) |
| Model profiles | 3 (low, balanced, high) + custom |
| Agents with model assignments | 23 |
| Test cases | 83 |
| TypeScript compilation | Clean (`npx tsc --noEmit`) |

---

## 12. Companion Documents

| Document | Focus |
|---|---|
| **design.md** (this file) | Architecture, phases, agent assignments, opencode.jsonc changes, risk |
| **skill-activation.md** | Complete `oowl init` flow: hybrid discovery, recommendation rules, approval UX, persistence |
| **implementation.md** | Task-by-task implementation plan with verification steps |
