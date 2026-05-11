# Error Handling

Customize this file with your project's error handling, logging, and reporting conventions.

Examples of what to define:
- Error envelope format (e.g. structured JSON with code, message, details)
- HTTP error code conventions
- Logging levels and when to use each
- Structured logging format and required fields
- Where errors are reported (Sentry, Datadog, CloudWatch)
- Graceful degradation and fallback behavior
- Retry and circuit-breaking policies
- User-facing error messages vs internal error details

Keep this file version-controlled. It is loaded into agents that handle backend and data-layer work.
