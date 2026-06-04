import { select, confirm } from '@inquirer/prompts'
import kleur from 'kleur'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { createPatch } from 'diff'
import { FRAMEWORK_DIR } from '../lib/paths.js'
import { findOowlInstall, writeOowlJson } from '../lib/installer.js'
import { hashFile, buildChecksums } from '../lib/checksum.js'
import { applyProfile, writeProfileArtifacts } from '../lib/profiles.js'
import type { Profile } from '../lib/profiles.js'
import { writeAgentPermissions, writeAgentSkillPermissions } from '../lib/opencode-config-writer.js'
import { applyProfileJsonToJsonc } from './profile.js'

const EXEMPT_FILES = ['.oowl.json', 'prompts/runtime/model-strategy.md']

function printHelp(): void {
  console.log(`
${kleur.bold('Usage:')} oowl update

Update framework-managed OOWL files in the current install.

${kleur.bold('Options:')}
  --help, -h  Show this help message

${kleur.bold('Behavior:')}
  - Detects locally modified framework files before overwriting
  - Prompts before applying updates
  - Removes unmodified framework-managed files that are no longer shipped
`)
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

function isExemptFile(relPath: string): boolean {
  const normalized = normalizePath(relPath)
  return EXEMPT_FILES.some(exempt => normalized.endsWith(exempt))
}

export async function detectModifiedFiles(
  openCodeDir: string,
  originalChecksums: Record<string, string>,
): Promise<string[]> {
  const modified: string[] = []
  for (const [relPath, originalHash] of Object.entries(originalChecksums)) {
    if (isExemptFile(relPath)) continue
    const full = join(openCodeDir, relPath)
    if (!existsSync(full)) continue
    const currentHash = await hashFile(full)
    if (currentHash !== originalHash) {
      modified.push(relPath)
    }
  }
  return modified
}

export async function detectObsoleteFiles(
  openCodeDir: string,
  originalChecksums: Record<string, string>,
  frameworkDir: string = FRAMEWORK_DIR,
): Promise<string[]> {
  const obsolete: string[] = []
  for (const relPath of Object.keys(originalChecksums)) {
    if (isExemptFile(relPath)) continue
    const installed = join(openCodeDir, relPath)
    if (!existsSync(installed)) continue
    const source = resolveFrameworkPath(frameworkDir, relPath)
    if (!existsSync(source)) {
      obsolete.push(relPath)
    }
  }
  return obsolete
}

function findByBasename(dir: string, basename: string): string | null {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        const found = findByBasename(full, basename)
        if (found) return found
      } else if (entry === basename) {
        return full
      }
    }
  } catch {
    // Source class directories are optional during partial/package tests.
  }
  return null
}

/**
 * Resolve a relative installed path back to its absolute framework source path.
 * Agents and commands are installed flat, so those are found by basename.
 */
function resolveFrameworkPath(frameworkDir: string, installedRelPath: string): string {
  const normalized = normalizePath(installedRelPath)
  const direct = join(frameworkDir, normalized)
  if (existsSync(direct)) return direct

  if (normalized.startsWith('agents/')) {
    return findByBasename(join(frameworkDir, 'agents'), normalized.split('/').at(-1) ?? '') ?? direct
  }

  if (normalized.startsWith('commands/')) {
    return findByBasename(join(frameworkDir, 'commands'), normalized.split('/').at(-1) ?? '') ?? direct
  }

  return direct
}

function readProfileJson(filePath: string): Profile | null {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Profile
  } catch {
    return null
  }
}

function loadActiveProfile(openCodeDir: string, profileName: string): {
  profile: Profile
  source: string
} | null {
  const activeProfilePath = join(openCodeDir, 'profile-models.json')
  const activeProfile = readProfileJson(activeProfilePath)
  if (activeProfile) {
    return {
      profile: activeProfile,
      source:
        activeProfile.profile === 'custom'
          ? 'profile-models.json'
          : `model-profiles/${activeProfile.profile}.json`,
    }
  }

  const installedProfilePath = join(openCodeDir, 'model-profiles', `${profileName}.json`)
  const installedProfile = readProfileJson(installedProfilePath)
  if (installedProfile) {
    return {
      profile: installedProfile,
      source: `model-profiles/${profileName}.json`,
    }
  }

  const frameworkProfilePath = join(FRAMEWORK_DIR, 'model-profiles', `${profileName}.json`)
  const frameworkProfile = readProfileJson(frameworkProfilePath)
  if (frameworkProfile) {
    return {
      profile: frameworkProfile,
      source: `model-profiles/${profileName}.json`,
    }
  }

  return null
}

function showDiff(relPath: string, installedContent: string, newContent: string): void {
  const patch = createPatch(relPath, installedContent, newContent, 'installed', 'update')
  const lines = patch.split('\n')
  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---')) {
      console.log(kleur.bold(line))
    } else if (line.startsWith('+')) {
      console.log(kleur.green(line))
    } else if (line.startsWith('-')) {
      console.log(kleur.red(line))
    } else if (line.startsWith('@@')) {
      console.log(kleur.cyan(line))
    } else {
      console.log(line)
    }
  }
}

async function resolveConflict(relPath: string, openCodeDir: string, frameworkDir: string): Promise<string> {
  const installedPath = join(openCodeDir, relPath)
  const newPath = resolveFrameworkPath(frameworkDir, relPath)

  if (!existsSync(newPath)) return 'skip'

  const installedContent = readFileSync(installedPath, 'utf8')
  const newContent = readFileSync(newPath, 'utf8')

  if (installedContent === newContent) return 'overwrite'

  console.log(kleur.bold(`\nConflict: ${relPath}`))
  showDiff(relPath, installedContent, newContent)

  return select({
    message: 'How do you want to handle this file?',
    choices: [
      { name: 'Keep my version (skip this file)', value: 'skip' },
      { name: 'Accept the update (overwrite)', value: 'overwrite' },
    ],
  })
}

async function copyRecursiveSelective(
  src: string,
  dest: string,
  openCodeBase: string,
  skipFiles: Set<string>,
): Promise<void> {
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry)
    const isDir = statSync(srcFull).isDirectory()
    const destFull = join(dest, entry)
    const relToOpenCode = relative(openCodeBase, destFull)

    if (isDir) {
      mkdirSync(destFull, { recursive: true })
      await copyRecursiveSelective(srcFull, destFull, openCodeBase, skipFiles)
    } else {
      if (skipFiles.has(relToOpenCode)) {
        console.log(kleur.dim(`  skipped: ${relToOpenCode}`))
        continue
      }
      copyFileSync(srcFull, destFull)
    }
  }
}

async function copyFlatSelective(
  src: string,
  dest: string,
  openCodeBase: string,
  skipFiles: Set<string>,
): Promise<void> {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry)
    if (statSync(srcFull).isDirectory()) {
      await copyFlatSelective(srcFull, dest, openCodeBase, skipFiles)
    } else if (statSync(srcFull).isFile()) {
      if (entry === 'README.md') continue
      const destFull = join(dest, entry)
      const relToOpenCode = relative(openCodeBase, destFull)
      if (skipFiles.has(relToOpenCode)) {
        console.log(kleur.dim(`  skipped: ${relToOpenCode}`))
        continue
      }
      copyFileSync(srcFull, destFull)
    }
  }
}

function removeEmptyParents(filePath: string, stopDir: string): void {
  let current = dirname(filePath)
  while (current !== stopDir && current.startsWith(stopDir)) {
    try {
      rmdirSync(current)
      current = dirname(current)
    } catch {
      return
    }
  }
}

export async function update(args: string[] = []): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }

  if (args.length > 0) {
    console.error(kleur.red(`Unknown option: ${args[0]}`))
    printHelp()
    process.exitCode = 1
    return
  }

  const cwd = process.cwd()
  const install = findOowlInstall(cwd)

  if (!install) {
    console.error(kleur.red('OOWL is not installed in this directory. Run `oowl install` first.'))
    process.exitCode = 1
    return
  }

  const { oowl, openCodeDir, installRoot } = install

  console.log(kleur.bold('\nOOWL Updater\n'))

  const activeProfile = loadActiveProfile(openCodeDir, oowl.profile)

  const storedChecksums = oowl.checksums ?? {}
  const modifiedFiles = await detectModifiedFiles(openCodeDir, storedChecksums)
  const obsoleteFiles = await detectObsoleteFiles(openCodeDir, storedChecksums)

  if (modifiedFiles.length > 0) {
    console.log(kleur.yellow(`\n${modifiedFiles.length} file(s) have been modified since install:`))
    for (const f of modifiedFiles) console.log(`  ${kleur.cyan(f)}`)
    console.log()
  }

  if (obsoleteFiles.length > 0) {
    console.log(kleur.yellow(`\n${obsoleteFiles.length} framework-managed file(s) are no longer shipped:`))
    for (const f of obsoleteFiles) console.log(`  ${kleur.cyan(f)}`)
    console.log(kleur.dim('  Unmodified obsolete files will be removed during update.'))
    console.log()
  }

  // Resolve conflicts for modified files
  const decisions: Record<string, string> = {}
  for (const relPath of modifiedFiles) {
    decisions[relPath] = await resolveConflict(relPath, openCodeDir, FRAMEWORK_DIR)
  }

  const proceed = await confirm({
    message: 'Apply update now?',
    default: true,
  })

  if (!proceed) {
    console.log('Update cancelled.')
    return
  }

  console.log(kleur.dim('\nCopying updated files…'))

  const skipFiles = new Set(
    Object.entries(decisions)
      .filter(([, d]) => d === 'skip')
      .map(([f]) => f)
  )

  for (const relPath of obsoleteFiles) {
    if (skipFiles.has(relPath)) continue
    const target = join(openCodeDir, relPath)
    if (existsSync(target)) {
      rmSync(target, { force: true })
      removeEmptyParents(target, openCodeDir)
    }
  }

  for (const sub of ['agents', 'commands']) {
    const src = join(FRAMEWORK_DIR, sub)
    if (!existsSync(src)) continue
    await copyFlatSelective(src, join(openCodeDir, sub), openCodeDir, skipFiles)
  }

  for (const sub of ['prompts', 'model-profiles']) {
    const src = join(FRAMEWORK_DIR, sub)
    if (!existsSync(src)) continue
    const dest = join(openCodeDir, sub)
    mkdirSync(dest, { recursive: true })
    await copyRecursiveSelective(src, dest, openCodeDir, skipFiles)
  }

  for (const file of ['profile-models.json', 'opencode.jsonc']) {
    const src = join(FRAMEWORK_DIR, file)
    const dest = join(openCodeDir, file)
    if (existsSync(src) && !skipFiles.has(file)) {
      copyFileSync(src, dest)
    }
  }

  if (activeProfile) {
    await applyProfile(activeProfile.profile, openCodeDir)
    writeProfileArtifacts(activeProfile.profile, openCodeDir, activeProfile.source)
    applyProfileJsonToJsonc(join(openCodeDir, 'opencode.jsonc'), activeProfile.profile)
  } else {
    console.log(kleur.yellow(`Could not find active profile '${oowl.profile}' to reapply after update.`))
  }

  if (oowl.optionalSkills && Object.keys(oowl.optionalSkills).length > 0) {
    writeAgentPermissions(join(openCodeDir, 'opencode.jsonc'), oowl.optionalSkills)
    writeAgentSkillPermissions(join(openCodeDir, 'agents'), oowl.optionalSkills)
  }

  // Rebuild checksums
  const newChecksums = await buildChecksums(openCodeDir)
  oowl.checksums = newChecksums
  oowl.updatedAt = new Date().toISOString()
  writeOowlJson(installRoot, oowl)

  console.log(kleur.green('\nUpdate complete!'))
}
