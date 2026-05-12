# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/jimzandueta/oowl/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/jimzandueta/oowl/compare/v1.0.7...v1.1.0
[1.0.7]: https://github.com/jimzandueta/oowl/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/jimzandueta/oowl/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/jimzandueta/oowl/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/jimzandueta/oowl/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/jimzandueta/oowl/releases/tag/v1.0.3
