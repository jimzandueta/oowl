import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hashFile, hashDir, buildChecksums } from '../../src/lib/checksum.js'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

function makeTempDir() {
  const dir = join(tmpdir(), `oowl-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('hashFile', () => {
  it('returns a hex SHA-256 string', async () => {
    const dir = makeTempDir()
    const file = join(dir, 'test.txt')
    writeFileSync(file, 'hello world')
    const hash = await hashFile(file)
    assert.match(hash, /^[0-9a-f]{64}$/)
    rmSync(dir, { recursive: true })
  })

  it('same content produces same hash', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.txt'), 'same content')
    writeFileSync(join(dir, 'b.txt'), 'same content')
    const h1 = await hashFile(join(dir, 'a.txt'))
    const h2 = await hashFile(join(dir, 'b.txt'))
    assert.equal(h1, h2)
    rmSync(dir, { recursive: true })
  })

  it('different content produces different hash', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.txt'), 'content A')
    writeFileSync(join(dir, 'b.txt'), 'content B')
    const h1 = await hashFile(join(dir, 'a.txt'))
    const h2 = await hashFile(join(dir, 'b.txt'))
    assert.notEqual(h1, h2)
    rmSync(dir, { recursive: true })
  })
})

describe('buildChecksums', () => {
  it('returns an object keyed by relative paths', async () => {
    const dir = makeTempDir()
    mkdirSync(join(dir, 'sub'), { recursive: true })
    writeFileSync(join(dir, 'file1.txt'), 'one')
    writeFileSync(join(dir, 'sub', 'file2.txt'), 'two')
    const checksums = await buildChecksums(dir)
    assert.ok('file1.txt' in checksums)
    assert.ok(join('sub', 'file2.txt') in checksums)
    assert.match(checksums['file1.txt'], /^[0-9a-f]{64}$/)
    rmSync(dir, { recursive: true })
  })
})

describe('hashDir', () => {
  it('returns a single hash representing all files', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.txt'), 'alpha')
    writeFileSync(join(dir, 'b.txt'), 'beta')
    const hash = await hashDir(dir)
    assert.match(hash, /^[0-9a-f]{64}$/)
    rmSync(dir, { recursive: true })
  })
})
