# Parallel Build

Maximum parallel build tasks:

```text
MAX_PARALLEL_BUILD_TASKS = 3
```

## Execution Model

`builder` schedules parallel work by returning `REQUEST_CONSULT_BATCH`.

`dispatcher` performs the actual parallel dispatch by issuing all eligible Task calls in the same assistant message.

Implementation agents execute the assigned tasks.

## Wave Requirements

Every implementation wave must declare one execution mode:

```text
serial
parallel
mixed
```

Parallel and mixed waves must define explicit parallel groups.

Each task in a parallel group must include:

- target agent
- task ID
- file locks
- complete task prompt
- expected output
- verification requirements
- reason parallel-safe

## Atomic Batch Rule

`REQUEST_CONSULT_BATCH` means same-turn multi-agent dispatch.

Correct behavior:

```text
dispatcher issues Task call 1
dispatcher issues Task call 2
dispatcher issues Task call 3
all in the same assistant message
```

Incorrect behavior:

```text
dispatcher issues Task call 1
waits
dispatcher issues Task call 2
waits
dispatcher issues Task call 3
```

That is serial execution and violates the batch protocol.

## Protected Artifacts

Parallel tasks must not modify protected artifacts.

A task is not parallel-safe if its file locks include:

```text
docs/**
docs/specs/**
.
*
**/*
```

Exception: artifact owner agents may update their own artifact during the owning phase, but those tasks must not be parallelized with implementation work.

## Not Parallel-Safe

A task is not parallel-safe if:

- file locks overlap
- dependencies are incomplete
- it mutates shared contracts without coordination
- it modifies protected artifacts
- it uses broad file locks
- it requires root-scaffolding or destructive cleanup
- it touches sensitive areas that need serial review
