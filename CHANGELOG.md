# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/jimzandueta/oowl/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/jimzandueta/oowl/releases/tag/v1.0.3
