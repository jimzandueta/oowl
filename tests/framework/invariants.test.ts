import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readFramework(path: string): string {
  return readFileSync(join(root, 'framework', path), 'utf8')
}

function listAgentFiles(): string[] {
  const agentsRoot = join(root, 'framework', 'agents')
  const files: string[] = []

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry.endsWith('.md')) {
        files.push(full)
      }
    }
  }

  walk(agentsRoot)
  return files
}

function getPermissionBlock(content: string, permissionType: 'edit' | 'write'): string {
  const lines = content.split('\n')
  const start = lines.findIndex(line => line.trim() === `${permissionType}:`)
  if (start === -1) return ''

  const block: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('  ') && !line.startsWith('    ')) break
    block.push(line)
  }
  return block.join('\n')
}

function assertSpecificBeforeWildcard(block: string, specificPattern: string, wildcardPattern: string): void {
  const specificIndex = block.indexOf(specificPattern)
  const wildcardIndex = block.indexOf(wildcardPattern)
  assert.ok(specificIndex >= 0, `Missing specific rule: ${specificPattern}`)
  assert.ok(wildcardIndex >= 0, `Missing wildcard rule: ${wildcardPattern}`)
  assert.ok(
    specificIndex < wildcardIndex,
    `Specific rule must appear before wildcard rule: ${specificPattern} before ${wildcardPattern}`,
  )
}

function assertWildcardLastInPermissionMap(content: string, permissionType: 'edit' | 'write'): void {
  const block = getPermissionBlock(content, permissionType)
  if (!block) return

  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^".+":\s*(allow|deny|ask)$/.test(line))

  if (lines.length === 0) return

  const wildcardIndexes = lines
    .map((line, idx) => ({ line, idx }))
    .filter(entry => /^"\*":\s*(allow|deny|ask)$/.test(entry.line))
    .map(entry => entry.idx)

  if (wildcardIndexes.length === 0) return

  const firstWildcard = Math.min(...wildcardIndexes)
  const nonWildcardAfter = lines
    .slice(firstWildcard + 1)
    .find(line => !/^"\*":\s*(allow|deny|ask)$/.test(line))

  assert.equal(
    nonWildcardAfter,
    undefined,
    `Wildcard entry in ${permissionType} map must be last in permission map block`,
  )
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

  it('orders permission maps from specific to wildcard in all agents', () => {
    const files = listAgentFiles()

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      assertWildcardLastInPermissionMap(content, 'edit')
      assertWildcardLastInPermissionMap(content, 'write')
    }
  })
})
