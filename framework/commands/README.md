# Commands

Commands are organized by purpose. The OpenCode runtime uses the file basename as the command name, so `build.md` registers as `/build`.

Commands are installed flat inside `.opencode/commands/`:

| Command | Purpose |
|---|---|
| `/design` | Start design phase |
| `/plan` | Start planning phase |
| `/check-plan` | Review implementation plan |
| `/build` | Start build phase |
| `/review` | Start review phase |
| `/domain-designer` | Direct invocation of designer specialist |
| `/domain-frontend-engineer` | Direct invocation of frontend specialist |
| `/domain-frontend-polisher` | Direct invocation of UI polish specialist |
| `/domain-backend-engineer` | Direct invocation of backend specialist |
| `/domain-database-engineer` | Direct invocation of database specialist |
| `/domain-cloud-architect` | Direct invocation of cloud specialist |
| `/domain-test-engineer` | Direct invocation of test specialist |
| `/domain-code-reviewer` | Direct invocation of code review specialist |
| `/domain-security-reviewer` | Direct invocation of security review specialist |
| `/domain-security-auditor` | Direct invocation of security audit specialist |
| `/domain-architect` | Direct invocation of architecture specialist |
| `/high-engineer` | Premium-tier escalation |
| `/high-architect` | Premium-tier escalation |
| `/high-designer` | Premium-tier escalation |
| `/low-engineer` | Bounded low-cost worker |
| `/low-task-worker` | Bounded low-cost worker |
| `/low-architect` | Bounded low-cost worker |
| `/low-designer` | Bounded low-cost worker |
