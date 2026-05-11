import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))

// At runtime this file is at dist/lib/paths.js; two levels up is the package root.
export const FRAMEWORK_DIR = join(__dirname, '../../framework')
export const GLOBAL_INSTALL_DIR = join(homedir(), '.config', 'opencode')

export function getOpenCodeDir(location: string, cwd: string = process.cwd()): string {
  return location === 'global' ? GLOBAL_INSTALL_DIR : join(cwd, '.opencode')
}

export function getInstallRoot(location: string, cwd: string = process.cwd()): string {
  return location === 'global' ? GLOBAL_INSTALL_DIR : cwd
}
