import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { updateModelLine, getModelLine } from '../../src/lib/frontmatter.js'

describe('getModelLine', () => {
  it('extracts the model from frontmatter', () => {
    const content = `---\nmodel: claude-opus-4-5\ntitle: Test\n---\nBody text\n`
    assert.equal(getModelLine(content), 'claude-opus-4-5')
  })

  it('returns null when no model line exists', () => {
    const content = `---\ntitle: Test\n---\nBody\n`
    assert.equal(getModelLine(content), null)
  })

  it('returns null when no frontmatter', () => {
    const content = `Just body text\n`
    assert.equal(getModelLine(content), null)
  })
})

describe('updateModelLine', () => {
  it('replaces model line inside frontmatter', () => {
    const content = `---\nmodel: old-model\ntitle: Test Agent\n---\nBody text here.\n`
    const result = updateModelLine(content, 'claude-sonnet-4-5')
    assert.ok(result.includes('model: claude-sonnet-4-5'))
    assert.ok(!result.includes('model: old-model'))
    assert.ok(result.includes('title: Test Agent'))
    assert.ok(result.includes('Body text here.'))
  })

  it('replaces only the first model line in frontmatter', () => {
    const content = `---\nmodel: first\nmodel: second\n---\nBody\n`
    const result = updateModelLine(content, 'new-model')
    assert.ok(result.includes('model: new-model'))
    assert.equal((result.match(/^model:/gm) || []).length, 2)
  })

  it('throws when no model line in frontmatter', () => {
    const content = `---\ntitle: No model\n---\nBody\n`
    assert.throws(() => updateModelLine(content, 'some-model'), /no model/)
  })

  it('throws when no frontmatter at all', () => {
    const content = `No frontmatter here\n`
    assert.throws(() => updateModelLine(content, 'some-model'), /no model/)
  })

  it('preserves trailing newline', () => {
    const content = `---\nmodel: old\n---\nBody\n`
    const result = updateModelLine(content, 'new')
    assert.ok(result.endsWith('\n'))
  })
})
