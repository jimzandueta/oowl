import { select, confirm } from '@inquirer/prompts'
import kleur from 'kleur'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { homedir } from 'node:os'
import { createPatch } from 'diff'
import { FRAMEWORK_DIR } from '../lib/paths.js'
import { readOowlJson, writeOowlJson, stripNumericPrefix } from '../lib/installer.js'
import { hashFile, buildChecksums } from '../lib/checksum.js'

const EXEMPT_FILES = ['prompts/shared/model-strategy.md']

export async function detectModifiedFiles(openCodeDir: string, originalChecksums: Record<string, string>): Promise<string[]> {
  const modified: string[] = []
  for (const [relPath, originalHash] of Object.entries(originalChecksums)) {
    if (EXEMPT_FILES.some(ex => relPath.replace(/\\/g, '/').endsWith(ex))) continue
    const full = join(openCodeDir, relPath)
    if (!existsSync(full)) continue
    const currentHash = await hashFile(full)
    if (currentHash !== originalHash) {
      modified.push(relPath)
    }
  }
  return modified
}

/**
 * Resolve a relative installed path (which may use stripped dir names) back to its
 * absolute framework source path (which may have numeric-prefixed directories).
 * e.g. 'agents/orchestration/builder.md' → '/…/framework/agents/01-orchestration/builder.md'
 */
function resolveFrameworkPath(frameworkDir: string, installedRelPath: string): string {
  const parts = installedRelPath.split('/')
  let current = frameworkDir

  for (const part of parts) {
    const direct = join(current, part)
    if (existsSync(direct)) {
      current = direct
    } else {
      // Look for a numbered variant (e.g. "01-orchestration" for "orchestration")
      let matched = false
      try {
        for (const entry of readdirSync(current)) {
          if (stripNumericPrefix(entry) === part) {
            current = join(current, entry)
            matched = true
            break
          }
        }
      } catch { /* dir doesn't exist */ }
      if (!matched) current = direct // will fail existsSync — handled by caller
    }
  }
  return current
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

/**
 * Recursively copy src → dest, stripping numeric directory prefixes so the
 * installed layout matches what oowl init produces.
 */
async function copyDirSelective(src: string, dest: string, openCodeBase: string, skipFiles: Set<string>): Promise<void> {
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry)
    const isDir = statSync(srcFull).isDirectory()
    const destEntry = isDir ? stripNumericPrefix(entry) : entry
    const destFull = join(dest, destEntry)
    const relToOpenCode = relative(openCodeBase, destFull)

    if (isDir) {
      mkdirSync(destFull, { recursive: true })
      await copyDirSelective(srcFull, destFull, openCodeBase, skipFiles)
    } else {
      if (skipFiles.has(relToOpenCode)) {
        console.log(kleur.dim(`  skipped: ${relToOpenCode}`))
        continue
      }
      writeFileSync(destFull, readFileSync(srcFull))
    }
  }
}

export async function update(): Promise<void> {
  const cwd = process.cwd()
  const oowl = readOowlJson(cwd)

  if (!oowl) {
    console.error(kleur.red('OOWL is not installed in this directory. Run `oowl init` first.'))
    process.exitCode = 1
    return
  }

  const openCodeDir = oowl.location === 'local' ? join(cwd, '.opencode') : join(homedir(), '.config', 'opencode')
  const installRoot = oowl.location === 'local' ? cwd : openCodeDir

  console.log(kleur.bold('\nOOWL Updater\n'))

  const storedChecksums = oowl.checksums ?? {}
  const modifiedFiles = await detectModifiedFiles(openCodeDir, storedChecksums)

  if (modifiedFiles.length > 0) {
    console.log(kleur.yellow(`\n${modifiedFiles.length} file(s) have been modified since install:`))
    for (const f of modifiedFiles) console.log(`  ${kleur.cyan(f)}`)
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

  for (const sub of ['agents', 'commands', 'prompts', 'model-profiles']) {
    const src = join(FRAMEWORK_DIR, sub)
    if (!existsSync(src)) continue
    const dest = join(openCodeDir, sub)
    mkdirSync(dest, { recursive: true })
    await copyDirSelective(src, dest, openCodeDir, skipFiles)
  }

  // Update opencode.jsonc for local if not skipped
  if (oowl.location === 'local') {
    const jsoncSrc = join(FRAMEWORK_DIR, 'opencode.jsonc')
    const jsoncDest = join(cwd, 'opencode.jsonc')
    const jsoncRel = 'opencode.jsonc'
    if (existsSync(jsoncSrc) && !skipFiles.has(jsoncRel)) {
      writeFileSync(jsoncDest, readFileSync(jsoncSrc, 'utf8'), 'utf8')
    }
  }

  // Rebuild checksums
  const newChecksums = await buildChecksums(openCodeDir)
  oowl.checksums = newChecksums
  oowl.updatedAt = new Date().toISOString()
  writeOowlJson(installRoot, oowl)

  console.log(kleur.green('\nUpdate complete!'))
}
