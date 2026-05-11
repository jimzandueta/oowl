# Sensitive Data

Some code and data are sensitive enough that no agent may modify them without explicit user approval. This rule applies to every tier \u2014 it is not a low-tier rule.

## Sensitive Areas

These are sensitive under any circumstance:

- secrets, credentials, API keys, certificates, signing keys
- personally identifiable information (PII) and customer data
- payment data, payment processing, and regulated financial flows
- authentication and authorization logic
- IAM policies and access-control configuration
- production infrastructure and production configuration
- destructive database migrations on production-shaped data
- compliance-bound data (HIPAA, GDPR, PCI, SOC 2 controls)
- security-sensitive code (cryptography, session, token handling, signing)

## Rule

If a task touches a sensitive area, the assigned agent must:

1. State that the task touches a sensitive area.
2. Stop and return `NEEDS_USER_INPUT` for explicit user approval before continuing.
3. Proceed only after the user grants approval in the same conversation turn.

`low-tier` agents must additionally return `ESCALATION_REQUEST` rather than proceeding even with approval, because sensitive work belongs to a higher-capability agent.

## Planning Rule

`planner` must not assign sensitive-area tasks to low-tier agents. If a sensitive task appears in the plan, it must be assigned to:

- the appropriate mid-tier specialist for routine sensitive work
- `security-auditor` for deep security review of sensitive flows
- `high-architect` for cross-cutting sensitive architectural decisions

## Reviewer Rule

`code-reviewer` and `security-reviewer` must flag any change that touches a sensitive area without explicit user approval recorded in the task or review record.
