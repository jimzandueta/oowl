# File Structure

Implementation agents must put new code where the current project structure expects it. If this file is customized, treat it as explicit policy. If it is not customized, infer structure from the nearest relevant feature, module, or test.

## Placement Rules

- Add files inside the owning feature/module whenever one exists.
- Place tests where comparable tests already live: co-located if the repo co-locates tests, mirrored if the repo mirrors source directories.
- Use existing barrel files, route registries, dependency injection registries, and exports when the surrounding code uses them.
- Do not create new top-level folders, new architectural layers, or new naming schemes unless the approved plan explicitly requires it.
- Do not move files as cleanup unless the task explicitly includes that move.
- If no clear location exists, stop and return `NEEDS_USER_INPUT` or `ESCALATION_REQUEST` instead of inventing a structure.

## Update Rules

- When adding or moving files, update imports, exports, registrations, tests, and build configuration needed for the new location.
- Keep file locks narrow; do not claim broad directories to hide uncertain placement.
