import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { updateModelLine } from './frontmatter.js'

export type TierKey = 'cheap-fast' | 'mid-balanced' | 'premium-deep'

export const TIER_AGENTS: Record<TierKey, string[]> = {
  'cheap-fast': [
    'dispatcher',
    'builder',
    'low-engineer',
    'low-task-worker',
  ],
  'mid-balanced': [
    'architect',
    'planner',
    'plan-reviewer',
    'reviewer',
    'designer',
    'frontend-engineer',
    'frontend-polisher',
    'backend-engineer',
    'database-engineer',
    'test-engineer',
    'code-reviewer',
    'security-reviewer',
    'security-auditor',
    'low-architect',
    'low-designer',
  ],
  'premium-deep': [
    'cloud-architect',
    'high-engineer',
    'high-architect',
    'high-designer',
  ],
}

export interface AgentConfig {
  model: string
  reason: string
}

export interface ProfileGlobal {
  model: string
  small_model: string
  default_agent: string
}

export interface Profile {
  profile: string
  description: string
  global: ProfileGlobal
  agent_order: string[]
  agents: Record<string, AgentConfig>
}

export function buildCustomProfile(cheapModel: string, midModel: string, premiumModel: string): Profile {
  const agents: Record<string, AgentConfig> = {}
  for (const agent of TIER_AGENTS['cheap-fast']) {
    agents[agent] = { model: cheapModel, reason: 'cheap-fast tier' }
  }
  for (const agent of TIER_AGENTS['mid-balanced']) {
    agents[agent] = { model: midModel, reason: 'mid-balanced tier' }
  }
  for (const agent of TIER_AGENTS['premium-deep']) {
    agents[agent] = { model: premiumModel, reason: 'premium-deep tier' }
  }

  return {
    profile: 'custom',
    description: `Custom profile: cheap=${cheapModel}, mid=${midModel}, premium=${premiumModel}`,
    global: {
      model: cheapModel,
      small_model: cheapModel,
      default_agent: 'dispatcher',
    },
    agent_order: [
      ...TIER_AGENTS['cheap-fast'],
      ...TIER_AGENTS['mid-balanced'],
      ...TIER_AGENTS['premium-deep'],
    ],
    agents,
  }
}

function findAgentFile(agentsDir: string, name: string): string | null {
  try {
    for (const entry of readdirSync(agentsDir)) {
      const full = join(agentsDir, entry)
      if (statSync(full).isDirectory()) {
        const found = findAgentFile(full, name)
        if (found) return found
      } else if (entry === `${name}.md`) {
        return full
      }
    }
  } catch {
    // agentsDir doesn't exist
  }
  return null
}

export async function applyProfile(profile: { agents: Record<string, { model: string }> }, openCodeDir: string): Promise<void> {
  const agentsDir = join(openCodeDir, 'agents')
  for (const [agent, cfg] of Object.entries(profile.agents)) {
    const file = findAgentFile(agentsDir, agent)
    if (!file) continue
    const content = readFileSync(file, 'utf8')
    try {
      const updated = updateModelLine(content, cfg.model)
      writeFileSync(file, updated, 'utf8')
    } catch {
      // skip files without a model line
    }
  }
}
