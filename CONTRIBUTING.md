# Contributing

Thanks for considering a contribution. This framework is small and intentionally opinionated, so please open an issue before large changes.

## Quick start

```bash
git clone https://github.com/jimzandueta/oowl.git
cd oowl
npm install

# Run tests
npm test

# Test the CLI locally
node bin/oowl.js --help
node bin/oowl.js init
```

## What lives where

- `framework/agents/` — agent prompt files. Each one declares model, tools, and permissions in YAML frontmatter.
- `framework/commands/` — slash-command definitions.
- `framework/prompts/shared/` — shared prompt fragments referenced by agents (cost-tiering, sensitive-data, routing, protocols, model-mapping, etc.).
- `framework/model-profiles/` — JSON model maps for `low`, `balanced`, and `high` cost tiers.
- `src/` — CLI source (commands: `init`, `profile`, `update`; lib modules for checksum, frontmatter, installer, profiles, opencode-scanner).
- `tests/` — unit tests using Node's built-in `node:test`.
- `scripts/` — legacy shell maintenance scripts (power users).
- `install.sh` / `uninstall.sh` — legacy direct-install scripts.

## Coding conventions

- Agent prompts use a canonical anatomy (see existing files for the section order: Role, Scope, Workflow, Output, Shared Rules, Model).
- Keep agent prompts terse; shared rules belong in `framework/prompts/shared/*.md`.
- All shell scripts must work on **bash 3.2** (macOS default). No `mapfile`, no associative arrays.
- JSON files must be valid (`jq -e . file.json`).
- Node source uses ESM (`"type": "module"`), Node ≥ 18.
- Markdown links to repo files use repo-relative paths.

## Adding a new agent

1. Create `framework/agents/<class>/<agent-name>.md` with the canonical anatomy.
2. Add the agent to **every** model profile in `framework/model-profiles/*.json` (including `agent_order` and `agents`).
3. Update `framework/agents/README.md` class index.
4. Add a corresponding command file in `framework/commands/` if direct invocation is intended.
5. Run `npm test` and verify all tests pass.

## Adding a new model profile

1. Create `framework/model-profiles/<name>.json` modeled after the existing profiles.
2. Add `<name>` to the `case` statement in `scripts/apply-profile-models.sh` for shorthand support.
3. Document any non-obvious choices in the profile's `description` field.

## Testing

Run the full test suite before opening a PR:

```bash
# Unit tests (41 cases)
npm test

# Shell syntax check
bash -n install.sh uninstall.sh scripts/apply-profile-models.sh

# JSON validity
for f in framework/model-profiles/*.json framework/profile-models.json; do
  jq -e . "$f" > /dev/null && echo "OK: $f"
done

# CLI smoke tests
node bin/oowl.js --help
node bin/oowl.js badcmd || test $? -eq 1

# npm pack dry-run (verify package contents)
npm pack --dry-run
```

CI runs all of the above automatically on every PR.

## Pull requests

- One feature or fix per PR.
- Include a brief rationale in the PR body.
- Update `CHANGELOG.md` under `## [Unreleased]`.
- Don't bump the version; maintainers do that on release.

## Licensing

By contributing you agree your work is licensed under the project's MIT license.
