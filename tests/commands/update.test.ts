import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectModifiedFiles } from '../../src/commands/update.js'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

function makeTempDir() {
  const dir = join(tmpdir(), `oowl-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('detectModifiedFiles', () => {
  it('returns empty array when all checksums match', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'file.md'), 'original content')

    const { buildChecksums } = await import('../../src/lib/checksum.js')
    const checksums = await buildChecksums(dir)

    const modified = await detectModifiedFiles(dir, checksums)
    assert.deepEqual(modified, [])
    rmSync(dir, { recursive: true })
  })

  it('detects a file that has been changed since install', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'agent.md'), 'original content')

    const { buildChecksums } = await import('../../src/lib/checksum.js')
    const originalChecksums = await buildChecksums(dir)

    // Simulate user editing the file
    writeFileSync(join(dir, 'agent.md'), 'modified content')

    const modified = await detectModifiedFiles(dir, originalChecksums)
    assert.equal(modified.length, 1)
    assert.equal(modified[0], 'agent.md')
    rmSync(dir, { recursive: true })
  })

  it('ignores model-strategy.md regardless of changes', async () => {
    const dir = makeTempDir()
    const promptsDir = join(dir, 'prompts', 'shared')
    mkdirSync(promptsDir, { recursive: true })
    writeFileSync(join(promptsDir, 'model-strategy.md'), 'original')

    const { buildChecksums } = await import('../../src/lib/checksum.js')
    const originalChecksums = await buildChecksums(dir)

    // Modify it
    writeFileSync(join(promptsDir, 'model-strategy.md'), 'changed by apply-profile')

    const modified = await detectModifiedFiles(dir, originalChecksums)
    assert.deepEqual(modified, [])
    rmSync(dir, { recursive: true })
  })

  it('reports files added since install as untracked (not in original checksums)', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'existing.md'), 'existing')

    const { buildChecksums } = await import('../../src/lib/checksum.js')
    const originalChecksums = await buildChecksums(dir)

    // Add new file after checksums were recorded
    writeFileSync(join(dir, 'new-file.md'), 'new')

    // New files are not in original checksums, so they won't appear as modified
    // (they're additions, not modifications — update will just overwrite)
    const modified = await detectModifiedFiles(dir, originalChecksums)
    assert.ok(!modified.includes('new-file.md'))
    rmSync(dir, { recursive: true })
  })
})
