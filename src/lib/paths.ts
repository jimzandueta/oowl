import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))

export type InstallLocation = 'local' | 'global'

// At runtime this file is at dist/lib/paths.js; two levels up is the package root.
export const FRAMEWORK_DIR = join(__dirname, '../../framework')
export const GLOBAL_INSTALL_DIR = join(homedir(), '.config', 'opencode')

export function getOpenCodeDir(
  location: InstallLocation,
  cwd: string = process.cwd(),
  globalDir: string = GLOBAL_INSTALL_DIR,
): string {
  return location === 'global' ? globalDir : join(cwd, '.opencode')
}

export function getInstallRoot(
  location: InstallLocation,
  cwd: string = process.cwd(),
  globalDir: string = GLOBAL_INSTALL_DIR,
): string {
  return location === 'global' ? globalDir : cwd
}
