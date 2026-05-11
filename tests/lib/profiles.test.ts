import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TIER_AGENTS, buildCustomProfile, applyProfile } from '../../src/lib/profiles.js'
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('TIER_AGENTS', () => {
  it('has cheap-fast, mid-balanced, premium-deep tiers', () => {
    assert.ok(Array.isArray(TIER_AGENTS['cheap-fast']))
    assert.ok(Array.isArray(TIER_AGENTS['mid-balanced']))
    assert.ok(Array.isArray(TIER_AGENTS['premium-deep']))
  })

  it('includes dispatcher in cheap-fast', () => {
    assert.ok(TIER_AGENTS['cheap-fast'].includes('dispatcher'))
  })

  it('includes architect in mid-balanced', () => {
    assert.ok(TIER_AGENTS['mid-balanced'].includes('architect'))
  })

  it('includes high-engineer in premium-deep', () => {
    assert.ok(TIER_AGENTS['premium-deep'].includes('high-engineer'))
  })
})

describe('buildCustomProfile', () => {
  it('assigns cheap model to cheap-fast agents', () => {
    const profile = buildCustomProfile('cheap-model', 'mid-model', 'premium-model')
    for (const agent of TIER_AGENTS['cheap-fast']) {
      assert.equal(profile.agents[agent].model, 'cheap-model', `${agent} should be cheap-model`)
    }
  })

  it('assigns mid model to mid-balanced agents', () => {
    const profile = buildCustomProfile('cheap-model', 'mid-model', 'premium-model')
    for (const agent of TIER_AGENTS['mid-balanced']) {
      assert.equal(profile.agents[agent].model, 'mid-model', `${agent} should be mid-model`)
    }
  })

  it('assigns premium model to premium-deep agents', () => {
    const profile = buildCustomProfile('cheap-model', 'mid-model', 'premium-model')
    for (const agent of TIER_AGENTS['premium-deep']) {
      assert.equal(profile.agents[agent].model, 'premium-model', `${agent} should be premium-model`)
    }
  })

  it('sets profile name to custom', () => {
    const profile = buildCustomProfile('a', 'b', 'c')
    assert.equal(profile.profile, 'custom')
  })

  it('includes global model set to cheap model', () => {
    const profile = buildCustomProfile('cheap', 'mid', 'premium')
    assert.equal(profile.global.model, 'cheap')
  })
})

describe('applyProfile', () => {
  it('updates model lines in agent files', async () => {
    const dir = join(tmpdir(), `oowl-test-${Date.now()}`)
    const agentsDir = join(dir, 'agents', '01-test')
    mkdirSync(agentsDir, { recursive: true })

    const agentFile = join(agentsDir, 'dispatcher.md')
    writeFileSync(agentFile, `---\nmodel: old-model\ntitle: Dispatcher\n---\nBody\n`)

    const profile = {
      agents: {
        dispatcher: { model: 'new-model', reason: 'test' }
      }
    }

    await applyProfile(profile, dir)

    const updated = readFileSync(agentFile, 'utf8')
    assert.ok(updated.includes('model: new-model'))
    assert.ok(!updated.includes('model: old-model'))

    rmSync(dir, { recursive: true })
  })

  it('skips agents not found on disk without throwing', async () => {
    const dir = join(tmpdir(), `oowl-test-${Date.now()}`)
    mkdirSync(join(dir, 'agents'), { recursive: true })

    const profile = {
      agents: {
        nonexistent: { model: 'some-model', reason: 'test' }
      }
    }

    await assert.doesNotReject(() => applyProfile(profile, dir))
    rmSync(dir, { recursive: true })
  })
})
