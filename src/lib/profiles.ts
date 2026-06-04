import { mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
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
    'low-architect',
    'low-designer',
  ],
  'premium-deep': [
    'security-auditor',
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

interface ApplicableProfile {
  agents: Record<string, { model: string }>
}

function tableCell(value: string | undefined): string {
  return (value ?? '').replace(/\n/g, ' ').replace(/\|/g, '\\|')
}

export function renderModelStrategy(
  profile: Profile,
  profileSource = 'profile-models.json',
): string {
  const order =
    profile.agent_order && profile.agent_order.length > 0
      ? profile.agent_order
      : Object.keys(profile.agents)
  const lines: string[] = [
    '# Model Strategy',
    '',
    `Profile: \`${profile.profile}\``,
    '',
  ]

  if (profile.description) {
    lines.push(profile.description, '')
  }

  lines.push(
    'This file is generated from:',
    '',
    '```text',
    profileSource,
    '```',
    '',
    'Do not edit model assignments here directly. Update a JSON profile and run:',
    '',
    '```bash',
    'scripts/apply-profile-models.sh <free|low|balanced|high|provider-agnostic|path-to-json>',
    '```',
    '',
    'The `oowl profile` command and model-profile script both update runtime agent frontmatter and this strategy file. They do not update `AGENTS.md`.',
    '',
    '## Global Settings',
    '',
    '| Setting | Value |',
    '|---|---|',
    `| model | \`${profile.global.model}\` |`,
    `| small_model | \`${profile.global.small_model}\` |`,
    `| default_agent | \`${profile.global.default_agent}\` |`,
    '',
    '## Agent Model Map',
    '',
    '| Agent | Model | Reason |',
    '|---|---|---|',
  )

  for (const agent of order) {
    const cfg = profile.agents[agent]
    if (!cfg) continue
    lines.push(
      `| \`${agent}\` | \`${cfg.model}\` | ${tableCell(cfg.reason)} |`,
    )
  }

  lines.push(
    '',
    '## Runtime Rule',
    '',
    'The runtime source of truth is each agent file frontmatter:',
    '',
    '```text',
    '.opencode/agents/<agent>.md',
    '```',
    '',
    'The selected JSON profile is materialized into those frontmatter blocks by:',
    '',
    '```bash',
    'oowl profile <free|low|balanced|high>',
    'scripts/apply-profile-models.sh',
    '```',
    '',
  )

  return `${lines.join('\n')}\n`
}

export function writeProfileArtifacts(
  profile: Profile,
  openCodeDir: string,
  profileSource = 'profile-models.json',
): void {
  writeFileSync(
    join(openCodeDir, 'profile-models.json'),
    `${JSON.stringify(profile, null, 2)}\n`,
    'utf8',
  )

  const modelStrategyPath = join(openCodeDir, 'prompts', 'runtime', 'model-strategy.md')
  mkdirSync(join(openCodeDir, 'prompts', 'runtime'), { recursive: true })
  writeFileSync(
    modelStrategyPath,
    renderModelStrategy(profile, profileSource),
    'utf8',
  )
}

export async function applyProfile(
  profile: ApplicableProfile,
  openCodeDir: string,
): Promise<void> {
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
