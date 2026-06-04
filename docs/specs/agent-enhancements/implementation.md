# Agent Enhancements Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four-phase agent framework enhancements — wire existing Superpowers skills (Phase 1A), wire Required third-party skills (Phase 1B), implement `oowl init` with Optional skill selection and skill source installation (Phase 1C), and create custom guidelines via OpenCode's instructions field (Phase 2).

**Architecture:** Phase 1A modifies framework source files in-place. Phase 1B adds Required skill entries to `superpowers.md` and `opencode.jsonc` agent permission blocks; the framework source `opencode.jsonc` contains only built-in plugins (superpowers + caveman). Phase 1C implements `oowl init` which writes approved Optional skills to the installed `opencode.jsonc` `agent.*.permission.skill`, clones skill source repos into `.opencode/plugins/`, and installs CLI tools. Phase 2 creates plain markdown guidelines and registers them via `opencode.jsonc` `instructions` field.

**Tech Stack:** oowl framework (markdown agent definitions), `framework/prompts/shared/superpowers.md` (skill table), `framework/prompts/shared/protocols.md` (protocols), `framework/agents/` (agent definitions), `framework/opencode.jsonc` (plugin, instructions, agent permissions), `src/commands/init.ts` (oowl init CLI command), `src/lib/skill-recommender.ts` (recommendation engine), `src/lib/opencode-config-writer.ts` (JSONC writer with character-by-character parser).

---

## Phase 1A: Wire Existing Superpowers Skills

### Task 1A-1: superpowers.md — Add verification-before-completion Required to 5 agents

**Wave:** 1
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none)

**Files:**
- Modify: `framework/prompts/shared/superpowers.md`

**Change:** Append the following rows to the skill assignment table (after the existing `| security-auditor | verification-before-completion | Required |` row):

```markdown
| `frontend-engineer` | `verification-before-completion` | Required |
| `backend-engineer`  | `verification-before-completion` | Required |
| `database-engineer` | `verification-before-completion` | Required |
| `designer`          | `verification-before-completion` | Required |
| `high-designer`     | `verification-before-completion` | Required |
```

**Verification:**
1. Read `framework/prompts/shared/superpowers.md`
2. Confirm exactly 5 new rows exist for: `frontend-engineer`, `backend-engineer`, `database-engineer`, `designer`, `high-designer`
3. Confirm all 5 new rows have `| Required |`

---

### Task 1A-2: superpowers.md — Add Optional skills (4 skill assignments)

**Wave:** 1
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Task 1A-1 completes)

**Files:**
- Modify: `framework/prompts/shared/superpowers.md` (append after Task 1A-1 rows)

**Change:** Append the following rows:

```markdown
| `frontend-engineer` | `requesting-code-review`        | Optional |
| `backend-engineer`  | `requesting-code-review`        | Optional |
| `high-engineer`     | `requesting-code-review`        | Optional |
| `frontend-engineer` | `receiving-code-review`         | Optional |
| `frontend-polisher` | `receiving-code-review`         | Optional |
| `backend-engineer`  | `receiving-code-review`         | Optional |
| `database-engineer` | `receiving-code-review`         | Optional |
| `cloud-architect`   | `receiving-code-review`         | Optional |
| `test-engineer`     | `receiving-code-review`         | Optional |
| `high-engineer`     | `receiving-code-review`         | Optional |
| `high-architect`    | `receiving-code-review`         | Optional |
| `high-designer`     | `receiving-code-review`         | Optional |
| `reviewer`          | `receiving-code-review`         | Optional |
| `code-reviewer`     | `receiving-code-review`         | Optional |
| `security-reviewer` | `receiving-code-review`         | Optional |
| `security-auditor`  | `receiving-code-review`         | Optional |
| `high-engineer`     | `executing-plans`               | Optional |
| `reviewer`          | `finishing-a-development-branch`| Optional |
```

**Verification:**
1. Read `framework/prompts/shared/superpowers.md`
2. Confirm `requesting-code-review` rows for: `frontend-engineer`, `backend-engineer`, `high-engineer`
3. Confirm `receiving-code-review` rows for: all 13 implementation/escalation/review agents listed above
4. Confirm `executing-plans` for: `high-engineer`
5. Confirm `finishing-a-development-branch` for: `reviewer`

---

### Task 1A-3: security-auditor.md — Fix write/edit permissions

**Wave:** 1
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Task 1A-2 completes)

**Files:**
- Modify: `framework/agents/04-review/security-auditor.md`

**Change:** Replace the current `edit: deny` and `write: deny` lines with:

```yaml
  edit:
    "*": deny
    "docs/specs/**/security-audit.md": allow
  write:
    "*": deny
    "docs/specs/**/security-audit.md": allow
```

**Verification:**
1. Read `framework/agents/04-review/security-auditor.md`
2. Confirm granular permission structure with `edit:` and `write:` each having `"*": deny` and `"docs/specs/**/security-audit.md": allow`
3. Confirm no unconditioned `edit: deny` or `write: deny` remains

---

### Task 1A-4: protocols.md — Replace PLAN_REJECTED with PLAN_REJECTION

**Wave:** 1
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Task 1A-3 completes)

**Files:**
- Modify: `framework/prompts/shared/protocols.md`

**Change:** Replace the existing `PLAN_REJECTED` block with:

```text
## PLAN_REJECTION

```text
PLAN_REJECTION
rejection_reason: <summary of why the plan was rejected>
specific_issues:
- <BLOCKER or WARNING>: <issue>
- ...
suggested_changes:
- <specific fix>
- ...
Return to: planner
```
```

**Verification:**
1. Read `framework/prompts/shared/protocols.md`
2. Confirm `PLAN_REJECTED` section header no longer exists
3. Confirm `PLAN_REJECTION` section exists with structured fields: `rejection_reason`, `specific_issues[]`, `suggested_changes[]`
4. Confirm block closes with `Return to: planner`

---

### Task 1A-5: dispatcher.md — Add Low-Tier Routing Guard

**Wave:** 1
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Task 1A-4 completes)

**Files:**
- Modify: `framework/agents/01-orchestration/dispatcher.md`

**Change:** After the `Shared Rules` section, add a new section:

```markdown
## Low-Tier Routing Guard

`low-*` agents (`low-engineer`, `low-task-worker`, `low-architect`, `low-designer`) must **never** be routed for:

1. **Security decisions** — auth, IAM, secrets management, encryption, compliance
2. **Database schema or migration changes** — any DDL, migration planning, schema design
3. **Architecture decisions** — service boundaries, API contracts, dependency structure
4. **Tasks spanning 5 or more files** — multi-file work requires mid-tier or above
5. **Costly-to-reverse mistakes** — destructive changes, data migrations, production config

If a task matches any of these criteria, route to the appropriate mid-tier or premium agent instead.
```

**Verification:**
1. Read `framework/agents/01-orchestration/dispatcher.md`
2. Confirm "Low-Tier Routing Guard" section exists with all 5 criteria
3. Confirm it appears under the Scope section (after Shared Rules)

---

## Phase 1B: Wire Required Third-Party Skills

Phase 1B wires Required third-party skill entries into `superpowers.md` and `opencode.jsonc`. The framework source `opencode.jsonc` contains only built-in plugins (superpowers + caveman). Third-party plugin entries are added to the **installed** copy by `oowl init`.

### Task 1B-1: opencode.jsonc — Verify built-in plugin entries

**Wave:** 2
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Phase 1A completes)

**Files:**
- Verify: `framework/opencode.jsonc`

**Change:** Confirm the `"plugin"` array in `framework/opencode.jsonc` contains exactly the two built-in methodology plugins:

```jsonc
"plugin": [
  "superpowers@git+https://github.com/obra/superpowers.git",
  "caveman@git+https://github.com/julius.brussee/caveman.git"
]
```

**Notes:**
- The framework source does NOT contain third-party plugin entries (claude-skills, stitch-kit, wondelai-skills). Those are added to the installed copy by `addThirdPartyPlugins()` during `oowl init`.
- If the entries above already exist, this task is complete.

**Verification:**
1. Read `framework/opencode.jsonc`
2. Confirm both plugin entries are present
3. Confirm no third-party plugin entries exist in the framework source
4. Confirm JSONC is valid (parseable)

---

### Task 1B-2: Implement `oowl install` — Framework setup + profile selection

**Wave:** 2
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Task 1B-1 completes)

**Files:**
- Modify: `src/commands/install.ts`

**Change:** Implement `oowl install` as a framework setup + profile selection wizard. The command:

1. Prompts for install location (local/global)
2. Prompts for model cost profile (low/balanced/high/custom)
3. Copies framework files to the install target
4. Applies the selected model profile
5. Writes `.oowl.json` install metadata
6. Prints prompt to run `oowl init`

```typescript
// src/commands/install.ts — key flow
async function runInstallWizard(): Promise<void> {
  const location = await chooseLocation();
  const profile = await chooseProfile();
  await installFramework({ location, cwd, frameworkDir, profile, ... });
  await applyProfile(profile.profileJson, openCodeDir);
  applyProfileJsonToJsonc(join(openCodeDir, "opencode.jsonc"), profile.profileJson);
  // Print success + prompt to run oowl init
}
```

**Notes:**
- `oowl install` takes no flags. It does NOT install skill sources.
- Skill source installation is entirely `oowl init`'s responsibility (Phase 1C).
- No `runSkillSourceInstalls()` function in install.ts.
- No `--with-skills` flag.

**Verification:**
1. Read `src/commands/install.ts` — confirm no skill source install logic
2. Confirm `runInstallWizard()` handles location + profile selection
3. Confirm success message includes prompt to run `oowl init`

---

### Task 1B-3: opencode.jsonc — Add Required skill permission entries

**Wave:** 2
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Task 1B-2 completes)

**Files:**
- Modify: `framework/opencode.jsonc`

**Change:** Add the following `agent.*.permission.skill` entries for Required third-party skills. These go inside the `"agent"` block of `opencode.jsonc`:

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

**Notes:**
- Total: 6 agent blocks with 10 skill permission entries
- These are Required skills that are always-on — no `oowl init` needed
- If `"agent"` block does not exist, add it at the top level
- If agent entries already exist, merge the new skill entries (don't duplicate)

**Verification:**
1. Read `framework/opencode.jsonc`
2. Confirm all 6 agents have the correct skill permission entries
3. Count total permission entries — should be 10

---

### Task 1B-4: superpowers.md — Add Phase 1B Required skill entries

**Wave:** 2
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 1B-1 (must run after plugin entries are verified)

**Files:**
- Modify: `framework/prompts/shared/superpowers.md`

**Change:** Append the following Required-only rows in grouped sections (after Phase 1A rows):

```markdown
<!-- Phase 1B Required: designer additions -->
| `designer` | `ui-ux-pro-max` | Required |
| `designer` | `ux-heuristics` | Required |

<!-- Phase 1B Required: high-designer additions -->
| `high-designer` | `ui-ux-pro-max` | Required |
| `high-designer` | `ux-heuristics` | Required |

<!-- Phase 1B Required: database-engineer additions -->
| `database-engineer` | `database-designer` | Required |
| `database-engineer` | `database-schema-designer` | Required |
| `database-engineer` | `migration-architect` | Required |

<!-- Phase 1B Required: code-reviewer additions -->
| `code-reviewer` | `pr-review-expert` | Required |
| `code-reviewer` | `dependency-auditor` | Required |

<!-- Phase 1B Required: reviewer additions -->
| `reviewer` | `pr-review-expert` | Required |
```

**Verification:**
1. Read `framework/prompts/shared/superpowers.md`
2. Count total Required rows added — should be 10
3. Confirm all rows have `| Required |` (no Optional rows in this task)
4. Confirm no `low-*` agents appear

---

### Task 1B-5: Deploy framework with install.sh

**Wave:** 2
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Tasks 1B-1, 1B-2, 1B-3, 1B-4 (all must complete first)

**Files:** (none — deployment only)

**Command to run:**

```bash
bash install.sh --global --force
```

**Verification:**
1. Run `bash install.sh --global --force` from project root
2. Confirm no errors during install
3. Verify `.opencode/opencode.jsonc` has the plugin entries and agent permission blocks

---

## Phase 1C: Optional Skill Configuration (oowl init)

Phase 1C implements the `oowl init` CLI command. This is the full pipeline: questionnaire → recommend → approve → write permissions → add third-party plugins → clone skill repos → install CLI tools → prompt restart. Optional skills approved by `oowl init` are written to the installed `opencode.jsonc` `agent.*.permission.skill` entries — NOT to `superpowers.md`.

### Task 1C-0: Create framework/skills-registry.json

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Phase 1B completes)

**Files:**
- Create: `framework/skills-registry.json`

**Change:** Create `framework/skills-registry.json` with all 38 Optional skills from the 4 skill sources. Each entry contains:

```json
{
  "id": "<skill-id>",
  "name": "<display-name>",
  "source": "<source-name>",
  "sourceUrl": "<https://...>",
  "stars": <number>,
  "category": "<frontend|cloud|database|security-auditor|priority|always-on>",
  "qualityGate": {
    "passed": true,
    "verifiedAt": "2026-06-02",
    "gateBasis": "<stars|official-provider>"
  },
  "assignedAgents": ["<agent>", ...],
  "activation": "Optional"
}
```

**Skill ID and category list (38 skills):**

*claude-skills (23 skills):* `senior-architect` (always-on), `api-design-reviewer` (priority), `api-test-suite-builder` (priority), `database-designer` (database), `database-schema-designer` (database), `migration-architect` (database), `playwright-pro` (frontend), `performance-profiler` (priority), `dependency-auditor` (priority), `pr-review-expert` (priority), `tech-debt-tracker` (priority), `incident-commander` (always-on), `monorepo-navigator` (always-on), `cicd-pipeline-builder` (cloud), `observability-designer` (cloud), `aws-solution-architect` (cloud), `codebase-onboarding` (always-on), `runbook-generator` (always-on), `release-manager` (always-on), `changelog-generator` (always-on), `apple-hig-expert` (frontend), `landing-page-generator` (frontend), `skill-security-auditor` (security-auditor)

*stitch-kit (9 skills):* `stitch-a11y` (priority), `stitch-animate` (priority), `stitch-react-components` (frontend), `stitch-shadcn-ui` (frontend), `stitch-react-native-components` (frontend), `stitch-swiftui-components` (frontend), `stitch-design-system` (frontend), `stitch-ideate` (frontend), `stitch-orchestrator` (frontend)

*wondelai-skills (5 skills):* `ux-heuristics` (frontend), `microinteractions` (priority), `design-everyday-things` (always-on), `hooked-ux` (priority), `ios-hig-design` (frontend)

*ui-ux-pro-max (1 skill):* `ui-ux-pro-max` (frontend)

**Verification:**
1. `framework/skills-registry.json` exists with exactly 38 skill entries (Optional only; Required skills are in superpowers.md and are not in this file)
2. Each entry has `id`, `name`, `source`, `sourceUrl`, `stars`, `category`, `qualityGate.passed: true`, `qualityGate.verifiedAt`, `assignedAgents[]`, and `activation: "Optional"`
3. All skill IDs match the names used in `filterByQualityGate()` in Task 1C-2
4. JSON is valid and parseable

**Notes:**
- This is the **source of truth** for `getQualityGatedSkills()` in the recommendation engine
- `filterByQualityGate()` reads skill IDs from this registry via `loadSkillsRegistry()`, not hardcoded in the TS file
- Skills with `qualityGate.passed: false` must not appear in the pool
- Required skills from superpowers.md are NOT duplicated here — this file covers only the 38 Optional skills

---

### Task 1C-1: Implement oowl init — ProjectAnswers type and questionnaire

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** (none — runs after Phase 1B completes)

**Files:**
- Create: `src/commands/init.ts` (new standalone command)
- Create: `src/lib/skill-recommender.ts` (new — recommendation engine)

**Change:** Implement `ProjectAnswers` interface and questionnaire function:

```typescript
// src/lib/skill-recommender.ts
export interface ProjectAnswers {
  projectType: 'web' | 'api' | 'fullstack' | 'mobile' | 'cli' | 'data' | 'other';
  frontend: 'next' | 'react' | 'vue' | 'svelte' | 'expo' | 'vanilla' | 'none';
  backend: string | null;
  cloud: 'cloudflare' | 'aws' | 'vercel-netlify' | 'self-hosted' | 'multi' | 'none';
  database: 'postgres' | 'neon' | 'clickhouse' | 'mysql' | 'mongodb' | 'sqlite' | 'none';
  priorities: Array<'security' | 'performance' | 'ui-polish' | 'mobile' | 'devex' | 'data-integrity' | 'engagement'>;
  _source?: 'describe' | 'questions';
}
```

The questionnaire supports both Path 1 (keyword-based free-form description parsing) and Path 2 (structured 5-question inquirer flow). Both paths converge on a confirmed `ProjectAnswers` object before the recommendation pass.

**Prerequisite check:** `oowl init` checks for `.opencode/` directory in current working directory. If not found, exits with: `"No local install found. Run 'oowl install local' first."`

**Verification:**
1. `src/commands/init.ts` exists with `ProjectAnswers` interface imported from skill-recommender
2. `askProjectQuestions()` equivalent handles both describe and questions paths
3. Prerequisite check implemented and tested

---

### Task 1C-2: Implement recommendation engine with 40+ rules

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 1C-0

**Files:**
- Modify: `src/lib/skill-recommender.ts`

**Change:** Implement the recommendation engine using only skills from the 4 actual skill repos. The engine is registry-driven — reads from `skills-registry.json` for quality gating.

**Rule categories:**

- **Frontend rules:** stitch-react-components, stitch-shadcn-ui, stitch-react-native-components, stitch-swiftui-components, stitch-design-system, stitch-ideate, stitch-orchestrator, playwright-pro, ios-hig-design, apple-hig-expert, landing-page-generator, microinteractions, stitch-a11y, stitch-animate, hooked-ux
- **Cloud rules:** aws-solution-architect, observability-designer, incident-commander, cicd-pipeline-builder, release-manager
- **Database rules:** database-designer
- **Backend rules:** api-design-reviewer, api-test-suite-builder, performance-profiler, dependency-auditor
- **Priority rules:** performance-profiler, microinteractions, stitch-a11y, stitch-animate, hooked-ux, monorepo-navigator, cicd-pipeline-builder, dependency-auditor, database-designer
- **Always-on rules:** senior-architect, design-everyday-things, tech-debt-tracker, incident-commander, monorepo-navigator, codebase-onboarding, runbook-generator, release-manager, changelog-generator

Also implement:
- `loadSkillsRegistry()` — reads and parses `framework/skills-registry.json`
- `getQualityGatedSkills()` — returns `Set<string>` of skill IDs where `qualityGate.passed === true`
- `filterByQualityGate(recommendations)` — removes skills not in the quality-gated pool
- Exclusion rules: `dispatcher`, `builder`, `plan-reviewer`, `low-*` agents must never receive Optional skills

**Verification:**
1. `src/lib/skill-recommender.ts` exists with all rule categories
2. `recommend()` function is deterministic (no LLM, no network)
3. `filterByQualityGate()` correctly excludes non-gated skills
4. Exclusion rules prevent recommendations for excluded agents
5. No references to VoltAgent or catalog-based skills

---

### Task 1C-3: Implement approval UX

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 1C-2

**Files:**
- Modify: `src/commands/init.ts`

**Change:** Implement the approval UX:

- **Parsed-Answers Confirmation:** Display confirmed `ProjectAnswers` before recommendation pass
- **Summary table:** Group recommended skills by agent
- **Edit mode:** Per-agent checkbox list showing recommended skills
- **Deny all:** Writes empty `optionalSkills: {}` and skips writing to `opencode.jsonc`

Flags to support:
- `oowl init --list` — show currently configured Optional skills (from `.oowl.json`)
- `oowl init --reset` — clear all Optional skills and re-run questionnaire
- `oowl init --apply` — re-write `opencode.jsonc` from `.oowl.json` without questionnaire
- `oowl init --help` — show usage

**Verification:**
1. All three paths (Approve all, Edit, Deny all) functional
2. `--list`, `--reset`, `--help` flags work
3. Summary table groups skills by agent

---

### Task 1C-4: Implement opencode.jsonc writer with JSONC parser

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 1C-3

**Files:**
- Create: `src/lib/opencode-config-writer.ts` (new)

**Change:** Implement three exported functions:

**1. `writeAgentPermissions()`** — writes approved Optional skills to installed `opencode.jsonc`:

```typescript
function writeAgentPermissions(
  opencodeJsoncPath: string,
  optionalSkills: Record<string, string[]>
): void
```

This function:
1. Reads existing `opencode.jsonc`
2. Parses using `cleanJsonc()` (character-by-character parser)
3. Merges/replaces `agent.<name>.permission.skill` blocks for agents with approved Optional skills
4. Validates all skill permissions are `"allow"`
5. Writes back — idempotent, no duplication

**2. `addThirdPartyPlugins()`** — adds third-party plugin entries to installed copy:

```typescript
function addThirdPartyPlugins(opencodeJsoncPath: string): void
```

Adds these entries to the installed `opencode.jsonc` plugin array (deduplicating by source name prefix):

```typescript
export const THIRD_PARTY_PLUGINS: string[] = [
  "claude-skills@git+https://github.com/alirezarezvani/claude-skills.git",
  "stitch-kit@git+https://github.com/gabelul/stitch-kit.git",
  "wondelai-skills@git+https://github.com/wondelai/skills.git",
];
```

**3. `cleanJsonc()`** — character-by-character JSONC parser:

```typescript
function cleanJsonc(text: string): string
```

Tracks `inString` state character-by-character. Handles:
- Escape sequences inside strings (`\"`, `\\`)
- Line comments (`//`) only outside strings — URLs like `https://` are never treated as comments
- Block comments (`/* */`) only outside strings
- Trailing comma removal before `}` or `]`

**Config persistence split:**
- `.oowl.json` — source of truth for re-runs (`optionalSkills` + `projectAnswers` keys)
- `opencode.jsonc` — operational artifact read by OpenCode at runtime

**Note:** `src/lib/superpowers-patcher.ts` is **eliminated**. Optional skills persist via `opencode.jsonc` agent permissions, NOT `superpowers.md` patching.

**Verification:**
1. `src/lib/opencode-config-writer.ts` exists with all three functions
2. `writeAgentPermissions()` is idempotent (running twice produces same result)
3. `addThirdPartyPlugins()` deduplicates by source name prefix
4. `cleanJsonc()` correctly preserves URLs inside strings
5. JSON validation before writing

---

### Task 1C-5: Wire init command with skill source installation

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 1C-4

**Files:**
- Modify: `src/commands/init.ts`
- Modify: `src/lib/installer.ts`
- Modify: `src/index.ts`

**Change:**

1. In `src/commands/init.ts`: Wire the full init flow:
   - Prerequisite check (`.opencode/` exists)
   - Questionnaire (describe or questions path)
   - Answers confirmation
   - Save `projectAnswers` to `.oowl.json`
   - Recommendation pass (`recommend()` + `filterByQualityGate()`)
   - Summary table display
   - Approval UX (approve all / edit / deny)
   - Save `optionalSkills` to `.oowl.json`
   - Write agent permissions to installed `opencode.jsonc`
   - Add third-party plugins to installed `opencode.jsonc`
   - **Skill source installation:**
     - Clone 3 git repos into `.opencode/plugins/` via `git clone --depth 1` (non-interactive)
     - `npm install -g uipro-cli && uipro init --ai opencode`
     - Skip already-cloned repos
   - Prompt user to restart OpenCode session

2. In `src/lib/installer.ts`: Extend `.oowl.json` schema with `optionalSkills` and `projectAnswers` keys

3. In `src/index.ts`: Register `init` as a standalone CLI command (separate from `install`)

**Skill source installation implementation:**

```typescript
async function runSkillSourceInstalls(openCodeDir: string): Promise<void> {
  // UI/UX Pro Max — via npm (non-interactive with --ai flag)
  runCommand("npm install -g uipro-cli && uipro init --ai opencode");

  // Clone all other skill sources into .opencode/plugins/
  const pluginsDir = join(openCodeDir, "plugins");
  mkdirSync(pluginsDir, { recursive: true });

  const skillRepos: Record<string, string> = {
    "claude-skills": "https://github.com/alirezarezvani/claude-skills.git",
    "stitch-kit": "https://github.com/gabelul/stitch-kit.git",
    "wondelai-skills": "https://github.com/wondelai/skills.git",
  };

  for (const [name, url] of Object.entries(skillRepos)) {
    const target = join(pluginsDir, name);
    if (existsSync(target)) continue; // skip already cloned
    runCommand(`git clone --depth 1 ${url} "${target}"`);
  }
}
```

**Notes:**
- All install commands are non-interactive (no prompts)
- `git clone --depth 1` for shallow clones (fast, minimal disk)
- Already-cloned repos are skipped (idempotent)
- No `npx skills add` — all repos cloned directly via git
- `stitch-kit` uses `git+https://` URL (not npm protocol — avoids startup lag from npm registry resolution)

**Verification:**
1. `oowl init` runs as standalone command
2. `oowl init --list`, `--reset`, `--help` functional
3. `.oowl.json` includes `optionalSkills` and `projectAnswers` after running init
4. `oowl install` has no questionnaire or skill source logic
5. Skill repos cloned into `.opencode/plugins/` after init
6. Restart prompt displayed after successful init

---

### Task 1C-6: Add oowl init tests

**Wave:** 3
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 1C-5

**Files:**
- Create/Modify: `tests/commands/init.test.ts`
- Create/Modify: `tests/lib/skill-recommender.test.ts`

**Change:** Add test coverage for:
- Prerequisite check (`.opencode/` existence)
- `recommend()` with various `ProjectAnswers` combinations
- `filterByQualityGate()` excluding non-gated skills
- `writeAgentPermissions()` idempotency and JSON merge correctness
- `addThirdPartyPlugins()` deduplication and merge
- `cleanJsonc()` preserving URLs inside strings, stripping comments outside
- `validateAgentPermissions()` rejecting non-"allow" values
- Full init wizard flow with mocked questionnaire answers

**Verification:**
1. Tests pass: `npx vitest run tests/commands/init.test.ts tests/lib/skill-recommender.test.ts`
2. Coverage includes all key functions

---

## Phase 2: Custom Guidelines

Phase 2 creates four plain markdown guideline files and registers them via `opencode.jsonc` `instructions` field. This approach uses OpenCode's native `instructions` feature — no SKILL.md format, no skill tool invocation needed.

### Task 2-1: Create framework/prompts/ directory and four guideline files

**Wave:** 4
**Execution:** Parallel
**Parallel Group:** PH2
**Blocking:** (none)
**Dependencies:** (none)

**Files:**
- Create: `framework/prompts/plan-completeness.md`
- Create: `framework/prompts/dispatcher-routing.md`
- Create: `framework/prompts/security-review-checklist.md`
- Create: `framework/prompts/architecture-principles.md`

**Content — plan-completeness.md:**

```markdown
# plan-completeness

Use this skill when reviewing an `implementation.md` before returning `PLAN_APPROVED` or `PLAN_REJECTED`.

## When to Use

- `plan-reviewer` receives a new `implementation.md` from `planner`
- `planner` self-reviews before returning `PHASE_COMPLETE`
- Any agent checks whether an implementation plan is complete

## Completeness Checklist

For each task in the implementation plan, verify:

### Required Fields
- [ ] **Task ID and title** — unique identifier (e.g., `1A-1`) and descriptive title
- [ ] **Files affected** — exact paths (no glob patterns, no `*`)
- [ ] **What to change** — specific edits with before/after context
- [ ] **Verification** — how to confirm the task is done correctly
- [ ] **Dependencies** — what must be completed before this task
- [ ] **Rollback** — how to undo if needed

### Task Prompt Completeness
- [ ] Complete task prompt with context, constraints, and expected output
- [ ] File locks are specific paths (not `docs/**`, not `*`, not `**/*`)
- [ ] No implementation agent modifies `docs/specs/**`
- [ ] Test plan included for new/changed behavior

### Test-First Coverage (for new or changed behavior)
- [ ] Focused test created or updated before implementation
- [ ] Test file path named exactly
- [ ] If no automated test: specific no-test rationale given + manual verification plan

### Wave/Parallel Planning
- [ ] Wave number assigned (sequential: Wave 1, Wave 2, ...)
- [ ] Parallel group ID assigned for parallel/mixed waves
- [ ] Max 3 concurrent tasks per wave
- [ ] Blocking list correct (tasks that must complete before this one starts)
- [ ] Dependency list correct (tasks this one depends on)

### Anti-Patterns — Reject If Present
- "TBD", "TODO", "implement later" — must have actual content
- "Add appropriate error handling" — must show actual handling
- "Similar to Task N" — must repeat the detail (engineers read out of order)
- Steps that describe what without showing how — code blocks required
- References to types/functions not defined anywhere in the plan

## Output

When all items pass: the implementation plan is complete and ready for execution.

When items fail: return `PLAN_REJECTED` (now `PLAN_REJECTION`) with structured fields.
```

**Content — dispatcher-routing.md:**

```markdown
# dispatcher-routing

Use this skill when making any routing decision as `dispatcher`. This skill formalizes the Low-Tier Routing Guard and provides structured decision-making for all agent selections.

## When to Use

- `dispatcher` classifies a request as trivial or substantial
- `dispatcher` selects which agent to route a task to
- `dispatcher` evaluates whether a task is eligible for `low-*` agents
- `dispatcher` escalates to high-tier agents

## Routing Decision Tree

### Step 1: Classify the Request

```
Is the request trivial?
  Meets ALL trivial-fix criteria (routing.md)?
    YES → TRIVIAL_FIX_DISPATCH
    NO  → Step 2

Is the request substantial?
  Requires spec changes, approval gates, or multi-file work?
    YES → proceed to Step 2
    NO  → ask routing-blocker question
```

### Step 2: Select Agent Tier

```
Is the task in the LOW-TIER EXCLUSION LIST?
  - Security decisions (auth, IAM, secrets, encryption, compliance)
  - Database schema or migration changes
  - Architecture decisions (service boundaries, API contracts, dependency structure)
  - Tasks spanning 5+ files
  - Mistakes costly to reverse (destructive changes, data migrations, production config)

  YES → Route to MID-TIER or PREMIUM (see tier guide below)
  NO  → Step 3
```

### Step 3: Select Specific Agent

**Tier guide:**

| Task type | Agent(s) |
|---|---|
| Design exploration | `architect` |
| UI specification | `designer` → `high-designer` (escalation) |
| Implementation planning | `planner` |
| Plan quality review | `plan-reviewer` |
| Frontend work | `frontend-engineer` → `frontend-polisher` |
| Backend work | `backend-engineer` |
| Database work | `database-engineer` |
| Cloud/infra work | `cloud-architect` |
| Testing | `test-engineer` |
| Code review | `code-reviewer` |
| Security review | `security-reviewer` → `security-auditor` (escalation) |
| Deep security audit | `security-auditor` |
| Escalated engineering | `high-engineer` |
| Escalated architecture | `high-architect` |
| Escalated design | `high-designer` |

**Cost-tiering:** Use the cheapest tier that can do the work safely. Never route to `low-*` for exclusion-list tasks.

### Step 4: Verify Permissions

Before dispatching, confirm the selected agent has permission to access the required files. Check the agent's permission block in `framework/agents/<path>/<agent>.md`.

## Low-Tier Eligibility Check

A task is eligible for `low-*` agents ONLY if ALL of:
- [ ] Task involves 1-4 files (max)
- [ ] No security decisions required
- [ ] No database schema/migration changes
- [ ] No architecture decisions
- [ ] Not a destructive change
- [ ] Not production-config changes
- [ ] Mistake is cheap to undo

If ANY is NO → route to mid-tier or premium instead.

## Escalation Criteria

Escalate to `high-*` when:
- Task requires skill not available to mid-tier
- Task scope exceeds mid-tier capacity
- Mid-tier returned `REQUEST_CONSULT` for specialist
- Risk level warrants premium review

## Output

For each routing decision, state:
- Selected agent
- Reasoning (why not cheaper)
- Confirmation that exclusion list was checked
```

**Content — security-review-checklist.md:**

```markdown
# security-review-checklist

OWASP Top 10 adapted to oowl CLI context. Use when performing security review of code changes, configs, or architecture decisions.

## When to Use

- `security-reviewer` reviews a code change
- `security-auditor` performs deep audit
- `code-reviewer` flags security concerns
- Any agent identifies a potential security issue

## Checklist

### A01 — Broken Access Control
- [ ] No unverified authentication assumption
- [ ] No exposed internal API routes without auth checks
- [ ] File permissions follow least privilege
- [ ] No directory traversal via user input
- [ ] No role escalation paths

### A02 — Cryptographic Failures
- [ ] No hardcoded secrets, keys, or tokens in code
- [ ] No default credentials
- [ ] No weak crypto (MD5, SHA1 for password hashing, etc.)
- [ ] Environment variables used for secrets (not hardcoded)
- [ ] No sensitive data in logs

### A03 — Injection
- [ ] No SQL injection (parameterized queries used)
- [ ] No command injection (no shell interpolation of user input)
- [ ] No path injection (user input sanitized before file operations)
- [ ] No prompt injection (LLM calls sandboxed)

### A04 — Insecure Design
- [ ] No security-sensitive logic without auth guard
- [ ] No missing authorization checkpoints
- [ ] Trust boundaries documented and respected
- [ ] No reliance on security through obscurity alone

### A05 — Security Misconfiguration
- [ ] No default configs in production
- [ ] No verbose error messages leaking internals
- [ ] No unnecessary features/ports enabled
- [ ] Permissions follow least privilege
- [ ] CORS policy is explicit (not `*` for sensitive routes)

### A06 — Vulnerable Components
- [ ] Dependencies audited (`dependency-auditor` or equivalent)
- [ ] No known-CVE packages in use
- [ ] Third-party skills verified before loading
- [ ] npm/pip audit passed

### A07 — Auth Failures
- [ ] No missing auth on protected routes
- [ ] Session tokens not exposed in URLs or logs
- [ ] No infinite failed login attempts without rate limiting
- [ ] Tokens properly scoped

### A08 — Data Integrity Failures
- [ ] No trusting of external data without validation
- [ ] Config files validated before use
- [ ] Schema migrations reviewed for data loss risk

### A09 — Logging & Monitoring Failures
- [ ] Security events logged (auth failures, escalation, etc.)
- [ ] Errors don't leak stack traces to users
- [ ] Sensitive operations have audit trail

### A10 — SSRF (Server-Side Request Forgery)
- [ ] No user-provided URLs without validation
- [ ] No internal service access from external-facing code
- [ ] URL schemes restricted (no `file://`, etc.)

## oowl-Specific Considerations

- **Agent permissions:** `docs/specs/**` is protected — agents must not write there unless explicitly allowed
- **File locks:** Implementation agents have restricted file access — verify locks are specific paths
- **Subagent isolation:** Task child sessions inherit parent permissions — check escalation paths
- **LLM prompts:** Prompt injection risk — user input must be escaped in prompt construction

## Finding Severity

| Severity | When to use |
|---|---|
| BLOCKER | Exploitable vulnerability, data breach risk, compliance violation |
| HIGH | Significant weakness easily exploited, default creds, unvalidated input |
| MEDIUM | Defense-in-depth gap, missing logging, misconfiguration |
| LOW | Hardening opportunity, best-practice gap |
| INFO | Informational, no current risk |

## Output

For each finding:
```
Finding: <title>
Severity: <BLOCKER|HIGH|MEDIUM|LOW|INFO>
Affected files: <file>
Evidence: <specific observation>
Risk: <impact>
Recommendation: <specific fix>
Verification: <how to verify>
```
```

**Content — architecture-principles.md:**

```markdown
# architecture-principles

Distilled principles from Clean Architecture, Domain-Driven Design, Designing Data-Intensive Applications, and The Pragmatic Programmer. Use when making architecture, design, or engineering decisions.

## When to Use

- `architect` or `high-architect` evaluates design tradeoffs
- `backend-engineer` structures service boundaries
- `database-engineer` designs data models
- `planner` assesses implementation complexity
- Any agent considers architecture quality

## Clean Architecture Principles

1. **Dependency Rule** — dependencies point inward; inner layers know nothing of outer layers
2. **Use cases at center** — business logic is the core; frameworks and UI are peripheral
3. **Interface segregation** — define narrow interfaces at layer boundaries
4. **Independence** — architecture supports independent deployability, testability, and development
5. **Boundaries** — draw boundaries between things that change at different rates
6. **Entities over frameworks** — business rules must not depend on frameworks, databases, or UI

## Domain-Driven Design Principles

7. **Ubiquitous Language** — shared vocabulary between developers and domain experts
8. **Bounded Contexts** — explicit boundaries where a model applies; different contexts may use different models
9. **Aggregates** — consistency boundaries around clusters of related entities
10. **Value Objects** — immutable objects defined by attributes, not identity
11. **Domain Events** — communicate significant state changes explicitly
12. **Anti-Corruption Layers** — translate between bounded contexts to prevent model leakage
13. **Context Mapping** — document relationships between bounded contexts (partnership, shared kernel, customer-supplier)

## Data-Intensive Application Principles

14. **Choose the right data model** — relational, document, graph, or stream based on access patterns
15. **Replication vs partitioning** — understand tradeoffs between availability and consistency
16. **Transactions are not the only option** — consider sagas, compensating actions, eventual consistency
17. **Schema evolution** — design for change; backward and forward compatibility
18. **Stream processing** — prefer event-driven architectures for complex data flows
19. **Observability** — metrics, logs, and traces are first-class concerns, not afterthoughts
20. **Idempotency** — design operations to be safely retried

## Pragmatic Engineering Principles

21. **DRY (Don't Repeat Yourself)** — every piece of knowledge has a single authoritative representation
22. **Orthogonality** — eliminate effects between unrelated things
23. **Tracer bullets** — prototype end-to-end to validate architecture before committing
24. **Design by contract** — specify preconditions, postconditions, and invariants
25. **Fail fast** — detect and report errors as close to the source as possible
26. **Reversibility** — prefer decisions that can be undone; avoid irreversible choices without explicit justification
27. **Concurrency** — design for parallel execution; shared state is the enemy
28. **Automate** — if you do it twice, automate it the third time

## Decision Framework

When evaluating an architecture decision:
- [ ] Does it respect the dependency rule?
- [ ] Is the bounded context clear?
- [ ] Can it evolve independently?
- [ ] Is it reversible?
- [ ] Does it fail fast on invalid input?
- [ ] Is it observable in production?
```

**Verification:**
1. Confirm all four files exist at `framework/prompts/<name>.md`
2. Confirm each file has the correct content per specifications above

---

### Task 2-2: Register guidelines in opencode.jsonc instructions field

**Wave:** 4
**Execution:** Sequential
**Parallel Group:** (none)
**Blocking:** (none)
**Dependencies:** Task 2-1 (guideline files must exist first)

**Files:**
- Modify: `framework/opencode.jsonc`

**Change:** Add the `instructions` array to `framework/opencode.jsonc`:

```jsonc
"instructions": [
  "prompts/dispatcher-routing.md",
  "prompts/plan-completeness.md",
  "prompts/security-review-checklist.md",
  "prompts/architecture-principles.md"
]
```

**Notes:**
- If `instructions` key does not exist, add it at the top level
- If `instructions` already exists, append these entries to the existing array
- These files are auto-included in every agent's context — no skill tool invocation needed

**Verification:**
1. Read `framework/opencode.jsonc`
2. Confirm `instructions` array contains all 4 guideline entries
3. Confirm JSONC is valid (parseable)

---

## Final Verification

After all tasks complete:

1. Run `npx tsc --noEmit` — confirm clean TypeScript compilation
2. Run `npx vitest run` — confirm all tests pass
3. Run `bash install.sh --global --force` from project root — confirm no errors
4. Read `framework/prompts/shared/superpowers.md` — confirm Phase 1A + 1B rows present
5. Read `framework/prompts/shared/protocols.md` — confirm `PLAN_REJECTION` present
6. Read `framework/agents/04-review/security-auditor.md` — confirm granular permissions
7. Read `framework/agents/01-orchestration/dispatcher.md` — confirm Low-Tier Routing Guard
8. Read `framework/opencode.jsonc` — confirm plugin entries (superpowers + caveman only), agent permission blocks (6 agents), and instructions entries (4 entries)
9. Confirm `framework/prompts/` contains 4 guideline files
10. Confirm `framework/skills-registry.json` contains 38 entries
11. Confirm `src/commands/init.ts` exists and implements full oowl init pipeline including skill source installation
12. Confirm `src/commands/install.ts` has no skill source logic

---

## Wave Summary

| Wave | Tasks | Mode | Notes |
|------|-------|------|-------|
| 1 | 1A-1 → 1A-2 → 1A-3 → 1A-4 → 1A-5 | Sequential | Phase 1A wiring tasks |
| 2 | 1B-1 → 1B-2 → 1B-3 → 1B-4 → 1B-5 | Sequential | Phase 1B: verify plugins, implement install wizard, add Required permissions, add superpowers.md entries, deploy |
| 3 | 1C-0 → 1C-1 → 1C-2 → 1C-3 → 1C-4 → 1C-5 → 1C-6 | Sequential | Phase 1C oowl init implementation (including skill source installation) |
| 4 | 2-1 (parallel PH2), then 2-2 | Sequential | Phase 2 guidelines create + register |

---

## Dependency Order

- Phase 1A Tasks 1A-1 → 1A-5: sequential (each modifies different files or distinct sections)
- Phase 1B Tasks 1B-1 → 1B-2 → 1B-3 → 1B-4 → 1B-5: sequential (1B-4 depends on 1B-1)
- Phase 1C Tasks 1C-0 → 1C-1 → 1C-2 → 1C-3 → 1C-4 → 1C-5 → 1C-6: sequential (each builds on prior)
- Phase 2 Task 2-1: parallel (PH2 group) — files create independently
- Phase 2 Task 2-2: sequential after 2-1 (register in opencode.jsonc)
- Phase 1A must complete before Phase 1B, 1C, and Phase 2
- Phase 1B and Phase 1C are independent — can run in any order after Phase 1A
- Phase 2 is independent of Phase 1B and 1C

---

## Rollback Reference

| Task | Rollback command |
|---|---|
| 1A-1, 1A-2 | `git checkout -- framework/prompts/shared/superpowers.md` |
| 1A-3 | `git checkout -- framework/agents/04-review/security-auditor.md` |
| 1A-4 | `git checkout -- framework/prompts/shared/protocols.md` |
| 1A-5 | `git checkout -- framework/agents/01-orchestration/dispatcher.md` |
| 1B-1, 1B-3, 1B-5 | `git checkout -- framework/opencode.jsonc` |
| 1B-2 | `git checkout -- src/commands/install.ts` |
| 1B-4 | `git checkout -- framework/prompts/shared/superpowers.md` |
| 1C-0 | `git checkout -- framework/skills-registry.json` |
| 1C-1 to 1C-6 | `git checkout -- src/commands/init.ts src/lib/skill-recommender.ts src/lib/opencode-config-writer.ts` |
| 2-1 | `rm framework/prompts/plan-completeness.md framework/prompts/dispatcher-routing.md framework/prompts/security-review-checklist.md framework/prompts/architecture-principles.md` |
| 2-2 | `git checkout -- framework/opencode.jsonc` |
