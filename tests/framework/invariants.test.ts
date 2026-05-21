import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readFramework(path: string): string {
  return readFileSync(join(root, 'framework', path), 'utf8')
}

describe('framework invariants', () => {
  it('keeps dispatcher delegation-first constraints explicit', () => {
    const dispatcher = readFramework('agents/01-orchestration/dispatcher.md')
    const routing = readFramework('prompts/shared/routing.md')

    assert.match(dispatcher, /Delegation-First Rule/)
    assert.match(dispatcher, /first operational step must be Task delegation/)
    assert.match(dispatcher, /using the user's request text only/)
    assert.match(routing, /Delegation-First Invariant/)
    assert.match(routing, /dispatcher.*delegates before doing project work itself/i)
  })

  it('preserves scheduler and dispatch ownership boundaries', () => {
    const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')

    assert.match(agents, /Only `dispatcher` may invoke the Task tool/)
    assert.match(agents, /`builder` is scheduler-only/)
    assert.match(agents, /implementation agents execute/)
    assert.match(agents, /reviewer verifies/)
  })

  it('keeps approval gates and protected artifacts documented', () => {
    const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
    const routing = readFramework('prompts/shared/routing.md')

    assert.match(agents, /After design artifacts are created, `dispatcher` asks for user approval/)
    assert.match(agents, /After `implementation.md` is created and `plan-reviewer` returns `PLAN_APPROVED`/)
    assert.match(routing, /implementation agents may read `docs\/specs\/\*\*` but must not modify it/)
  })
})
