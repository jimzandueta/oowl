## Summary

<!-- One-sentence description of the change -->

## Motivation

<!-- Why is this change needed? Link any related issues. -->

Closes #

## Type

- [ ] Bug fix
- [ ] New agent or command
- [ ] New model profile
- [ ] Workflow / protocol change
- [ ] Documentation
- [ ] Refactor / cleanup
- [ ] CI / tooling

## Verification

- [ ] `npm test` passes (all 41 tests)
- [ ] `bash -n` passes on all shell scripts
- [ ] All JSON profiles parse cleanly (`jq -e .`)
- [ ] `bash scripts/apply-profile-models.sh balanced` succeeds
- [ ] `node bin/oowl.js --help` runs without error
- [ ] `CHANGELOG.md` updated under `## [Unreleased]`
- [ ] If a new agent was added, every model profile JSON includes it
