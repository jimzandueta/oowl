# Code Conventions

Implementation agents must follow the project's existing coding conventions. If this file is customized, treat it as explicit policy. If it is not customized, infer conventions from the nearest relevant files before editing.

## Discovery Order

1. Follow explicit instructions in `AGENTS.md`, package scripts, formatter config, lint config, and this file.
2. Match neighboring files in the same module or feature.
3. Match repository-wide patterns only when local patterns are absent.

## Required Behavior

- Match naming style, import style, export style, test names, and file naming used nearby.
- Use existing formatters and linters instead of inventing formatting preferences.
- Keep public APIs stable unless the assigned task explicitly changes them.
- Avoid unrelated cleanup, broad reformatting, and opportunistic refactors.
- Add comments only when they clarify non-obvious behavior or constraints.
- If conventions conflict, follow the narrowest local convention and note the conflict in completion.

## Completion Evidence

When code is changed, report the checks run and any convention-sensitive choices that affected the implementation.
