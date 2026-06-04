# Tool Preferences

Implementation agents must use the tools and libraries already chosen by the project. If this file is customized, treat it as explicit policy. If it is not customized, infer preferences from manifests, lockfiles, config files, scripts, and existing code.

## Required Behavior

- Prefer existing dependencies, internal helpers, framework integrations, and package scripts.
- Do not introduce a new dependency, state library, test runner, styling system, ORM, logger, HTTP client, or validation library unless the approved task explicitly requires it.
- Do not introduce a second tool that overlaps an established project tool.
- Use the project's package manager and lockfile convention.
- Run the narrowest relevant existing verification command before broader checks.
- If the needed tool is missing, explain the gap and return `NEEDS_USER_INPUT` instead of silently adding a dependency.

## Never-Use Rule

If this file names discouraged or banned tools, agents must not use them. If an assigned task requires one of them, stop and ask for explicit approval.
