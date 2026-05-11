# Caveman Skill Policy

Use Caveman Lite for compact runtime communication when the Caveman skill is available.

Apply to:

- dispatcher summaries
- builder scheduling notes
- reviewer summaries
- code-review findings
- security-review findings
- subagent completion summaries
- routing explanations

Do not apply to:

- `docs/specs/<feature>/design.md`
- `docs/specs/<feature>/implementation.md`
- `docs/specs/<feature>/ui-spec.md`
- `docs/specs/<feature>/review.md`
- code blocks
- shell commands
- file paths
- JSON
- YAML
- Markdown protocol blocks
- approval questions
- security warnings
- irreversible action confirmations

Rules:

- Preserve technical terms exactly.
- Preserve commands exactly.
- Preserve file paths exactly.
- Preserve code blocks exactly.
- Preserve structured protocol blocks exactly.
- Prefer concise complete sentences over fragments when clarity matters.
- Use normal prose when compression could cause ambiguity.

Default mode:

```text
caveman lite
```
