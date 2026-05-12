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

describe('agent permissions', () => {
  it('does not put blanket edit or write denies on dispatcher', () => {
    const dispatcher = readFileSync(
      join(process.cwd(), 'framework', 'agents', '01-orchestration', 'dispatcher.md'),
      'utf8',
    )

    assert.ok(!dispatcher.includes('\n  edit: deny\n'))
    assert.ok(!dispatcher.includes('\n  write: deny\n'))
    assert.ok(dispatcher.includes('"docs/specs/**": deny'))
    assert.ok(dispatcher.includes('"AGENTS.md": deny'))
  })
})

describe('workflow routing policy', () => {
  it('centralizes test-first behavior policy in implementation-safety', () => {
    const implementationSafety = readFileSync(
      join(process.cwd(), 'framework', 'prompts', 'shared', 'implementation-safety.md'),
      'utf8',
    )
    const planner = readFileSync(
      join(process.cwd(), 'framework', 'agents', '02-artifact-owners', 'planner.md'),
      'utf8',
    )
    const planReviewer = readFileSync(
      join(process.cwd(), 'framework', 'agents', '04-review', 'plan-reviewer.md'),
      'utf8',
    )

    assert.ok(implementationSafety.includes('New or changed behavior must be planned with test-first coverage.'))
    assert.ok(implementationSafety.includes('a test-first step that creates or updates a focused automated test'))
    assert.ok(implementationSafety.includes('specific no-test rationale and manual verification plan'))
    assert.ok(planner.includes('implementation-safety.md'))
    assert.ok(planReviewer.includes('implementation-safety.md'))
  })

  it('centralizes low-tier edit limits in implementation-safety', () => {
    const implementationSafety = readFileSync(
      join(process.cwd(), 'framework', 'prompts', 'shared', 'implementation-safety.md'),
      'utf8',
    )
    const costTiering = readFileSync(
      join(process.cwd(), 'framework', 'prompts', 'shared', 'cost-tiering.md'),
      'utf8',
    )
    const lowTaskWorker = readFileSync(
      join(process.cwd(), 'framework', 'agents', '06-low-tier', 'low-task-worker.md'),
      'utf8',
    )
    const lowEngineer = readFileSync(
      join(process.cwd(), 'framework', 'agents', '06-low-tier', 'low-engineer.md'),
      'utf8',
    )
    const builder = readFileSync(
      join(process.cwd(), 'framework', 'agents', '01-orchestration', 'builder.md'),
      'utf8',
    )
    const routing = readFileSync(
      join(process.cwd(), 'framework', 'prompts', 'shared', 'routing.md'),
      'utf8',
    )

    assert.ok(implementationSafety.includes('Low-tier agents do not load Superpowers and must not be used to bypass TDD.'))
    assert.ok(implementationSafety.includes('`low-task-worker` may handle read-only checks, trivial file creation'))
    assert.ok(implementationSafety.includes('`low-engineer` may handle only tiny mechanical edits'))
    assert.ok(implementationSafety.includes('If a low-tier task would require creating or updating tests'))
    assert.ok(costTiering.includes('implementation-safety.md'))
    assert.ok(lowTaskWorker.includes('implementation-safety.md'))
    assert.ok(lowEngineer.includes('implementation-safety.md'))
    assert.ok(builder.includes('implementation-safety.md'))
    assert.ok(routing.includes('implementation-safety.md'))
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
