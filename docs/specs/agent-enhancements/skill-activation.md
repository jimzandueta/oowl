# Optional Skill Activation — oowl init

**Feature slug:** `agent-enhancements`
**Sub-topic:** Optional Skill Selection via `oowl init`
**Owner:** high-architect

---

## 1. Flow Overview

`oowl init` is a standalone CLI command that selects and activates per-project Optional skills. It runs after `oowl install` and is always project-scoped.

```
oowl init
  │
  ├─ Step 0: Prerequisite check
  │   └─ .opencode/ exists? → continue
  │       missing? → error + exit
  │
  ├─ Step 1: Hybrid project discovery
  │   ├─ Path A: Describe (free-form text → LLM parse)
  │   └─ Path B: Questions (5 structured @inquirer/prompts)
  │
  ├─ Step 2: Parsed-answers confirmation
  │   ├─ Yes → proceed
  │   ├─ Edit answers → back to Path B (pre-populated)
  │   └─ Start over → back to Step 1
  │
  ├─ Step 3: Architect recommendation pass
  │   └─ Deterministic rules (40+) → SkillRecommendation map
  │
  ├─ Step 4: Quality gate filter
  │   └─ Remove skills not in quality-gated pool (38 Optional skills)
  │
  ├─ Step 5: Approval UX
  │   ├─ Approve all → continue
  │   ├─ Edit → per-agent checkbox selection
  │   └─ Deny all → write empty; skip to Step 8
  │
  ├─ Step 6: Write to .oowl.json
  │   └─ optionalSkills + projectAnswers keys
  │
  ├─ Step 7: Write to opencode.jsonc
  │   ├─ agent.<name>.permission.skill blocks
  │   └─ addThirdPartyPlugins() — 3 third-party plugin entries
  │
  ├─ Step 8: Skill source installation
  │   ├─ git clone --depth 1 × 3 repos into .opencode/plugins/
  │   ├─ npm install -g uipro-cli && uipro init --ai opencode
  │   └─ skip already-cloned repos (idempotent)
  │
  └─ Step 9: Restart prompt
      └─ "Restart your OpenCode session to load new skills."
```

---

## 2. Prerequisites

`oowl install` must have run before `oowl init`. Install deploys the framework files (agents, commands, prompts, model-profiles) and applies a model cost profile. `oowl install` does **not** install skill sources — all skill source installation is `oowl init`'s responsibility.

`oowl init` checks for `.opencode/` in the current working directory before proceeding. If absent:

```
✗ No local install found in this directory.
  Run 'oowl install local' first, then re-run 'oowl init'.
```

Execution continues once the prerequisite is met. No additional warnings are needed — skill sources are installed during `oowl init` itself (Step 8).

---

## 3. Hybrid Discovery

Both discovery paths produce the same `ProjectAnswers` object, which feeds the recommendation engine. The user chooses which path to take.

### 3.1 Entry Prompt

```
We can load optional skills to make your project better.
First we need to know what you are building.

  [1] Describe your project (recommended)
  [2] Answer a few questions
```

### 3.2 Path A: Describe (LLM-Parsed)

The user types a free-form description:

```
? Describe your project in a sentence or two:
❯ I'm building a SaaS dashboard for analytics. Next.js frontend, Go backend,
  PostgreSQL on Neon. Deploying on Cloudflare. Security and performance are
  my top concerns.
```

**LLM extraction prompt:**

```
You are a project classifier. Extract structured project metadata from the user description below.
Return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "projectType": "<web|api|fullstack|mobile|cli|data|other>",
  "frontend": "<next|react|vue|svelte|expo|vanilla|none>",
  "backend": "<string or null>",
  "cloud": "<cloudflare|aws|vercel-netlify|self-hosted|multi|none>",
  "database": "<postgres|neon|clickhouse|mysql|mongodb|sqlite|none>",
  "priorities": ["<security|performance|ui-polish|mobile|devex|data-integrity|engagement>", ...]
}
Use defaults (the last enum value, or null for backend) when information is absent.

User description:
"""
{USER_DESCRIPTION}
"""
```

**Model:** Cheap/fast tier (same as `dispatcher`). Expected token count: ~500 per call.

**Fallback:** If the LLM is unavailable or the response fails JSON validation after one retry, fall back silently to Path B:

```
⚠  Could not reach LLM for description parsing. Falling back to questions.
```

**Confirmation:** After parsing, the confirmation display (Section 3.4) is mandatory before the recommendation pass.

### 3.3 Path B: Questions (Structured)

Five `@inquirer/prompts` questions presented sequentially.

**Question 1 — Project Type**

```
? What kind of project is this?
  ❯ Web app (React, Next.js, Vue, Svelte, vanilla)
    API / microservice (REST, GraphQL, gRPC)
    Full-stack (frontend + backend in one repo)
    Mobile app (iOS, Android, React Native, Expo)
    CLI tool or library
    Data / analytics platform
    Other / not sure
```

Variable: `projectType: 'web' | 'api' | 'fullstack' | 'mobile' | 'cli' | 'data' | 'other'`

**Question 2 — Frontend Framework** (skipped if `projectType` is `api` or `cli`)

```
? Which frontend framework?
  ❯ Next.js
    React (not Next.js)
    Vue / Nuxt
    Svelte / SvelteKit
    Expo / React Native
    Vanilla / other
    No frontend
```

Variable: `frontend: 'next' | 'react' | 'vue' | 'svelte' | 'expo' | 'vanilla' | 'none'`

**Question 3 — Cloud / Hosting Target**

```
? Where does this project run?
  ❯ Cloudflare (Workers, Pages, D1, R2)
    AWS (Lambda, ECS, S3, RDS, etc.)
    Vercel / Netlify
    Self-hosted / Docker / VMs
    Multiple / undecided
    No cloud (local tool / library)
```

Variable: `cloud: 'cloudflare' | 'aws' | 'vercel-netlify' | 'self-hosted' | 'multi' | 'none'`

**Question 4 — Database**

```
? What database does this project use?
  ❯ PostgreSQL (standard)
    Neon (serverless Postgres)
    ClickHouse (analytics)
    MySQL / MariaDB
    MongoDB / document DB
    SQLite / embedded
    No database
```

Variable: `database: 'postgres' | 'neon' | 'clickhouse' | 'mysql' | 'mongodb' | 'sqlite' | 'none'`

**Question 5 — Project Priorities** (multi-select, up to 3)

```
? What are the top priorities for this project? (select up to 3)
  ◉ Security — auth, secrets management, compliance
  ◉ Performance — Core Web Vitals, latency, throughput
  ◯ UI polish — animations, microinteractions, accessibility
  ◯ Mobile / native feel — iOS HIG, platform conventions
  ◯ Developer experience — CI/CD, monorepo tooling, testing
  ◯ Data integrity — migrations, schema safety, rollback
  ◯ Engagement — retention, habit loops, onboarding
```

Variable: `priorities: Array<'security' | 'performance' | 'ui-polish' | 'mobile' | 'devex' | 'data-integrity' | 'engagement'>`

### 3.4 Convergence — ProjectAnswers Schema

Both paths produce the same TypeScript interface:

```typescript
interface ProjectAnswers {
  projectType: 'web' | 'api' | 'fullstack' | 'mobile' | 'cli' | 'data' | 'other';
  frontend:    'next' | 'react' | 'vue' | 'svelte' | 'expo' | 'vanilla' | 'none';
  backend:     string | null;   // free-text; null if not provided
  cloud:       'cloudflare' | 'aws' | 'vercel-netlify' | 'self-hosted' | 'multi' | 'none';
  database:    'postgres' | 'neon' | 'clickhouse' | 'mysql' | 'mongodb' | 'sqlite' | 'none';
  priorities:  Array<'security' | 'performance' | 'ui-polish' | 'mobile' | 'devex' | 'data-integrity' | 'engagement'>;
  _source?:    'describe' | 'questions'; // metadata; not used in recommendation logic
}
```

After the confirmation display resolves with user approval, the `ProjectAnswers` object passes to the recommendation engine unchanged.

### 3.5 Parsed-Answers Confirmation

Displayed after both paths — mandatory for Path A, also shown for Path B as final review.

```
─────────────────────────────────────────────────
  I understood your project as:
    - Type:       Full-stack
    - Frontend:   Next.js
    - Backend:    Go
    - Cloud:      Cloudflare
    - Database:   Neon
    - Priorities: Security, Performance
─────────────────────────────────────────────────

? Is that correct?
  ❯ Yes — continue to skill recommendations
    Edit answers — fix individual fields
    Start over — go back to the beginning
```

**Yes** — proceed to recommendation pass.

**Edit answers** — open the 5-question form (Path B) pre-populated with current values. On completion, show confirmation again. User must confirm before proceeding.

**Start over** — clear `ProjectAnswers` and return to Section 3.1.

---

## 4. Recommendation Rules

The recommendation engine is a deterministic function: `recommend(answers: ProjectAnswers): SkillRecommendation`. No LLM call. All rules enumerate exactly.

Rules are additive — a skill is recommended if any rule fires. Required Phase 1B skills are not listed here (they are always-on and not subject to `oowl init`). All rules reference only skills from the 4 verified sources (38 Optional skills).

> **Note:** Architecture principles from Clean Architecture, DDD, DDIA, and Pragmatic Programmer are provided via `framework/prompts/architecture-principles.md`, registered as an `instructions` entry in `opencode.jsonc`. This file is auto-included in every agent's context and does not require skill-based recommendation rules.

### 4.1 Frontend Rules

| Condition | Agent | Skill | Reason |
|---|---|---|---|
| `frontend !== 'none'` | `frontend-engineer` | `stitch-react-components` | React component generation for this frontend |
| `frontend !== 'none'` | `frontend-engineer` | `stitch-shadcn-ui` | shadcn/ui component generation |
| `frontend !== 'none'` | `designer` | `stitch-react-components` | Component design for this frontend |
| `frontend !== 'none'` | `designer` | `stitch-shadcn-ui` | shadcn/ui design system support |
| `frontend !== 'none'` | `designer` | `stitch-design-system` | Design system generation and maintenance |
| `frontend !== 'none'` | `designer` | `stitch-ideate` | Design ideation and exploration |
| `frontend !== 'none'` | `designer` | `stitch-orchestrator` | Multi-component design orchestration |
| `frontend !== 'none'` | `high-designer` | `stitch-design-system` | Escalated design system work |
| `frontend !== 'none'` | `high-designer` | `stitch-ideate` | Escalated design ideation |
| `frontend !== 'none'` | `high-designer` | `stitch-orchestrator` | Escalated design orchestration |
| `frontend !== 'none'` | `designer` | `landing-page-generator` | Landing/marketing page design |
| `frontend !== 'none'` | `designer` | `apple-hig-expert` | Apple HIG interaction patterns |
| `frontend !== 'none'` | `high-designer` | `apple-hig-expert` | Escalated Apple HIG patterns |
| `frontend !== 'none'` | `high-designer` | `landing-page-generator` | Escalated landing page design |
| `frontend === 'expo' \|\| priorities.includes('mobile')` | `frontend-engineer` | `stitch-react-native-components` | React Native component generation |
| `frontend === 'expo' \|\| priorities.includes('mobile')` | `frontend-engineer` | `stitch-swiftui-components` | SwiftUI component generation for iOS |
| `frontend === 'expo' \|\| priorities.includes('mobile')` | `designer` | `ios-hig-design` | Apple HIG for mobile-first design |
| `frontend === 'expo' \|\| priorities.includes('mobile')` | `designer` | `stitch-swiftui-components` | SwiftUI component design for iOS |
| `frontend === 'expo' \|\| priorities.includes('mobile')` | `high-designer` | `ios-hig-design` | Escalated design for mobile |
| `priorities.includes('devex')` | `test-engineer` | `playwright-pro` | E2E test generation and flaky test fixing |
| `priorities.includes('devex')` | `frontend-engineer` | `playwright-pro` | Frontend test generation |

### 4.2 Cloud Rules

| Condition | Agent | Skill | Reason |
|---|---|---|---|
| `cloud === 'aws'` | `cloud-architect` | `aws-solution-architect` | AWS solution patterns (IAM, S3, Lambda, VPC) |
| `cloud === 'aws'` | `high-architect` | `aws-solution-architect` | Escalated cloud architecture |
| `cloud !== 'none'` | `cloud-architect` | `observability-designer` | SLO design and alerting setup |
| `cloud !== 'none'` | `high-architect` | `observability-designer` | Escalated observability design |
| `cloud !== 'none'` | `cloud-architect` | `incident-commander` | Incident response playbook |
| `cloud !== 'none'` | `high-architect` | `incident-commander` | Escalated incident response |
| `priorities.includes('devex')` | `cloud-architect` | `cicd-pipeline-builder` | CI/CD pipeline generation |
| `cloud !== 'none'` | `cloud-architect` | `release-manager` | Release orchestration and changelogs |
| `cloud !== 'none'` | `reviewer` | `release-manager` | Release review coordination |

### 4.3 Database Rules

| Condition | Agent | Skill | Reason |
|---|---|---|---|
| `database !== 'none'` | `architect` | `database-designer` | Data model design capability |

### 4.4 Backend Rules

| Condition | Agent | Skill | Reason |
|---|---|---|---|
| `projectType === 'api' \|\| projectType === 'fullstack'` | `backend-engineer` | `api-design-reviewer` | REST API linting and breaking change detection |
| `projectType === 'api' \|\| projectType === 'fullstack'` | `code-reviewer` | `api-design-reviewer` | API review during code review |
| `projectType === 'api' \|\| projectType === 'fullstack'` | `backend-engineer` | `api-test-suite-builder` | API route scanning → test suite generation |
| `projectType === 'api' \|\| projectType === 'fullstack'` | `test-engineer` | `api-test-suite-builder` | API test suite generation |
| `projectType !== 'cli' && projectType !== 'other'` | `backend-engineer` | `performance-profiler` | Node/Python/Go profiling |
| `projectType !== 'cli' && projectType !== 'other'` | `high-engineer` | `performance-profiler` | Escalated performance diagnosis |
| `projectType !== 'cli' && projectType !== 'other'` | `backend-engineer` | `dependency-auditor` | Dependency vulnerability scanning |

### 4.5 Priority Rules

| Condition | Agent | Skill | Reason |
|---|---|---|---|
| `priorities.includes('security')` | `backend-engineer` | `dependency-auditor` | Dependency vulnerability scanning |
| `priorities.includes('security')` | `backend-engineer` | `api-design-reviewer` | API security and breaking change detection |
| `priorities.includes('performance')` | `backend-engineer` | `performance-profiler` | Node/Python/Go profiling |
| `priorities.includes('performance')` | `high-engineer` | `performance-profiler` | Escalated performance diagnosis |
| `priorities.includes('ui-polish')` | `frontend-polisher` | `microinteractions` | Dan Saffer's microinteraction framework |
| `priorities.includes('ui-polish')` | `frontend-polisher` | `stitch-a11y` | WCAG 2.1 AA audit and fixes |
| `priorities.includes('ui-polish')` | `frontend-polisher` | `stitch-animate` | Purposeful motion with prefers-reduced-motion |
| `priorities.includes('ui-polish')` | `designer` | `microinteractions` | Microinteraction design |
| `priorities.includes('ui-polish')` | `designer` | `stitch-a11y` | Accessibility design audit |
| `priorities.includes('ui-polish')` | `designer` | `stitch-animate` | Animation design |
| `priorities.includes('engagement')` | `designer` | `hooked-ux` | Nir Eyal habit-forming design (Trigger→Action→Variable Reward→Investment) |
| `priorities.includes('engagement')` | `architect` | `hooked-ux` | Engagement-loop consideration at architecture level |
| `priorities.includes('devex')` | `test-engineer` | `playwright-pro` | E2E test generation and flaky test fixing |
| `priorities.includes('devex')` | `test-engineer` | `api-test-suite-builder` | API route scanning → test suite generation |
| `priorities.includes('devex')` | `high-engineer` | `monorepo-navigator` | Turborepo/Nx/pnpm workspace management |
| `priorities.includes('devex')` | `cloud-architect` | `cicd-pipeline-builder` | CI/CD pipeline generation |
| `priorities.includes('data-integrity')` | `architect` | `database-designer` | Data model design for integrity |

### 4.6 Always-On Optional Rules

These fire regardless of project answers — stack-independent quality baseline:

| Agent | Skill | Reason |
|---|---|---|
| `architect` | `senior-architect` | Architecture review persona for complex decisions |
| `architect` | `design-everyday-things` | Don Norman's foundational design principles |
| `architect` | `stitch-ideate` | Design ideation capability |
| `architect` | `stitch-orchestrator` | Multi-component design orchestration |
| `architect` | `ui-ux-pro-max` | Design generation engine |
| `high-architect` | `senior-architect` | Architecture review persona for escalated decisions |
| `backend-engineer` | `api-design-reviewer` | REST API linting and breaking change detection |
| `code-reviewer` | `tech-debt-tracker` | Technical debt scanner and prioritizer |
| `high-engineer` | `incident-commander` | Incident response playbook for production issues |
| `high-engineer` | `tech-debt-tracker` | Technical debt scanning for escalated refactoring |
| `high-engineer` | `monorepo-navigator` | Monorepo navigation for escalated work |
| `planner` | `codebase-onboarding` | Auto-generate onboarding docs from codebase analysis |
| `planner` | `runbook-generator` | Codebase → operational runbooks |
| `reviewer` | `changelog-generator` | Auto-generate changelogs from git history |
| `reviewer` | `release-manager` | Release review coordination |
| `cloud-architect` | `release-manager` | Release orchestration |
| `designer` | `design-everyday-things` | Foundational design principles |
| `designer` | `hooked-ux` | Habit-forming design patterns |

### 4.7 Exclusion Rules

These agents must never receive Optional skills regardless of answers. The recommendation function filters them before the approval step.

- `dispatcher`
- `builder`
- `plan-reviewer`
- `low-engineer`
- `low-task-worker`
- `low-architect`
- `low-designer`

---

## 5. Quality Gate

The quality gate filters the recommendation output to only include skills from verified sources. The quality-gated pool contains **38 Optional skills** from 4 sources. Every skill in the pool has passed all gate criteria.

**Gate criteria (all must pass):**

| Criterion | Threshold |
|---|---|
| Repository stars | ≥ 1,000 GitHub stars **OR** skill is from an official provider |
| Last commit age | ≤ 18 months |
| Issue response | Maintainer responded to at least one issue in last 6 months |
| Supply chain | Not flagged in OSV / npm audit / GitHub Security Advisory |
| License | MIT, Apache 2.0, BSD, MPL-2.0, or equivalent permissive |

The quality-gated pool is loaded from `framework/skills-registry.json` via `loadSkillsRegistry()`. The `filterByQualityGate()` function removes any recommended skill not in the pool.

Full per-source verification results are in `skills-registry.md` Section 3.

---

## 6. Approval UX

### 6.1 Summary Display

After quality gate filtering, the init wizard presents the recommendation table:

```
─────────────────────────────────────────────────
  OOWL — Recommended Optional Skills
─────────────────────────────────────────────────

  Based on your answers (Next.js full-stack, Cloudflare, Neon, Security priority):

  agent                  skill                         reason
  ─────────────────────  ────────────────────────────  ─────────────────────────────────
  frontend-engineer      stitch-react-components       React/Next.js project detected
  frontend-engineer      stitch-shadcn-ui              React/Next.js project detected
  frontend-engineer      playwright-pro                DevEx priority
  cloud-architect        aws-solution-architect        Cloud deployment detected
  cloud-architect        observability-designer        Cloud deployment detected
  cloud-architect        incident-commander            Cloud deployment detected
  cloud-architect        cicd-pipeline-builder         DevEx priority
  cloud-architect        release-manager               Cloud deployment detected
  backend-engineer       api-design-reviewer           Security priority + baseline
  backend-engineer       dependency-auditor            Security priority
  backend-engineer       performance-profiler          Performance baseline
  database-engineer      (none recommended)            —
  architect              senior-architect              Architecture quality baseline
  architect              database-designer             Database in project
  architect              hooked-ux                     Engagement priority
  code-reviewer          tech-debt-tracker             Code review quality baseline
  code-reviewer          api-design-reviewer           API review during code review
  reviewer               release-manager               Release coordination
  reviewer               changelog-generator           Changelog baseline
  test-engineer          playwright-pro                DevEx priority
  test-engineer          api-test-suite-builder        DevEx priority
  high-engineer          performance-profiler          Escalated performance
  high-engineer          incident-commander            Incident response baseline
  high-engineer          tech-debt-tracker             Escalated tech debt scanning
  high-engineer          monorepo-navigator            DevEx priority
  high-architect         senior-architect              Escalated architecture
  high-architect         observability-designer        Escalated observability
  high-architect         incident-commander            Escalated incident response
  ─────────────────────  ────────────────────────────  ─────────────────────────────────
  28 Optional skills across 11 agents

─────────────────────────────────────────────────

? How do you want to proceed?
  ❯ Approve all — wire these skills now
    Edit — review and toggle individual skills
    Deny all — skip Optional skills (Required skills still apply)
```

### 6.2 Edit Mode

If the user selects **Edit**, a per-agent checkbox list is presented. Non-recommended quality-gated skills are visible and selectable:

```
? frontend-engineer — select Optional skills to enable:
  ◉ stitch-react-components — React/Next.js project detected
  ◉ stitch-shadcn-ui — React/Next.js project detected
  ◉ playwright-pro — DevEx priority
  ◯ stitch-react-native-components — (available, not recommended for your answers)
  ◯ stitch-swiftui-components — (available, not recommended for your answers)
```

Edit mode includes a "Change project answers" option that re-runs Section 3.5 (Parsed-Answers Confirmation in edit mode), which returns to Path B questions pre-populated with current answers. On confirmation, the recommendation pass re-runs.

### 6.3 Deny All

Writes `optionalSkills: {}` to `.oowl.json` and writes no `agent.*.permission.skill` entries to `opencode.jsonc`. Required Phase 1B skills (hardcoded in `superpowers.md`) are unaffected. Skill source installation (Step 8) still proceeds — the repos are cloned regardless of Optional skill approval.

---

## 7. Persistence

### 7.1 `.oowl.json` Schema

Approved Optional skills are persisted in `.oowl.json`:

```json
{
  "version": "1.0.0",
  "location": "local",
  "profile": "balanced",
  "opencodeGo": true,
  "optionalSkills": {
    "frontend-engineer": ["stitch-react-components", "stitch-shadcn-ui", "playwright-pro"],
    "cloud-architect": ["aws-solution-architect", "observability-designer", "incident-commander", "cicd-pipeline-builder", "release-manager"],
    "backend-engineer": ["api-design-reviewer", "dependency-auditor", "performance-profiler"],
    "architect": ["senior-architect", "database-designer", "hooked-ux"],
    "code-reviewer": ["tech-debt-tracker", "api-design-reviewer"],
    "reviewer": ["release-manager", "changelog-generator"],
    "test-engineer": ["playwright-pro", "api-test-suite-builder"],
    "high-engineer": ["performance-profiler", "incident-commander", "tech-debt-tracker", "monorepo-navigator"],
    "high-architect": ["senior-architect", "observability-designer", "incident-commander"]
  },
  "projectAnswers": {
    "projectType": "fullstack",
    "frontend": "next",
    "cloud": "cloudflare",
    "database": "neon",
    "priorities": ["security", "performance"]
  }
}
```

`.oowl.json` is the source of truth for re-runs. `opencode.jsonc` is the operational artifact read by OpenCode. These are kept in sync.

### 7.2 opencode.jsonc Agent Permissions

After writing `.oowl.json`, the init process writes to `.opencode/opencode.jsonc` under `agent.<name>.permission.skill`. For each agent with approved Optional skills:

```jsonc
"agent": {
  "frontend-engineer": {
    "permission": {
      "skill": {
        "stitch-react-components": "allow",
        "stitch-shadcn-ui": "allow",
        "playwright-pro": "allow"
      }
    }
  },
  "cloud-architect": {
    "permission": {
      "skill": {
        "aws-solution-architect": "allow",
        "observability-designer": "allow",
        "incident-commander": "allow",
        "cicd-pipeline-builder": "allow",
        "release-manager": "allow"
      }
    }
  }
}
```

The write is idempotent. On re-run, the entire `permission.skill` block for each agent is replaced with the new approval — not appended.

**Why `opencode.jsonc` instead of `superpowers.md` patching:** Native OpenCode schema — no fragile regex/string manipulation. Survives `superpowers.md` format changes. Access control (allow/deny/ask) is the correct semantic for Optional skill permission.

### 7.3 opencode.jsonc Plugin Entries

`oowl init` also adds third-party plugin entries to the installed `opencode.jsonc` via `addThirdPartyPlugins()`. The framework source contains only 2 built-in plugins; the installed copy has 5 after init:

```jsonc
// Installed .opencode/opencode.jsonc — after oowl init
"plugin": [
  "superpowers@git+https://github.com/obra/superpowers.git",
  "caveman@git+https://github.com/julius.brussee/caveman.git",
  "claude-skills@git+https://github.com/alirezarezvani/claude-skills.git",
  "stitch-kit@git+https://github.com/gabelul/stitch-kit.git",
  "wondelai-skills@git+https://github.com/wondelai/skills.git"
]
```

The first 2 entries are from the framework source (written by `oowl install`). The last 3 are added by `oowl init`. Entries are deduplicated by source name prefix on re-run.

### 7.4 Source of Truth Table

| Layer | File | Who writes it | Content |
|---|---|---|---|
| Required skills (always-on) | `superpowers.md` | Phase 1B implementation | Unconditional skill rows |
| Optional skills (project-specific) | `opencode.jsonc` | `oowl init` | `agent.*.permission.skill` allow entries |
| Third-party plugin entries | `opencode.jsonc` | `oowl init` (`addThirdPartyPlugins()`) | 3 git+https:// plugin entries |
| Approval record | `.oowl.json` | `oowl init` | `optionalSkills` + `projectAnswers` |
| Cloned skill repos | `.opencode/plugins/` | `oowl init` (`runSkillSourceInstalls()`) | 3 git repos |
| Architecture principles | `opencode.jsonc` `instructions` | Phase 2 | `architecture-principles.md` auto-included in context |

---

## 8. Skill Source Installation

After approval and persistence, `oowl init` installs the skill source repositories. This runs regardless of whether Optional skills were approved or denied — the repos provide the skill files that OpenCode needs at runtime.

### 8.1 Git Repositories (3 repos)

Three repositories are cloned into `.opencode/plugins/` via `git clone --depth 1`:

```bash
# Implemented in runSkillSourceInstalls() — runs at user runtime during oowl init
git clone --depth 1 https://github.com/alirezarezvani/claude-skills.git ".opencode/plugins/claude-skills"
git clone --depth 1 https://github.com/gabelul/stitch-kit.git ".opencode/plugins/stitch-kit"
git clone --depth 1 https://github.com/wondelai/skills.git ".opencode/plugins/wondelai-skills"
```

Already-cloned repos are skipped (idempotent). All clones are non-interactive — no prompts.

### 8.2 CLI Tool (ui-ux-pro-max)

The ui-ux-pro-max skill is installed via npm:

```bash
npm install -g uipro-cli && uipro init --ai opencode
```

The `--ai opencode` flag configures the tool for OpenCode integration. This is non-interactive.

### 8.3 Restart Prompt

After all installations complete, `oowl init` prints:

```
─────────────────────────────────────────────────
  ✓ Skill sources installed successfully.

  Installed:
    • claude-skills (23 skills)
    • stitch-kit (9 skills)
    • wondelai-skills (5 skills)
    • ui-ux-pro-max (1 skill)

  ⚠  Restart your OpenCode session to load the new skills.
─────────────────────────────────────────────────
```

---

## 9. Re-run Path

### 9.1 Standard Re-run

Running `oowl init` in a project that already has `.oowl.json`:

1. Read `.oowl.json` for `projectAnswers` and current `optionalSkills`
2. Show confirmation display with existing answers (Step 2)
3. Run recommendation pass with current `projectAnswers`
4. Diff recommended vs. currently active skills — highlight additions and removals
5. Present approval UX with current selections pre-checked
6. On approval: update `.oowl.json` and regenerate `opencode.jsonc` agent permissions
7. Re-run skill source installation (skips already-cloned repos)
8. Prompt restart

### 9.2 Diff Output

```
  NEW skills available (not previously in your config):
  + frontend-engineer    stitch-shadcn-ui    shadcn/ui detected in codebase

  CURRENT skills (already active):
  ✓ frontend-engineer    stitch-react-components
  ✓ cloud-architect      aws-solution-architect
  ...
```

### 9.3 oowl init --reset

Clears all Optional skill selections and re-runs the full questionnaire from scratch. Use when the project type has fundamentally changed.

### 9.4 oowl init --list

Displays currently configured Optional skills from `.oowl.json` without running the questionnaire.

### 9.5 oowl init --apply

Re-writes `opencode.jsonc` agent permissions from `.oowl.json` without re-running the questionnaire. Use after manual `.oowl.json` editing.

---

## 10. Edge Cases

### 10.1 Non-Interactive / CI Environment

**Problem:** CI or scripted installs piped to non-TTY cause `@inquirer/prompts` to fail.

**Resolution:** Detect non-TTY before asking questions. Skip questionnaire entirely and write `optionalSkills: {}` to `.oowl.json` with no agent permission entries. Skill source installation (Step 8) still proceeds. User runs `oowl init` manually in interactive mode when ready.

### 10.2 Git Clone Failure

**Problem:** Network issues cause `git clone --depth 1` to fail.

**Resolution:** Each clone is independent. Already-cloned repos are skipped on re-run. Failed clones print a non-blocking warning. The `opencode.jsonc` permission entries are still written — agents have silent-skip behavior for skills not found on disk.

### 10.3 Global Install

**Problem:** `oowl install global` — no project-level `.opencode/` to check.

**Resolution:** `oowl init` is local-only. After a global install the user must `cd` to a project with a local install before running `oowl init`. There is no `oowl init global`.

### 10.4 User Adds Skills Beyond Recommendation

**Problem:** User wants a skill not in the recommendation — `opencode.jsonc` lacks the permission entry.

**Resolution:** User adds the skill via `oowl init` edit mode or direct `.oowl.json` edit + `oowl init --apply`.

### 10.5 Excluded Agents Receive Permissions

**Problem:** `opencode.jsonc` permission write could add entries for agents that must not have skills (dispatcher, builder, etc.).

**Resolution:** Recommendation function exclusion rules (Section 4.7) prevent these agents from appearing in recommendations. `writeAgentPermissions()` also validates against the exclusion list before writing.

### 10.6 opencode.jsonc Schema Changes

**Problem:** Future OpenCode versions change the `agent.*.permission.skill` schema.

**Resolution:** Use JSON parsing (not regex/string manipulation) to read and write `opencode.jsonc`. The `cleanJsonc()` character-by-character parser handles URLs inside strings correctly. Validate the written output before saving. Pin `opencode` version in `package.json`.

---

## 11. Implementation

### 11.1 New Files

| File | Purpose |
|---|---|
| `src/commands/init.ts` | `oowl init` command — prerequisite check, hybrid discovery, recommendation, approval, persistence, skill source installation, restart prompt |
| `src/lib/skill-recommender.ts` | `loadSkillsRegistry()`, `getQualityGatedSkills()`, `recommend()` function, `filterByQualityGate()` function |
| `src/lib/opencode-config-writer.ts` | `writeAgentPermissions()`, `addThirdPartyPlugins()`, `cleanJsonc()` — idempotent write to `opencode.jsonc` |

### 11.2 Modified Files

| File | Change |
|---|---|
| `src/commands/install.ts` | Framework setup + profile selection only. No skill source installs. No `--with-skills` flag. |
| `src/lib/installer.ts` | Extend `.oowl.json` schema with `optionalSkills` and `projectAnswers` keys |
| `src/index.ts` | Register `init` command; ensure `install` is registered separately |

### 11.3 Implementation Steps

**Step 1 — `ProjectAnswers` type and questionnaire**
File: `src/commands/init.ts`
- `ProjectAnswers` interface
- `askProjectQuestions(): Promise<ProjectAnswers>` — 5-question flow
- Skip Question 2 when `projectType === 'api' || projectType === 'cli'`

**Step 2 — Recommendation engine**
File: `src/lib/skill-recommender.ts` (new)
- `loadSkillsRegistry()` — reads and parses `framework/skills-registry.json`
- `getQualityGatedSkills()` — returns `Set<string>` of skill IDs where `qualityGate.passed === true`
- `recommend(answers: ProjectAnswers): SkillRecommendation` — all rules from Section 4
- `filterByQualityGate(recommendations: SkillRecommendation): SkillRecommendation`

**Step 3 — Approval UX**
File: `src/commands/init.ts`
- `showApprovalSummary(recommendations: SkillRecommendation): Promise<ApprovalResult>`
- `showEditMode(recommendations, allSkillsByAgent): Promise<ApprovalResult>`

**Step 4 — opencode.jsonc config writer**
File: `src/lib/opencode-config-writer.ts` (new)
- `writeAgentPermissions(opencodeJsoncPath: string, optionalSkills: Record<string, string[]>): void`
- `addThirdPartyPlugins(opencodeJsoncPath: string): void`
- `cleanJsonc(text: string): string` — character-by-character parser
- Idempotent: read existing JSON, merge/replace `agent.<name>.permission.skill` blocks, write back
- Validate JSON schema before writing; backup original on first write

**Step 5 — `.oowl.json` schema extension**
File: `src/lib/installer.ts`
- Add `optionalSkills` and `projectAnswers` keys to the install metadata schema

**Step 6 — Wire `oowl init` command**
File: `src/commands/init.ts`
- Prerequisite check (`.opencode/` exists?)
- Hybrid UX entry (Path A or Path B)
- Recommendation pass + quality gate filter
- Approval UX
- Write to `.oowl.json`
- Call `writeAgentPermissions()` on installed `opencode.jsonc`
- Call `addThirdPartyPlugins()` on installed `opencode.jsonc`
- Call `runSkillSourceInstalls()` — clone 3 repos + npm install uipro-cli
- Prompt restart
- Handle flags: `--reset`, `--list`, `--apply`, `--help`

**Step 7 — Register command**
File: `src/index.ts`
- Register `init` as a separate command from `install`

**Step 8 — Tests**
File: `tests/commands/init.test.ts`, `tests/lib/skill-recommender.test.ts`
- `recommend()` with various `ProjectAnswers` combinations
- `filterByQualityGate()` excluding non-gated skills
- `writeAgentPermissions()` idempotency and JSON merge correctness
- `addThirdPartyPlugins()` deduplication and merge
- `cleanJsonc()` preserving URLs inside strings, stripping comments outside
- Full init wizard flow with mocked questionnaire answers

---

## 12. Skill Extensibility Contract

New skills can be added without code changes to `oowl init`. The only required steps are adding the skill files and registering in `framework/skills-registry.json`.

### 12.1 Adding a New Skill

1. Run quality gate checks against the source repository (stars, last commit, issue response, license, supply chain).
2. If the skill passes, add the registry entry to `framework/skills-registry.json` with `qualityGate.passed: true` and `qualityGate.verifiedAt` date.
3. Add recommendation rules for the skill in Section 4 of this document and in `recommend()`.
4. If the skill comes from a new git repo, add the clone URL to `runSkillSourceInstalls()` in `src/commands/init.ts` and the plugin entry to `THIRD_PARTY_PLUGINS` in `src/lib/opencode-config-writer.ts`.
5. No changes to `oowl init` command flow are required.

---

## 13. Cross-References

- `design.md` — Implementation phases, per-agent skill assignment tables, opencode.jsonc change specifications
- `skills-registry.md` — Complete skill catalog with quality gate verification results
- `implementation.md` — Task-by-task implementation plan with verification steps
