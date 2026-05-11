import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseModelsOutput, classifyModels } from '../../src/lib/opencode-scanner.js'

describe('parseModelsOutput (JSON)', () => {
  it('parses a JSON array of model objects', () => {
    const raw = JSON.stringify([
      { id: 'anthropic/claude-3-5-haiku', name: 'Claude 3.5 Haiku' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
    ])
    const models = parseModelsOutput(raw)
    assert.equal(models.length, 2)
    assert.equal(models[0].id, 'anthropic/claude-3-5-haiku')
    assert.equal(models[1].id, 'openai/gpt-4o')
  })

  it('extracts model ids from a JSON array of strings', () => {
    const raw = JSON.stringify(['anthropic/claude-3-5-haiku', 'openai/gpt-4o'])
    const models = parseModelsOutput(raw)
    assert.equal(models.length, 2)
    assert.equal(models[0].id, 'anthropic/claude-3-5-haiku')
  })
})

describe('parseModelsOutput (plain text)', () => {
  it('parses one model ID per line', () => {
    const raw = [
      'anthropic/claude-sonnet-4-5',
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash',
    ].join('\n')
    const models = parseModelsOutput(raw)
    assert.equal(models.length, 3)
    assert.ok(models.some(m => m.id === 'anthropic/claude-sonnet-4-5'))
    assert.ok(models.some(m => m.id === 'openai/gpt-4o-mini'))
    assert.ok(models.some(m => m.id === 'google/gemini-2.0-flash'))
  })

  it('parses columnar table output', () => {
    const raw = [
      'ID                              Provider',
      'anthropic/claude-sonnet-4-5     Anthropic',
      'openai/gpt-4o-mini             OpenAI',
      'google/gemini-2.0-flash        Google',
    ].join('\n')
    const models = parseModelsOutput(raw)
    assert.ok(models.some(m => m.id === 'anthropic/claude-sonnet-4-5'))
    assert.ok(models.some(m => m.id === 'openai/gpt-4o-mini'))
    assert.ok(models.some(m => m.id === 'google/gemini-2.0-flash'))
    assert.ok(!models.some(m => m.id === 'Provider'))
  })

  it('deduplicates model IDs appearing on multiple lines', () => {
    const raw = 'anthropic/claude-sonnet-4-5\nanthropic/claude-sonnet-4-5\n'
    const models = parseModelsOutput(raw)
    assert.equal(models.length, 1)
  })

  it('handles opencode-go prefixed model IDs', () => {
    const raw = 'opencode-go/deepseek-v4-pro\nopencode-go/deepseek-v4-flash\n'
    const models = parseModelsOutput(raw)
    assert.equal(models.length, 2)
    assert.equal(models[0].id, 'opencode-go/deepseek-v4-pro')
  })

  it('returns empty array when output has no model IDs', () => {
    assert.deepEqual(parseModelsOutput('not json'), [])
    assert.deepEqual(parseModelsOutput(''), [])
    assert.deepEqual(parseModelsOutput('No models found.'), [])
  })
})

describe('classifyModels', () => {
  it('classifies known cheap models correctly', () => {
    const models = [
      { id: 'opencode-go/deepseek-v4-flash' },
      { id: 'opencode/qwen3.5-plus' },
      { id: 'openai/gpt-4o-mini' },
      { id: 'google/gemini-2.0-flash' },
    ]
    const result = classifyModels(models)
    assert.equal(result.cheap.length, 4)
    assert.equal(result.mid.length, 0)
    assert.equal(result.premium.length, 0)
    assert.equal(result.unclassified.length, 0)
  })

  it('classifies known mid models correctly', () => {
    const models = [
      { id: 'opencode-go/deepseek-v4-pro' },
      { id: 'opencode/kimi-k2.5' },
      { id: 'anthropic/claude-haiku-4-5' },
      { id: 'openai/gpt-5.1-codex' },
    ]
    const result = classifyModels(models)
    assert.equal(result.mid.length, 4)
    assert.equal(result.cheap.length, 0)
    assert.equal(result.premium.length, 0)
    assert.equal(result.unclassified.length, 0)
  })

  it('classifies known premium models correctly', () => {
    const models = [
      { id: 'anthropic/claude-sonnet-4-5' },
      { id: 'opencode/gpt-5.5' },
      { id: 'opencode/claude-opus-4-5' },
      { id: 'google/gemini-3.1-pro' },
      { id: 'openai/o3' },
    ]
    const result = classifyModels(models)
    assert.equal(result.premium.length, 5)
    assert.equal(result.cheap.length, 0)
    assert.equal(result.mid.length, 0)
    assert.equal(result.unclassified.length, 0)
  })

  it('handles mixed tiers in one call', () => {
    const models = [
      { id: 'opencode-go/deepseek-v4-flash' },
      { id: 'anthropic/claude-haiku-4-5' },
      { id: 'anthropic/claude-opus-4-5' },
    ]
    const result = classifyModels(models)
    assert.equal(result.cheap.length, 1)
    assert.equal(result.mid.length, 1)
    assert.equal(result.premium.length, 1)
    assert.equal(result.unclassified.length, 0)
  })

  it('ignores provider prefix when matching tiers', () => {
    const models = [
      { id: 'opencode/gpt-5.5' },
      { id: 'openai/gpt-5.5' },
    ]
    const result = classifyModels(models)
    assert.equal(result.premium.length, 2)
  })

  it('classifies free models as cheap', () => {
    const models = [
      { id: 'opencode/big-pickle' },
      { id: 'opencode/nemotron-3-super-free' },
      { id: 'opencode/minimax-m2.5-free' },
    ]
    const result = classifyModels(models)
    assert.equal(result.cheap.length, 3)
    assert.equal(result.unclassified.length, 0)
  })

  it('puts unknown models in unclassified and mid as default', () => {
    const models = [
      { id: 'unknown-provider/vanilla-model' },
      { id: 'opencode-go/experimental-v0' },
    ]
    const result = classifyModels(models)
    // unknown models go to unclassified AND mid as safe default
    assert.equal(result.unclassified.length, 2)
    assert.equal(result.mid.length, 2)
    assert.equal(result.cheap.length, 0)
    assert.equal(result.premium.length, 0)
  })

  it('all models appear somewhere', () => {
    const models = [
      { id: 'opencode-go/deepseek-v4-flash' },
      { id: 'anthropic/claude-sonnet-4-5' },
      { id: 'unknown/future-v2' },
    ]
    const result = classifyModels(models)
    const total = result.cheap.length + result.mid.length + result.premium.length
    assert.equal(total, models.length)  // all models land in some classified tier
    assert.equal(result.unclassified.length, 1)
  })
})
