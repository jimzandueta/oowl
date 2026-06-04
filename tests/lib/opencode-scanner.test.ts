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
      { id: 'opencode-go/qwen3.7-plus' },
      { id: 'openai/gpt-4o-mini' },
      { id: 'google/gemini-2.0-flash' },
    ]
    const result = classifyModels(models)
    assert.equal(result.cheap.length, 5)
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
      { id: 'opencode-go/minimax-m3' },
      { id: 'opencode/glm-5.1' },
      { id: 'opencode/grok-build-0.1' },
    ]
    const result = classifyModels(models)
    assert.equal(result.mid.length, 7)
    assert.equal(result.cheap.length, 0)
    assert.equal(result.premium.length, 0)
    assert.equal(result.unclassified.length, 0)
  })

  it('classifies known premium models correctly', () => {
    const models = [
      { id: 'anthropic/claude-sonnet-4-5' },
      { id: 'opencode/gpt-5.5' },
      { id: 'opencode/claude-opus-4-5' },
      { id: 'opencode/claude-opus-4-8' },
      { id: 'google/gemini-3.1-pro' },
      { id: 'opencode-go/qwen3.7-max' },
      { id: 'openai/o3' },
    ]
    const result = classifyModels(models)
    assert.equal(result.premium.length, 7)
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
      { id: 'opencode/minimax-m3-free' },
      { id: 'opencode/deepseek-v4-flash-free' },
      { id: 'opencode/big-pickle' },
      { id: 'opencode/mimo-v2.5-free' },
      { id: 'opencode/nemotron-3-super-free' },
      { id: 'opencode/qwen3.6-plus-free' },
    ]
    const result = classifyModels(models)
    assert.equal(result.cheap.length, 6)
    assert.equal(result.unclassified.length, 0)
  })

  it('classifies the current OpenCode Zen model API list', () => {
    const modelIds = [
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-opus-4-6',
      'claude-opus-4-5',
      'claude-opus-4-1',
      'claude-sonnet-4-6',
      'claude-sonnet-4-5',
      'claude-sonnet-4',
      'claude-haiku-4-5',
      'gemini-3.5-flash',
      'gemini-3.1-pro',
      'gemini-3-flash',
      'gpt-5.5',
      'gpt-5.5-pro',
      'gpt-5.4',
      'gpt-5.4-pro',
      'gpt-5.4-mini',
      'gpt-5.4-nano',
      'gpt-5.3-codex-spark',
      'gpt-5.3-codex',
      'gpt-5.2',
      'gpt-5.2-codex',
      'gpt-5.1',
      'gpt-5.1-codex-max',
      'gpt-5.1-codex',
      'gpt-5.1-codex-mini',
      'gpt-5',
      'gpt-5-codex',
      'gpt-5-nano',
      'grok-build-0.1',
      'deepseek-v4-flash',
      'glm-5.1',
      'glm-5',
      'minimax-m2.7',
      'minimax-m2.5',
      'kimi-k2.6',
      'kimi-k2.5',
      'qwen3.6-plus',
      'qwen3.5-plus',
      'big-pickle',
      'deepseek-v4-flash-free',
      'mimo-v2.5-free',
      'qwen3.6-plus-free',
      'minimax-m3-free',
      'nemotron-3-super-free',
    ]

    const result = classifyModels(modelIds.map(id => ({ id: `opencode/${id}` })))
    assert.deepEqual(result.unclassified, [])
  })

  it('classifies the current OpenCode Go model API list', () => {
    const modelIds = [
      'minimax-m3',
      'minimax-m2.7',
      'minimax-m2.5',
      'kimi-k2.6',
      'kimi-k2.5',
      'glm-5.1',
      'glm-5',
      'deepseek-v4-pro',
      'deepseek-v4-flash',
      'qwen3.7-max',
      'qwen3.7-plus',
      'qwen3.6-plus',
      'qwen3.5-plus',
      'mimo-v2-pro',
      'mimo-v2-omni',
      'mimo-v2.5-pro',
      'mimo-v2.5',
      'hy3-preview',
    ]

    const result = classifyModels(modelIds.map(id => ({ id: `opencode-go/${id}` })))
    assert.deepEqual(result.unclassified, [])
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
