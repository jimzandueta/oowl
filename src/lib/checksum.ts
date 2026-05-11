import { createHash } from 'node:crypto'
import { createReadStream, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(filePath)
      .on('data', (chunk: Buffer | string) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject)
  })
}

interface FileEntry {
  rel: string
  full: string
}

function collectFiles(dir: string, base: string = dir, result: FileEntry[] = []): FileEntry[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectFiles(full, base, result)
    } else {
      result.push({ rel: relative(base, full), full })
    }
  }
  return result
}

export async function buildChecksums(dir: string): Promise<Record<string, string>> {
  const files = collectFiles(dir).sort((a, b) => a.rel.localeCompare(b.rel))
  const checksums: Record<string, string> = {}
  for (const { rel, full } of files) {
    checksums[rel] = await hashFile(full)
  }
  return checksums
}

export async function hashDir(dir: string): Promise<string> {
  const checksums = await buildChecksums(dir)
  const hash = createHash('sha256')
  for (const key of Object.keys(checksums).sort()) {
    hash.update(key + checksums[key])
  }
  return hash.digest('hex')
}
