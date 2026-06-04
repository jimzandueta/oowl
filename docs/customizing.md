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
framework/prompts/workflow/protocols.md             — core protocol blocks
framework/prompts/workflow/routing.md               — trivial vs substantial thresholds
framework/prompts/workflow/git-workflow.md          — dispatcher branch gate and final branch handoff
framework/prompts/execution/implementation-safety.md — test-first coverage and low-tier routing safety
framework/prompts/workflow/protected-artifacts.md   — artifact ownership rules
```

## Add project conventions

Engineering prompt files define project conventions that implementation agents load:

```text
framework/prompts/engineering/code-conventions.md  — naming, imports, formatting, test conventions
framework/prompts/engineering/file-structure.md    — directory layout, file naming, asset organization
framework/prompts/engineering/tool-preferences.md  — preferred libraries, frameworks, banned tools
framework/prompts/engineering/error-handling.md    — error envelopes, logging, retry/circuit-breaking
```

Edit these files with your project's conventions. Implementation agents load them automatically.

## Change sensitive-data routing

```text
framework/prompts/execution/sensitive-data.md
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
  cli.ts                        command router
  commands/
    install.ts                  oowl install walkthrough
    init.ts                     Optional skills configuration
    profile.ts                  oowl profile wizard
    update.ts                   oowl update with checksum diffing
  lib/
    installer.ts                file copy and .oowl.json
    frontmatter.ts              update model: lines in agent files
    profiles.ts                 apply JSON profile to install
    checksum.ts                 SHA-256 tracking
    opencode-config-writer.ts   write installed opencode.jsonc permissions
    opencode-scanner.ts         detect connected OpenCode models
    paths.ts                    framework and install dir resolution
    skill-recommender.ts        Optional skill recommendations

framework/                      bundled files shipped with the package
  agents/                       23 agents in 6 classes
  commands/                     23 slash commands
  prompts/                      grouped workflow, execution, engineering, review, runtime, methodology prompts
  model-profiles/               free.json, low.json, balanced.json, high.json
  profile-models.json           bundled default active profile
  AGENTS.md                     workflow definition template
  opencode.jsonc                runtime config template

scripts/
  apply-profile-models.sh       legacy shell script (power users)
```
