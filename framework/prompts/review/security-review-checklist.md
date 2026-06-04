# Security Review Checklist

Use this checklist when performing a security review. Every applicable finding must cite concrete evidence from code, configuration, dependency metadata, or the approved artifacts.

## Review Rules

- Do not mark an area safe without evidence.
- Treat missing evidence for a sensitive control as a verification gap.
- Flag sensitive work that lacks explicit user approval.
- Prefer specific affected files and exploit paths over generic warnings.
- Separate confirmed vulnerabilities from assumptions or recommended hardening.

## 1. Authentication & Authorization

- authentication cannot be bypassed
- authorization is enforced at every protected endpoint, resolver, job, and service boundary
- secrets, API keys, signing keys, and tokens are not hardcoded
- password hashing uses project-approved modern algorithms and parameters
- session and token handling uses secure expiry, rotation, storage, and revocation patterns

## 2. Input Validation & Output Encoding

- user input is validated for type, length, range, format, and authorization context
- output is encoded or escaped for its sink
- SQL, NoSQL, shell, template, path, and LDAP inputs are parameterized or safely constructed
- file uploads validate type, size, content, storage path, scanning, and access controls

## 3. Data Protection

- sensitive data is encrypted in transit and at rest according to project requirements
- PII is minimized, access-controlled, logged safely, and deleted or retained intentionally
- secrets are stored in approved secret managers or environment mechanisms
- backups, exports, analytics, and logs do not create unprotected sensitive copies

## 4. Dependency Security

- new dependencies are justified and do not duplicate existing tools
- lockfiles are updated consistently
- known vulnerability results or missing vulnerability checks are reported
- package scripts, postinstall hooks, and build tooling do not introduce unnecessary supply-chain risk

## 5. Configuration & Logging

- debug mode, verbose errors, permissive CORS, and test credentials are disabled for production
- logs avoid passwords, tokens, secrets, raw PII, and sensitive payloads
- error messages are user-safe and do not expose stack traces or internals
- production configuration follows least privilege

## 6. Business Logic

- sensitive actions have abuse resistance: rate limits, idempotency, replay protection, and audit trails where appropriate
- authorization checks cover object ownership, tenant boundaries, roles, and state transitions
- financial, identity, permission, and destructive flows have explicit confirmation and recovery behavior

## Blocking Findings

Flag as blocking unless the approved scope explicitly accepts the risk:

- exposed secrets or credentials
- missing authorization on protected data or actions
- injection path with reachable attacker input
- sensitive data logged or returned to unauthorized users
- production config that disables required security controls
- destructive operation without authorization, confirmation, or rollback plan
