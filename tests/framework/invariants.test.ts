import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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

function listPromptFiles(): string[] {
  const promptsRoot = join(root, 'framework', 'prompts')
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

  walk(promptsRoot)
  return files
}

function listCommandFiles(): string[] {
  const commandsRoot = join(root, 'framework', 'commands')
  const files: string[] = []

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry.endsWith('.md') && entry !== 'README.md') {
        files.push(full)
      }
    }
  }

  walk(commandsRoot)
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

function assertSectionsInOrder(content: string, sections: string[], label: string): void {
  let lastIndex = -1
  for (const section of sections) {
    const index = content.indexOf(section)
    assert.ok(index >= 0, `${label} missing section: ${section}`)
    assert.ok(index > lastIndex, `${label} section out of order: ${section}`)
    lastIndex = index
  }
}

describe('framework invariants', () => {
  it('keeps dispatcher delegation-first constraints explicit', () => {
    const dispatcher = readFramework('agents/01-orchestration/dispatcher.md')
    const routing = readFramework('prompts/workflow/routing.md')

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
    const routing = readFramework('prompts/workflow/routing.md')

    assert.match(agents, /After design artifacts are created, `dispatcher` asks for user approval/)
    assert.match(agents, /After `implementation.md` is created and `plan-reviewer` returns `PLAN_APPROVED`/)
    assert.match(routing, /implementation agents may read `docs\/specs\/\*\*` but must not modify it/)
  })

  it('uses one plan rejection protocol token', () => {
    const protocols = readFramework('prompts/workflow/protocols.md')
    const dispatcher = readFramework('agents/01-orchestration/dispatcher.md')
    const planReviewer = readFramework('agents/04-review/plan-reviewer.md')
    const checkPlanCommand = readFramework('commands/01-workflow/check-plan.md')

    assert.match(protocols, /PLAN_REJECTED/)
    assert.doesNotMatch(protocols, /PLAN_REJECTION/)
    assert.match(dispatcher, /PLAN_REJECTED/)
    assert.match(planReviewer, /PLAN_REJECTED/)
    assert.match(checkPlanCommand, /PLAN_REJECTED/)
  })

  it('keeps prompt files grouped by category', () => {
    const promptsRoot = join(root, 'framework', 'prompts')
    const rootPromptFiles = readdirSync(promptsRoot)
      .filter(entry => entry.endsWith('.md'))
      .sort()
    const expected = [
      'README.md',
      'engineering/architecture-principles.md',
      'engineering/code-conventions.md',
      'engineering/error-handling.md',
      'engineering/file-structure.md',
      'engineering/tool-preferences.md',
      'execution/cost-tiering.md',
      'execution/implementation-safety.md',
      'execution/sensitive-data.md',
      'methodology/caveman.md',
      'methodology/superpowers.md',
      'review/plan-completeness.md',
      'review/security-review-checklist.md',
      'runtime/model-mapping.md',
      'runtime/model-strategy.md',
      'workflow/approval-gates.md',
      'workflow/dispatcher-routing.md',
      'workflow/git-workflow.md',
      'workflow/parallel-build.md',
      'workflow/protected-artifacts.md',
      'workflow/protocols.md',
      'workflow/routing.md',
      'workflow/verification.md',
    ]

    assert.deepEqual(rootPromptFiles, ['README.md'])
    assert.equal(existsSync(join(promptsRoot, 'shared')), false)
    for (const file of expected) {
      assert.equal(existsSync(join(promptsRoot, file)), true, `missing grouped prompt: ${file}`)
    }
  })

  it('keeps runtime prompt references category-qualified', () => {
    const opencode = readFramework('opencode.jsonc')
    const agentsReadme = readFramework('agents/README.md')
    const frameworkAgents = readFramework('AGENTS.md')

    assert.match(opencode, /prompts\/workflow\/dispatcher-routing\.md/)
    assert.match(opencode, /prompts\/review\/plan-completeness\.md/)
    assert.match(opencode, /prompts\/review\/security-review-checklist\.md/)
    assert.match(opencode, /prompts\/engineering\/architecture-principles\.md/)
    assert.match(agentsReadme, /\.opencode\/prompts\/execution\/cost-tiering\.md/)
    assert.match(frameworkAgents, /\.opencode\/prompts\/runtime\/model-strategy\.md/)
    assert.doesNotMatch(opencode, /prompts\/(?:dispatcher-routing|plan-completeness|security-review-checklist|architecture-principles)\.md/)
  })

  it('keeps profile script writes inside the detected framework directory', () => {
    const script = readFileSync(join(root, 'scripts', 'apply-profile-models.sh'), 'utf8')

    assert.match(script, /OPENCODE_JSONC="\$FRAMEWORK_DIR\/opencode\.jsonc"/)
    assert.match(script, /MODEL_STRATEGY="\$FRAMEWORK_DIR\/prompts\/runtime\/model-strategy\.md"/)
    assert.match(script, /ACTIVE_PROFILE="\$FRAMEWORK_DIR\/profile-models\.json"/)
    assert.match(script, /free\|low\|balanced\|high\|openai\|provider-agnostic/)
    assert.match(script, /free-data will be used in training/)
  })

  it('keeps enforcement prompts actionable', () => {
    const actionablePrompts: Record<string, RegExp[]> = {
      'prompts/engineering/code-conventions.md': [/## Required Behavior/, /## Completion Evidence/],
      'prompts/engineering/file-structure.md': [/## Placement Rules/, /## Update Rules/],
      'prompts/engineering/tool-preferences.md': [/## Required Behavior/, /## Never-Use Rule/],
      'prompts/engineering/error-handling.md': [/## Required Behavior/, /## Review Focus/],
      'prompts/workflow/dispatcher-routing.md': [/## Required Dispatch Check/, /## Escalation/],
      'prompts/review/plan-completeness.md': [/## Rejection Conditions/, /PLAN_REJECTED/],
      'prompts/review/security-review-checklist.md': [/## Review Rules/, /## Blocking Findings/],
      'prompts/engineering/architecture-principles.md': [/## Enforcement/, /return `NEEDS_USER_INPUT` or `ESCALATION_REQUEST`/],
    }

    for (const [file, requiredPatterns] of Object.entries(actionablePrompts)) {
      const content = readFramework(file)
      assert.doesNotMatch(content, /Customize this file|Examples of what to define/, `${file} is still a placeholder`)
      for (const pattern of requiredPatterns) {
        assert.match(content, pattern, `${file} missing enforcement pattern ${pattern}`)
      }
    }
  })

  it('keeps command prompts explicit about context and output', () => {
    for (const file of listCommandFiles()) {
      const content = readFileSync(file, 'utf8')

      assert.match(content, /\$ARGUMENTS/, `${file} must pass user arguments through`)
      assert.match(content, /Use the `[^`]+` prompt/, `${file} must name the target prompt`)
      assert.match(content, /Treat `\$ARGUMENTS` as/, `${file} must define argument semantics`)
      assert.match(content, /Return (only )?the required/, `${file} must define output protocol`)
    }
  })

  it('keeps prompt wording direct', () => {
    const files = [
      ...listAgentFiles(),
      ...listCommandFiles(),
      ...listPromptFiles(),
      join(root, 'framework', 'AGENTS.md'),
    ]
    const weakPattern = /\b(should|perhaps|try to|as needed|as appropriate|when possible|if possible|basically|generally|probably|ideally|ensure|make sure|top-of-class)\b|etc\./i

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      assert.doesNotMatch(content, weakPattern, `${file} contains weak prompt wording`)
    }
  })

  it('keeps shared protocol tool boundaries explicit', () => {
    const protocols = readFramework('prompts/workflow/protocols.md')

    assert.match(protocols, /Only `dispatcher` may invoke the Task tool/)
    assert.match(protocols, /No agent may:/)
    assert.match(protocols, /use `general`/)
    assert.match(protocols, /use `explore`/)
  })

  it('keeps shared batch protocol aligned with the parallel build limit', () => {
    const protocols = readFramework('prompts/workflow/protocols.md')
    const parallelBuild = readFramework('prompts/workflow/parallel-build.md')

    assert.match(protocols, /valid batch with up to 20 eligible tasks/)
    assert.match(protocols, /Max parallel: 20/)
    assert.doesNotMatch(protocols, /Max parallel: 3/)
    assert.doesNotMatch(protocols, /2-3 eligible/)
    assert.match(parallelBuild, /MAX_PARALLEL_BUILD_TASKS = 20/)
    assert.match(parallelBuild, /up to `MAX_PARALLEL_BUILD_TASKS`/)
  })

  it('keeps optional shared skills optional', () => {
    const superpowers = readFramework('prompts/methodology/superpowers.md')

    assert.doesNotMatch(superpowers, /Phase 1B/)
    assert.doesNotMatch(
      superpowers,
      /\|\s*`(?:designer|high-designer)`\s*\|\s*`ui-ux-pro-max`\s*\|\s*Required\s*\|/,
    )
    assert.match(
      superpowers,
      /\|\s*`designer`\s*\|\s*`ui-ux-pro-max`\s*\|\s*Optional - use only when installed and approved\s*\|/,
    )
    assert.match(
      superpowers,
      /\|\s*`high-designer`\s*\|\s*`ui-ux-pro-max`\s*\|\s*Optional - use only when installed and approved\s*\|/,
    )
    assert.match(superpowers, /Optional third-party skills configured by `oowl init`/)
  })

  it('documents security audit ownership in protected artifacts', () => {
    const protectedArtifacts = readFramework('prompts/workflow/protected-artifacts.md')

    assert.match(protectedArtifacts, /`security-auditor`/)
    assert.match(protectedArtifacts, /`docs\/specs\/<feature>\/security-audit\.md`/)
    assert.match(protectedArtifacts, /read-only unless explicitly assigned to produce `security-audit\.md`/)
  })

  it('keeps shared prompts free of escaped unicode artifacts', () => {
    for (const file of listPromptFiles()) {
      const content = readFileSync(file, 'utf8')
      assert.doesNotMatch(content, /\\u[0-9a-fA-F]{4}/, `${file} contains escaped unicode`)
    }
  })

  it('keeps cost-tiering free of stale model price claims', () => {
    const costTiering = readFramework('prompts/execution/cost-tiering.md')

    assert.doesNotMatch(costTiering, /DeepSeek|MiniMax|\$[0-9]/)
    assert.match(costTiering, /Mechanical dispatch is the main cost lever/)
  })

  it('keeps agent prompt sections consistent by category', () => {
    const categorySections: Record<string, string[]> = {
      '01-orchestration': [
        '## Role',
        '## Scope',
        '## Operating Boundaries',
        '## Shared Rules',
        '## Workflow',
        '## Completion',
      ],
      '02-artifact-owners': [
        '## Role',
        '## Scope',
        '## Artifact',
        '## Shared Rules',
        '## Workflow',
        '## Completion',
      ],
      '03-implementation': [
        '## Role',
        '## Scope',
        '## Handoffs',
        '## Domain Expertise',
        '## Shared Rules',
        '## Workflow',
        '## Completion',
        '## Blocked',
      ],
      '04-review': [
        '## Role',
        '## Scope',
        '## Review Boundary',
        '## Shared Rules',
        '## Workflow',
        '## Completion',
      ],
      '05-escalation': [
        '## Role',
        '## Scope',
        '## Domain Expertise',
        '## Shared Rules',
        '## Workflow',
        '## Completion',
        '## Blocked',
      ],
      '06-low-tier': [
        '## Role',
        '## Scope',
        '## Domain Expertise',
        '## Shared Rules',
        '## Workflow',
        '## Completion',
        '## Blocked',
      ],
    }

    for (const file of listAgentFiles()) {
      const content = readFileSync(file, 'utf8')
      const category = file.split(`${join('framework', 'agents')}/`)[1]?.split('/')[0]
      if (!category || !(category in categorySections)) continue
      assertSectionsInOrder(content, categorySections[category], file)

      if (category === '04-review') {
        if (file.endsWith('/plan-reviewer.md')) {
          assert.match(content, /## Decision Format/, `${file} should document decision protocol format`)
        } else {
          assert.match(content, /## Finding Format/, `${file} should document finding format`)
        }
      }
    }
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
