# Architecture Principles

Distilled rules from foundational software architecture texts. Use these principles when designing, reviewing, or refactoring code.

## Enforcement

- Preserve the repository's established architecture unless the approved task explicitly changes it.
- Apply these principles to decisions inside the assigned scope; do not use them to justify unrelated rewrites.
- If existing code conflicts with these principles, make the smallest scoped improvement and report the residual risk.
- If a task requires a new boundary, cross-module contract, data ownership decision, or architectural tradeoff not covered by the approved artifacts, return `NEEDS_USER_INPUT` or `ESCALATION_REQUEST`.
- Reviewers flag changes that introduce dependency inversion violations, hidden coupling, unclear ownership, or business rules tied directly to frameworks.

## Clean Architecture

### Dependency Rule
- Source code dependencies must point inward, toward higher-level policies.
- Inner layers must never import or depend on outer layers.
- Business rules must not depend on frameworks, web handlers, database drivers, UI libraries, or external services.

### Business Rules Are Pure
- Entities and use cases contain business policy and nothing else.
- Pass plain data into use cases through request models - no framework types, no HTTP context.
- Business rules must work without a database, web server, or framework.

### Boundaries
- Define interfaces at architectural seams (repositories, gateways, presenters).
- External systems, persistence, messaging, clocks, and service clients sit behind boundaries.
- Prefer adapters over direct calls from policy code to implementation details.

### Organize by Use Case
- Structure around features and business intent, not generic technical layers.
- The architecture reveals what the application does, not what framework it uses.

---

## Domain-Driven Design

### Ubiquitous Language
- Use a shared language between code and domain experts - every term has one precise meaning.
- The model must serve business meaning first, not framework convenience.

### Bounded Contexts
- Make context boundaries explicit. Each context has its own model and ubiquitous language.
- Translate explicitly when crossing context boundaries - never share the same object across contexts.

### Entities, Value Objects, Aggregates
- **Entities** have identity that persists across changes.
- **Value Objects** are immutable and defined by their attributes, not identity.
- **Aggregates** enforce consistency boundaries - one aggregate root per transaction.
- Protect invariants inside the aggregate; never leave consistency rules to callers.

### Domain Services vs Application Services
- **Domain Services** hold domain logic that doesn't naturally fit on an entity or value object.
- **Application Services** orchestrate use cases (coordinate entities, gateways, domain services) - they contain no domain logic.

---

## Designing Data-Intensive Applications

### Storage & Retrieval
- Understand your access patterns before choosing a storage engine (row-store vs column-store, B-tree vs LSM-tree).
- OLTP and OLAP have fundamentally different access patterns - don't use the same schema for both.

### Replication & Partitioning
- **Replication** provides fault tolerance and read scaling. Choose leader-based, multi-leader, or leaderless based on consistency needs.
- **Partitioning** (sharding) distributes data across nodes. Choose hash-based or range-based on query patterns.
- Understand the trade-off: consistency vs availability vs partition tolerance.

### Transactions
- Use transactions for multi-object operations that must be atomic.
- Know the difference between read-committed, snapshot isolation, and serializable.
- Avoid distributed transactions where possible - prefer idempotent operations and sagas.

### Consistency Models
- **Strong consistency**: slow but simple to reason about.
- **Eventual consistency**: fast but requires handling stale reads.
- Use idempotent operations and conflict resolution strategies for eventually consistent systems.

---

## Pragmatic Programmer

### DRY - Don't Repeat Yourself
- Every piece of knowledge must have one unambiguous representation in the system.
- Duplication is waste - extract shared logic, not only identical code.

### Orthogonality
- Changes in one module must not cascade to unrelated modules.
- Design components that are independent - each change affects one thing.

### Tracer Bullets vs Prototypes
- **Tracer bullets**: build end-to-end skeletons early, then fill in details. You always have something working.
- **Prototypes**: throwaway exploration. Learn something specific, then discard.

### Design by Contract
- Document and enforce preconditions, postconditions, and invariants.
- A module declares behavior and is held to that contract.

### The Right Tool
- Choose tools (languages, frameworks, databases) based on the job, not familiarity.
- Be willing to learn a new tool when the current one fights the problem domain.

### Refactoring
- Refactor early, refactor often. Small continuous improvements beat big rewrites.
- Never let bit rot accumulate - fix each problem as you encounter it.
