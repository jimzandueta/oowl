# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-08-31

### Added

- **`openai` model profile.** `framework/model-profiles/openai.json` maps all 23 agents to OpenAI models only: frontier `gpt-5.6-terra`/`gpt-5.6-sol` for planning, review, and escalation; `gpt-5.3-codex-spark` for coding; cheap `gpt-5.4-mini`/`gpt-5.4-fast` for mechanical and low-tier work.

### Changed

- **Model profiles refreshed for the current OpenCode Go catalog.** Retired models removed (`glm-5`, `minimax-m2.5`, `nemotron-3-super-free`, `deepseek-v4-flash-free`, `minimax-m3-free`); new models adopted (`glm-5.3`, `qwen3.8-max`, `qwen3.8-flash`, `kimi-k3`, `kimi-k2.7-code`, `grok-4.6`, `gpt-5.6-luna`, `hy3`, `hy4-preview`, `longcat-2.0`).
- **Cost-tier alignment.** `low` now uses `gpt-5.6-luna` for core reasoning at cheap pricing; `balanced` stays mid-tier; `high` uses frontier `qwen3.8-max`/`kimi-k3`/`grok-4.6`. `free` remapped to the current free models.
- **`small_model`** bumped `nemotron-3-super-free` → `nemotron-3-ultra-free` across all profiles.
- **`dispatcher` and `builder`** moved off the cheapest tier to a mid-tier model in every profile (routing and prompt-framing quality).
- **Scanner tier map** (`KNOWN_MODEL_TIERS`) and `model-mapping.md` updated to classify the new catalog by input cost.

## [2.0.1] - 2026-06-04

### Fixed

- Fixed README doc links to point at GitHub Pages (`https://jimzandueta.github.io/oowl/docs/`).
- Fixed logo image to use absolute URL so it renders on npmjs.com.
- Synced `package-lock.json` to match `package.json` version.
- Bumped version badge to `v2.0.1` (v2.0.0 was already published).

### Added

- **Skills system.** Split `oowl install` (framework setup) from `oowl init` (Optional skills wizard). New skills registry with 49 quality-gated skills across 3 community repos (taste-skill, wshobson/agents, ui-ux-pro-max). New `src/lib/skill-recommender.ts` and `src/lib/opencode-config-writer.ts` for deterministic recommendation and config wiring.
- **Prompt library restructuring.** Replaced flat `framework/prompts/shared/` with 6 categorized groups: `workflow/`, `execution/`, `methodology/`, `runtime/`, `engineering/`, `review/`. All agent and command references updated to category-qualified paths.
- **Per-agent model differentiation.** 23 agents each now get a workload-tuned model assignment in all three profiles (low, balanced, high), instead of the uniform qwen3.5-plus mid-tier default. Added `free.json` model profile.
- **Low-tier routing guard.** Explicit 5-item list of tasks `low-*` agents must never be routed for: security decisions, schema/migration, architecture, tasks spanning 5+ files, costly-to-reverse changes.
- **Batch dispatch limit raised.** `REQUEST_CONSULT_BATCH` atomic dispatch from 2–3 tasks up to 20 tasks.
- **New prompt files:** `workflow/dispatcher-routing.md`, `review/plan-completeness.md`, `review/security-review-checklist.md`, `engineering/architecture-principles.md`.
- **Free model profile.** `framework/model-profiles/free.json` for zero-cost model use.

### Changed

- **Docs overhaul.** README rewritten to stocksjs layout (centered logo, h1, tagline, 6 shields.io badges, streamlined sections). `docs/index.html` rebuilt as a single-file dark-themed SPA (2524 lines, 13 sections, 34 Lucide SVGs, scroll-reveal, copy buttons, grain overlay, reading progress bar, footer with aligned CTAs).
- **Temperature tuning.** `architect` and `designer` raised from 0.2 to 0.5 for creative exploration. `frontend-polisher` raised to 0.3. All other agents remain at 0.2.
- **Dispatcher agent expanded.** New `## Operating Boundaries` section, new `## Low-Tier Routing Guard` section.
- **New logo assets.** 8 files (`oowl-logo.png`, multi-size PNGs, favicon 16/32/ICO, apple-touch-icon) generated from the user-provided owl logo.
- **`opencode.jsonc`** now includes agent-level skill permissions (`ui-ux-pro-max` on `designer`, `high-designer`, `architect`) and a global `instructions` array referencing the 4 new prompt files.
- **All 23 agent prompts and 23 command prompts** updated with category-qualified path references.

### Fixed

- Tone/voice alignment across README and all docs/ files: removed AI-tell buzzwords, aligned trivial-fix criteria with docs, removed redundant Features section from README, fixed broken npm link in `docs/index.md`.

### Breaking

- Prompt path references changed from `shared/` prefix to category-qualified (`workflow/`, `execution/`, etc.). Existing installs must reinstall via `oowl install` or manually update references.

## [1.1.3] - 2026-05-29

### Fixed

- Tightened agent permission boundaries across all agent types. Agent frontmatter now consistently declares permission scope with proper rule ordering so protected-file denies take precedence over wildcard allows.
- Updated framework invariant tests to enforce the new permission boundary rules.

## [1.1.2] - 2026-05-21

### Fixed

- Aligned package metadata with the MIT license used by the repository.
- Added `oowl --version` and `oowl -v` support.
- Added local validation scripts for CLI smoke checks and package dry-run checks.
- Moved `security-auditor` into the premium/deep custom-profile tier.
- Hardened OpenCode model scanning by trying direct process execution before shell fallback.
- Made dispatcher delegation-first behavior explicit in dispatcher and shared routing prompts.
- Added framework invariant tests for delegation ownership, scheduler boundaries, approval gates, and protected artifacts.

## [1.1.0] - 2026-05-12

### Added

- Added a dispatcher Git branch workflow for substantial work. When a session is inside a Git worktree, `dispatcher` asks whether to create a feature branch before design starts, tracks the branch state through the workflow, and performs a post-review branch handoff when it created the branch.
- Added `framework/prompts/shared/git-workflow.md` to define branch setup, merge handoff, and Git safety rules.
- Added local/global install discovery through `.oowl.json`, allowing `oowl profile` and `oowl update` to find the active install consistently.
- Added `oowl init` flag rejection so interactive setup stays wizard-only and scripted installs stay on `install.sh`.
- Added stricter TypeScript checks for unused locals and parameters.

### Changed

- Standardized runtime installs so agents and commands are installed flat under `.opencode/agents/` and `.opencode/commands/`, while prompts and model profiles keep their runtime folders.
- Moved local runtime config to `.opencode/opencode.jsonc`; local installs no longer create a project-root `opencode.jsonc`.
- Updated `oowl init`, `oowl profile`, and `oowl update` to share install path resolution and apply profile config through the active runtime directory.
- Updated installer and updater behavior to write `.oowl.json`, preserve install checksums, support forced replacement, and keep `opencode.jsonc` installation configurable.
- Expanded dispatcher and agent permissions for the branch workflow while tightening destructive-command denies and protected artifact access.
- Updated docs to describe the flat runtime layout, dispatcher branch workflow, and current init/update behavior.
- Tightened planning, plan review, builder scheduling, and low-tier agent rules so new or changed behavior requires test-first coverage or an explicit no-test rationale and cannot be routed through low-tier agents.
- Centralized test-first coverage and low-tier routing safety in `framework/prompts/shared/implementation-safety.md`.
- Allowed `low-task-worker` to handle very trivial file creation and mechanical edits while keeping feature behavior and test-writing work on TDD-capable agents.

### Fixed

- Excluded `.oowl.json` and generated model strategy changes from update conflict detection.
- Aligned workflow docs with the current `NEEDS_USER_INPUT` protocol for blocked implementation work.
- Replaced dispatcher blanket edit/write denies with narrow protected-file denies so implementation agents launched through Task receive their edit/write tools.

## [1.0.7] - 2026-05-12

### Fixed

- Restored the `INSTALL_JSONC` guard for the installer `--no-jsonc` path.

## [1.0.6] - 2026-05-12

### Fixed

- Corrected install script handling for generated OpenCode runtime files.

## [1.0.5] - 2026-05-12

### Fixed

- Corrected global install behavior for `opencode.jsonc`.

## [1.0.4] - 2026-05-12

### Fixed

- Corrected GitHub Pages workflow rendering in the documentation site.
- Corrected global install behavior for `opencode.jsonc`.

## [1.0.3] - 2026-05-10

Initial npm release.

### Added

- `oowl init` — interactive wizard that installs the framework globally or into any project, with optional OpenCode model scanning to auto-assign cost tiers.
- `oowl profile` — switch between `low`, `balanced`, `high`, or custom cost profiles; updates agent frontmatter in place.
- `oowl update` — pulls new framework files from the installed package version, detects per-file conflicts with SHA-256 checksums, shows unified diffs, and prompts keep/overwrite per changed file.
- 23 specialized agents in 6 classes: orchestration, artifact owners, implementation, review, escalation, and low-tier.
- Three cost profiles (`low`, `balanced`, `high`) mapping agents to cheap-fast, mid-balanced, and premium-deep model tiers.
- Inter-agent protocol signals in `framework/prompts/shared/protocols.md` — 14 structured handoff signal types.
- Caveman plugin pre-configured for token-compressed inter-agent communication.
- GitHub Pages documentation site.
- MIT license.

[Unreleased]: https://github.com/jimzandueta/oowl/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/jimzandueta/oowl/compare/v1.1.3...v2.0.1
[1.1.3]: https://github.com/jimzandueta/oowl/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/jimzandueta/oowl/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/jimzandueta/oowl/compare/v1.0.7...v1.1.0
[1.0.7]: https://github.com/jimzandueta/oowl/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/jimzandueta/oowl/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/jimzandueta/oowl/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/jimzandueta/oowl/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/jimzandueta/oowl/releases/tag/v1.0.3
