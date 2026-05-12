export function getModelLine(content: string): string | null {
  const lines = content.split('\n')
  if (lines[0] !== '---') return null
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') break
    const m = lines[i].match(/^model:\s*(.+)$/)
    if (m) return m[1].trim()
  }
  return null
}

export function updateModelLine(content: string, newModel: string): string {
  const lines = content.split('\n')
  if (lines[0] !== '---') {
    throw new Error('Agent file has no model line in frontmatter')
  }

  let inFrontmatter = true
  let replaced = false
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      result.push(lines[i])
      continue
    }

    if (inFrontmatter && lines[i] === '---') {
      inFrontmatter = false
      result.push(lines[i])
      continue
    }

    if (inFrontmatter && !replaced && /^model:/.test(lines[i])) {
      result.push(`model: ${newModel}`)
      replaced = true
      continue
    }
    result.push(lines[i])
  }

  if (!replaced) {
    throw new Error('Agent file has no model line in frontmatter')
  }

  return result.join('\n')
}
