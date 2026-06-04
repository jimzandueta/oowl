# Error Handling

Agents that touch backend, data-layer, integration, or user-facing failure paths must preserve the project's existing error-handling model. If this file is customized, treat it as explicit policy. If it is not customized, infer behavior from nearby handlers, services, tests, and logging code.

## Required Behavior

- Preserve existing error envelope shapes, status code conventions, exception/result patterns, and retry behavior.
- Do not expose stack traces, secrets, tokens, raw SQL, internal service names, or PII in user-facing errors.
- Log enough context for diagnosis without logging sensitive values.
- Preserve original causes when wrapping errors.
- For retriable external calls, use existing timeout, retry, idempotency, and circuit-breaker patterns.
- Add or update tests for new failure behavior when tests are appropriate.
- If the correct error convention is unclear and the change affects behavior, return `NEEDS_USER_INPUT` or `ESCALATION_REQUEST`.

## Review Focus

Reviewers must flag inconsistent error envelopes, swallowed errors, missing failure-path tests, noisy logs, and sensitive data leaks.
