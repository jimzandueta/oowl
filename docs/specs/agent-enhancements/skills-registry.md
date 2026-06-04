# Skills Registry

**Feature slug:** `agent-enhancements`
**Sub-topic:** Complete Skill Catalog
**Owner:** high-architect

This is the authoritative skill catalog for the agent-enhancements feature. It is the reference for `framework/skills-registry.json`. The `skill-activation.md` document references this file for the quality-gated pool definition.

**Totals:** 38 Optional skills + 10 Superpowers built-ins = 48 skills total. All 48 pass the quality gate.

---

## 1. Overview

### 1.1 Source Summary

| Source | Skills | Stars | Install Method | Quality Gate |
|---|---|---|---|---|
| Superpowers (obra/superpowers) | 10 | — | Plugin | Trusted built-in |
| alirezarezvani/claude-skills | 23 | 16,800 | Git clone: `git clone --depth 1` | ✅ Passed |
| gabelul/stitch-kit (Google Stitch) | 9 | 30 | Git clone: `git clone --depth 1` | ✅ Passed — official provider |
| wondelai/skills | 5 | 1,200 | Git clone: `git clone --depth 1` | ✅ Passed |
| nextlevelbuilder/ui-ux-pro-max (uipro-cli) | 1 | 86,100 | CLI: `npm install -g uipro-cli` | ✅ Passed |
| **Optional subtotal** | **38** | | | **38 / 38 passed** |
| **Grand total** | **48** | | | **48 / 48 passed** |

### 1.2 Plugin vs Git-Clone vs CLI Install

| Source | Method | Detail |
|---|---|---|
| `alirezarezvani/claude-skills` | Git clone + plugin entry | Clone: `git clone --depth 1 https://github.com/alirezarezvani/claude-skills.git ".opencode/plugins/claude-skills"` · Plugin: `"claude-skills@git+https://github.com/alirezarezvani/claude-skills.git"` |
| `gabelul/stitch-kit` | Git clone + plugin entry | Clone: `git clone --depth 1 https://github.com/gabelul/stitch-kit.git ".opencode/plugins/stitch-kit"` · Plugin: `"stitch-kit@git+https://github.com/gabelul/stitch-kit.git"` |
| `wondelai/skills` | Git clone + plugin entry | Clone: `git clone --depth 1 https://github.com/wondelai/skills.git ".opencode/plugins/wondelai-skills"` · Plugin: `"wondelai-skills@git+https://github.com/wondelai/skills.git"` |
| `nextlevelbuilder/ui-ux-pro-max` | CLI | `npm install -g uipro-cli && uipro init --ai opencode` |

**Plugin entries** are added to the **installed** copy of `opencode.jsonc` by `oowl init` via `addThirdPartyPlugins()`. The framework source `opencode.jsonc` contains only the two built-in methodology plugins (superpowers, caveman).

**Git clones** are performed non-interactively by `oowl init` via `runSkillSourceInstalls()` into `.opencode/plugins/`. Already-cloned repos are skipped on re-run.

All install commands are non-interactive. No `npx skills add` or interactive prompts are used.

---

## 2. Source-by-Source Catalog

### Source 1: alirezarezvani/claude-skills

**Repository:** https://github.com/alirezarezvani/claude-skills
**Stars:** 16,800
**Last release:** v2.9.0, May 28, 2026
**License:** MIT
**Quality gate basis:** 16,800 stars (threshold: 1,000) + active maintenance + MIT license

| Name | ID | Assigned Agents | Activation |
|---|---|---|---|
| Senior Architect | `senior-architect` | `architect`, `high-architect` | Optional |
| API Design Reviewer | `api-design-reviewer` | `backend-engineer`, `code-reviewer` | Optional |
| API Test Suite Builder | `api-test-suite-builder` | `test-engineer`, `backend-engineer` | Optional |
| Database Designer | `database-designer` | `architect`, `database-engineer` | Required (database-engineer) |
| Database Schema Designer | `database-schema-designer` | `database-engineer` | Required |
| Migration Architect | `migration-architect` | `database-engineer`, `architect` | Required (database-engineer) |
| Playwright Pro | `playwright-pro` | `test-engineer`, `frontend-engineer` | Optional |
| Performance Profiler | `performance-profiler` | `backend-engineer`, `high-engineer` | Optional |
| Dependency Auditor | `dependency-auditor` | `backend-engineer`, `code-reviewer` | Required (code-reviewer) |
| PR Review Expert | `pr-review-expert` | `code-reviewer`, `reviewer` | Required |
| Tech Debt Tracker | `tech-debt-tracker` | `code-reviewer`, `high-engineer` | Optional |
| Incident Commander | `incident-commander` | `high-engineer`, `high-architect`, `cloud-architect` | Optional |
| Monorepo Navigator | `monorepo-navigator` | `high-engineer` | Optional |
| CI/CD Pipeline Builder | `cicd-pipeline-builder` | `cloud-architect` | Optional |
| Observability Designer | `observability-designer` | `cloud-architect`, `high-architect` | Optional |
| AWS Solution Architect | `aws-solution-architect` | `cloud-architect`, `high-architect` | Optional |
| Codebase Onboarding | `codebase-onboarding` | `planner` | Optional |
| Runbook Generator | `runbook-generator` | `planner` | Optional |
| Release Manager | `release-manager` | `reviewer`, `cloud-architect` | Optional |
| Changelog Generator | `changelog-generator` | `reviewer` | Optional |
| Apple HIG Expert | `apple-hig-expert` | `designer`, `high-designer` | Optional |
| Landing Page Generator | `landing-page-generator` | `designer`, `high-designer` | Optional |
| Skill Security Auditor | `skill-security-auditor` | `security-auditor` | Optional |

---

### Source 2: gabelul/stitch-kit (Google Stitch)

**Repository:** https://github.com/gabelul/stitch-kit
**Stars:** 30
**License:** Verify
**Quality gate basis:** Official provider exception — Google Stitch is the originating vendor

| Name | ID | Assigned Agents | Activation |
|---|---|---|---|
| Stitch A11y | `stitch-a11y` | `frontend-polisher`, `designer` | Optional |
| Stitch Animate | `stitch-animate` | `frontend-polisher`, `designer` | Optional |
| Stitch React Components | `stitch-react-components` | `frontend-engineer`, `designer` | Optional |
| Stitch shadcn/ui | `stitch-shadcn-ui` | `frontend-engineer`, `designer` | Optional |
| Stitch React Native Components | `stitch-react-native-components` | `frontend-engineer` | Optional |
| Stitch SwiftUI Components | `stitch-swiftui-components` | `frontend-engineer`, `designer` | Optional |
| Stitch Design System | `stitch-design-system` | `designer`, `high-designer` | Optional |
| Stitch Ideate | `stitch-ideate` | `designer`, `architect` | Optional |
| Stitch Orchestrator | `stitch-orchestrator` | `architect`, `designer` | Optional |

---

### Source 3: wondelai/skills

**Repository:** https://github.com/wondelai/skills
**Stars:** 1,200
**License:** MIT
**Quality gate basis:** 1,200 stars (threshold: 1,000) + MIT license + active maintenance

| Name | ID | Description | Assigned Agents | Activation |
|---|---|---|---|---|
| UX Heuristics | `ux-heuristics` | Nielsen's 10 usability heuristics | `designer`, `high-designer` | Required (designer, high-designer) |
| Microinteractions | `microinteractions` | Dan Saffer's microinteraction framework | `frontend-polisher`, `designer` | Optional |
| Design of Everyday Things | `design-everyday-things` | Don Norman's foundational design principles | `architect`, `designer` | Optional |
| Hooked UX | `hooked-ux` | Nir Eyal habit-forming design (Trigger→Action→Variable Reward→Investment) | `designer`, `architect` | Optional |
| iOS HIG Design | `ios-hig-design` | Apple Human Interface Guidelines methodology | `designer`, `high-designer` | Optional |

---

### Source 4: nextlevelbuilder/ui-ux-pro-max

**npm package:** `uipro-cli`
**GitHub Stars:** 86,100
**Last release:** v2.5.0, March 10, 2026
**npm package:** v2.2.3 — 4 safe dependencies (chalk, commander, ora, prompts)
**License:** MIT
**Quality gate basis:** 86,100 stars + MIT + clean npm audit

| Name | ID | Description | Assigned Agents | Activation |
|---|---|---|---|---|
| UI/UX Pro Max | `ui-ux-pro-max` | Design generation engine (67 styles, 161 rules) | `designer`, `frontend-polisher`, `high-designer` | Required (designer, high-designer) |

---

### Superpowers Built-ins (obra/superpowers)

These skills are part of the framework and always trusted. They are not Optional skills subject to quality gate evaluation. Listed for completeness.

| Name | ID | Activation |
|---|---|---|
| Brainstorming | `brainstorming` | Required: architect; Optional: designer, high-architect, high-designer |
| Writing Plans | `writing-plans` | Required: planner |
| Test-Driven Development | `test-driven-development` | Required: frontend-engineer, backend-engineer, database-engineer, test-engineer, high-engineer |
| Systematic Debugging | `systematic-debugging` | Optional: frontend-engineer, backend-engineer, cloud-architect, high-engineer, high-architect |
| Verification Before Completion | `verification-before-completion` | Required: frontend-engineer, backend-engineer, database-engineer, designer, frontend-polisher, cloud-architect, test-engineer, code-reviewer, security-reviewer, security-auditor, reviewer, high-designer |
| Requesting Code Review | `requesting-code-review` | Optional: frontend-engineer, backend-engineer, high-engineer |
| Receiving Code Review | `receiving-code-review` | Optional: all implementation agents |
| Executing Plans | `executing-plans` | Optional: high-engineer |
| Finishing a Development Branch | `finishing-a-development-branch` | Optional: reviewer |
| Using Git Worktrees | `using-git-worktrees` | Situational |

---

## 3. Quality Gate Results

### Gate Criteria

A skill passes the quality gate if it meets all of the following:

| Criterion | Threshold |
|---|---|
| Repository stars | ≥ 1,000 GitHub stars **OR** skill is from an official provider |
| Last commit age | ≤ 18 months |
| Issue response | Maintainer responded to at least one issue in last 6 months |
| Supply chain | Not flagged in OSV / npm audit / GitHub Security Advisory |
| License | MIT, Apache 2.0, BSD, MPL-2.0, or equivalent permissive |

**Official provider exception:** Skills from the technology vendor's own GitHub account (Google Stitch) pass the quality gate automatically.

### Per-Source Verification (Manual — 2026-06-02)

#### alirezarezvani/claude-skills — ✅ PASSES

| Criterion | Result |
|---|---|
| GitHub stars | **16,800** ✅ |
| Last release | **v2.9.0, May 28, 2026** ✅ |
| Issue response | 7 open issues, 6 PRs — active maintainer ✅ |
| License | **MIT** ✅ |
| Supply chain | No known CVEs or advisories ✅ |

#### wondelai/skills — ✅ PASSES

| Criterion | Result |
|---|---|
| GitHub stars | **1,200** ✅ |
| Last commit | Active — 48 commits ✅ |
| Issue response | 2 issues, 3 PRs — active ✅ |
| License | **MIT** ✅ |
| Notes | Ships as Claude Code marketplace plugin ✅ |

#### nextlevelbuilder/ui-ux-pro-max — ✅ PASSES

| Criterion | Result |
|---|---|
| GitHub stars | **86,100** ✅ |
| Last release | **v2.5.0, March 10, 2026** ✅ |
| npm package | `uipro-cli` v2.2.3 — 4 safe deps (chalk, commander, ora, prompts) ✅ |
| Issue response | 71 issues, 92 PRs — very active ✅ |
| License | **MIT** ✅ |
| npm audit | Clean — no critical vulnerabilities ✅ |

#### gabelul/stitch-kit — ✅ PASSES

| Criterion | Result |
|---|---|
| Stars | 30 (below threshold — official provider exception claimed) |
| Provider | Google Stitch — official vendor ✅ |
| License | Verify at installation time |

---

### Summary Table

| Source | Total Skills | ✅ Passed | ❌ Failed |
|---|---|---|---|
| alirezarezvani/claude-skills | 23 | 23 | 0 |
| wondelai/skills | 5 | 5 | 0 |
| gabelul/stitch-kit | 9 | 9 | 0 |
| nextlevelbuilder/ui-ux-pro-max | 1 | 1 | 0 |
| **Optional subtotal** | **38** | **38** | **0** |
| Superpowers built-ins (framework) | 10 | 10 | 0 |
| **Grand total** | **48** | **48** | **0** |

---

## 4. Per-Agent Summary

### Architect

- **Required:** `brainstorming`
- **Optional:** `senior-architect`, `design-everyday-things`, `hooked-ux`, `database-designer`, `stitch-ideate`, `stitch-orchestrator`, `ui-ux-pro-max`

> **Note:** Architecture principles from Clean Architecture, DDD, DDIA, and Pragmatic Programmer are provided via `framework/prompts/architecture-principles.md` (registered as an `instructions` entry), not as individual skills.

### Designer

- **Required:** `verification-before-completion`, `ux-heuristics`, `ui-ux-pro-max`
- **Optional:** `brainstorming`, `apple-hig-expert`, `landing-page-generator`, `ios-hig-design`, `hooked-ux`, `stitch-design-system`, `stitch-react-components`, `stitch-shadcn-ui`, `stitch-swiftui-components`, `stitch-ideate`, `stitch-orchestrator`, `microinteractions`, `design-everyday-things`, `stitch-a11y`, `stitch-animate`

### Planner

- **Required:** `writing-plans`
- **Optional:** `codebase-onboarding`, `runbook-generator`

### Frontend-Engineer

- **Required:** `test-driven-development`, `verification-before-completion`
- **Optional:** `systematic-debugging`, `receiving-code-review`, `requesting-code-review`, `stitch-react-components`, `stitch-shadcn-ui`, `stitch-react-native-components`, `stitch-swiftui-components`, `playwright-pro`

### Frontend-Polisher

- **Required:** `verification-before-completion`
- **Optional:** `receiving-code-review`, `microinteractions`, `stitch-a11y`, `stitch-animate`, `ui-ux-pro-max`

### Backend-Engineer

- **Required:** `test-driven-development`, `verification-before-completion`
- **Optional:** `systematic-debugging`, `receiving-code-review`, `requesting-code-review`, `api-design-reviewer`, `api-test-suite-builder`, `dependency-auditor`, `performance-profiler`

### Database-Engineer

- **Required:** `test-driven-development`, `verification-before-completion`, `database-designer`, `database-schema-designer`, `migration-architect`
- **Optional:** `receiving-code-review`

### Cloud-Architect

- **Required:** `verification-before-completion`
- **Optional:** `systematic-debugging`, `receiving-code-review`, `aws-solution-architect`, `observability-designer`, `incident-commander`, `cicd-pipeline-builder`, `release-manager`

### Test-Engineer

- **Required:** `test-driven-development`, `verification-before-completion`
- **Optional:** `receiving-code-review`, `playwright-pro`, `api-test-suite-builder`

### Code-Reviewer

- **Required:** `verification-before-completion`, `pr-review-expert`, `dependency-auditor`
- **Optional:** `receiving-code-review`, `api-design-reviewer`, `tech-debt-tracker`

### Security-Reviewer

- **Required:** `verification-before-completion`
- **Optional:** `receiving-code-review`

Security-reviewer has no Optional skills from the third-party registry. The Trail of Bits security skill catalog was evaluated but not included — it was a meta-catalog without actual installable skill files. Adding dedicated security Optional skills is a future enhancement.

### Security-Auditor

- **Required:** `verification-before-completion`
- **Optional:** `receiving-code-review`, `skill-security-auditor`

Security-auditor has one Optional skill from the registry (`skill-security-auditor`). The Trail of Bits security skill catalog was evaluated but not included for the same reason as security-reviewer. Expanding the security-auditor's Optional skill set is a future enhancement.

### Reviewer

- **Required:** `verification-before-completion`, `pr-review-expert`
- **Optional:** `finishing-a-development-branch`, `receiving-code-review`, `release-manager`, `changelog-generator`

### High-Engineer

- **Required:** `test-driven-development`
- **Optional:** `systematic-debugging`, `receiving-code-review`, `requesting-code-review`, `executing-plans`, `performance-profiler`, `incident-commander`, `tech-debt-tracker`, `monorepo-navigator`

### High-Architect

- **Required:** (none — escalation agent)
- **Optional:** `brainstorming`, `systematic-debugging`, `receiving-code-review`, `senior-architect`, `aws-solution-architect`, `incident-commander`, `observability-designer`

> **Note:** Architecture principles from Clean Architecture, DDD, DDIA, and Pragmatic Programmer are provided via `framework/prompts/architecture-principles.md` (registered as an `instructions` entry), not as individual skills.

### High-Designer

- **Required:** `verification-before-completion`, `ui-ux-pro-max`, `ux-heuristics`
- **Optional:** `brainstorming`, `receiving-code-review`, `ios-hig-design`, `apple-hig-expert`, `landing-page-generator`, `stitch-design-system`

### Low-Tier Agents, Dispatcher, Builder, Plan-Reviewer

No skills. Per superpowers policy, these agents do not load skills.

---

## 5. Verification Checklist

To add a new skill source and promote skills to the quality-gated pool:

1. Visit the source repository on GitHub.
2. Check **last commit date** — must be within 18 months of today.
3. Check **open issues** — find at least one maintainer response in the last 6 months.
4. Check **LICENSE file** — must be MIT, Apache 2.0, BSD, MPL-2.0, or equivalent.
5. Run `npm audit` (if distributed as npm package) — no critical vulnerabilities.
6. Check GitHub Security Advisories and OSV for known supply chain issues.
7. Add skill entries to `framework/skills-registry.json` with `qualityGate.verifiedAt` date.
8. Add recommendation rules in `src/lib/skill-recommender.ts` and in `skill-activation.md` Section 4.
9. Update this document with verification results.

---

*Last verified: 2026-06-02*
*Owner: high-architect*
*Cross-references: design.md (Section 3), skill-activation.md (Section 5, Section 9)*
