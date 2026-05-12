# Git Branch Workflow

`dispatcher` owns Git branch setup and final branch handoff for substantial workflows. Other agents must not create, switch, or merge branches unless their task prompt explicitly assigns that work.

## Start-of-Workflow Branch Gate

Before dispatching `architect` for a substantial workflow:

1. Check whether the current directory is inside an active Git worktree:
   - `git rev-parse --is-inside-work-tree`
2. If the command fails or returns anything other than `true`, record `Git branch gate: skipped, no active Git worktree` and continue to `architect`.
3. If inside a Git worktree, inspect the current branch:
   - `git branch --show-current`
4. Ask the user whether to:
   - create a new feature branch for the workflow, or
   - continue on the current branch.
5. If the user chooses the current branch, record the branch state and continue to `architect`.
6. If the user chooses a new branch:
   - derive a branch name from the feature slug when available, otherwise from the user request
   - prefer `feature/<slug>` unless the user supplied a branch name
   - use lowercase letters, numbers, and hyphens in generated slugs
   - reject generated or user-supplied names that start with `-` or contain shell control characters
   - run `git switch -c <branch>`
   - if `git switch` is unavailable, use `git checkout -b <branch>`
   - if the branch already exists, ask whether to choose a different branch name or continue on the existing current branch
   - record the original branch and created feature branch before dispatching `architect`

If the repository is in detached HEAD, state that clearly in the branch question. Prefer creating a named feature branch before continuing, but allow the user to continue if they explicitly choose that.

## End-of-Workflow Branch Handoff

After reviewer approval and before the final user-facing completion summary:

1. State that the feature was created.
2. If no feature branch was created by `dispatcher`, summarize the current branch state and finish.
3. If `dispatcher` created a feature branch, ask the user whether to:
   - merge the feature branch to `main` now,
   - leave the branch for them to merge manually, or
   - continue working on the same feature branch.
4. If the user chooses manual merge or continuing on the feature branch, record that choice in the final summary and do not switch branches.
5. If the user chooses merge to `main` now:
   - run `git status --short`
   - if the worktree has uncommitted changes, do not switch or merge automatically; explain that OOWL does not commit or stash changes by default and leave the user on the feature branch
   - verify `main` exists before switching to it
   - if the worktree is clean, switch to `main` and merge the feature branch

If `main` does not exist, ask the user for the merge target branch instead of guessing.

## Safety Rules

- Never create a branch without explicit user approval.
- Never merge without explicit user approval after review approval.
- Never commit, stash, reset, rebase, force-push, or delete a branch as part of this workflow unless the user explicitly asks for that separate action.
- If a Git command fails, stop the Git branch handoff, report the command and failure, and keep the workflow artifacts intact.
