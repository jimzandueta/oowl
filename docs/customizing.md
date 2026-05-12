# Customizing oowl

## Edit an agent prompt

Agent files are in `.opencode/agents/` (local install) or `~/.config/opencode/agents/` (global install). Edit directly for immediate effect.

If you want your changes to survive `oowl update`, choose "keep mine" when the updater detects the conflict.

To change the bundled default for all future installs, edit `framework/agents/<class>/<name>.md` and publish a new version.

## Add an agent

1. Add a `.md` file under the appropriate class in `framework/agents/`.
2. Add the agent to every profile JSON under both `agent_order` and `agents`.
3. Update `framework/agents/README.md`.
4. Add a corresponding command file in `framework/commands/` if direct invocation is intended.
5. Run `oowl profile` and verify the agent appears in the model strategy output.

## Add a slash command

Add a `.md` file under the appropriate class in `framework/commands/`. Installed commands are flattened into `.opencode/commands/`.

## Change workflow rules

```text
framework/prompts/shared/protocols.md          — core protocol blocks
framework/prompts/shared/routing.md            — trivial vs substantial thresholds
framework/prompts/shared/git-workflow.md       — dispatcher branch gate and final branch handoff
framework/prompts/shared/implementation-safety.md — test-first coverage and low-tier routing safety
framework/prompts/shared/protected-artifacts.md — artifact ownership rules
```

## Add project conventions

Four placeholder files let you define project-specific conventions that all implementation agents follow:

```text
framework/prompts/shared/code-conventions.md  — naming, imports, formatting, test conventions
framework/prompts/shared/file-structure.md    — directory layout, file naming, asset organization
framework/prompts/shared/tool-preferences.md  — preferred libraries, frameworks, banned tools
framework/prompts/shared/error-handling.md    — error envelopes, logging, retry/circuit-breaking
```

Each file starts as a blank template with a comment header. Edit it with your project's conventions. Implementation agents load these files automatically.

## Change sensitive-data routing

```text
framework/prompts/shared/sensitive-data.md
```

## Add a model profile

```bash
cp framework/model-profiles/balanced.json framework/model-profiles/my-profile.json
# edit my-profile.json with your model assignments
bash scripts/apply-profile-models.sh framework/model-profiles/my-profile.json
```

To use a shorthand name, add it to the `case` statement in `scripts/apply-profile-models.sh`.

## Repository layout

```text
bin/
  oowl.js                       CLI entry point

install.sh                      shell installer for scripted installs
uninstall.sh                    shell uninstaller

src/
  cli.js                        command router
  commands/
    init.js                     oowl init walkthrough
    profile.js                  oowl profile wizard
    update.js                   oowl update with checksum diffing
  lib/
    installer.js                file copy and .oowl.json
    frontmatter.js              update model: lines in agent files
    profiles.js                 apply JSON profile to install
    checksum.js                 SHA-256 tracking
    opencode-scanner.js         detect connected OpenCode models
    paths.js                    framework and install dir resolution

framework/                      bundled files shipped with the package
  agents/                       23 agents in 6 classes
  commands/                     23 slash commands
  prompts/shared/               shared workflow rules and policies
  model-profiles/               low.json, balanced.json, high.json
  profile-models.json           bundled default active profile
  AGENTS.md                     workflow definition template
  opencode.jsonc                runtime config template

scripts/
  apply-profile-models.sh       legacy shell script (power users)
```
