import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type JsonRecord = Record<string, unknown>;

/**
 * JSONC cleaner: strips line comments, block comments, and trailing commas,
 * using a character-at-a-time parser that tracks string boundaries so
 * URLs like "https://" are never mistaken for comments.
 */
function cleanJsonc(text: string): string {
  const out: string[] = [];
  let inString = false;
  let escape = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Track escape sequences inside strings
    if (escape) {
      escape = false;
      out.push(ch);
      i++;
      continue;
    }
    if (inString && ch === "\\") {
      escape = true;
      out.push(ch);
      i++;
      continue;
    }

    // Toggle string state on unescaped double-quote
    if (ch === '"') {
      inString = !inString;
      out.push(ch);
      i++;
      continue;
    }

    // //-comments (only when not inside a string)
    if (!inString && ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    // Block comments (only when not inside a string)
    if (!inString && ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2; // skip the closing */
      continue;
    }

    out.push(ch);
    i++;
  }

  const cleaned = out.join("");
  // Remove trailing commas before } or ]
  return cleaned.replace(/,\s*([}\]])/g, "$1");
}

function asObject(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
}

/**
 * Validate that all configured agent permission skill entries use "allow".
 */
export function validateAgentPermissions(config: unknown): boolean {
  const root = asObject(config);
  const agents = asObject(root.agent);

  for (const agentConfig of Object.values(agents)) {
    const permission = asObject(asObject(agentConfig).permission);
    const skill = asObject(permission.skill);

    for (const permissionValue of Object.values(skill)) {
      if (permissionValue !== "allow") {
        return false;
      }
    }
  }

  return true;
}

/**
 * Write approved Optional skills to the installed opencode.jsonc.
 * Reads existing config, merges agent permission blocks, validates, and writes back.
 */
export function writeAgentPermissions(
  opencodeJsoncPath: string,
  optionalSkills: Record<string, string[]>,
): void {
  if (!existsSync(opencodeJsoncPath)) {
    throw new Error(`opencode.jsonc not found at ${opencodeJsoncPath}`);
  }

  const raw = readFileSync(opencodeJsoncPath, "utf8");
  const parsed = JSON.parse(cleanJsonc(raw)) as JsonRecord;

  const config = asObject(parsed);
  const agentRoot = asObject(config.agent);
  config.agent = agentRoot;

  for (const [agentName, skills] of Object.entries(optionalSkills)) {
    const agentConfig = asObject(agentRoot[agentName]);
    const permission = asObject(agentConfig.permission);
    const skillPermissions = asObject(permission.skill);

    for (const skillName of skills) {
      skillPermissions[skillName] = "allow";
    }

    permission.skill = skillPermissions;
    agentConfig.permission = permission;
    agentRoot[agentName] = agentConfig;
  }

  if (!validateAgentPermissions(config)) {
    throw new Error("Invalid agent permission schema: skill permissions must be 'allow'.");
  }

  const output = JSON.stringify(config, null, 2);
  JSON.parse(output);
  writeFileSync(opencodeJsoncPath, `${output}\n`, "utf8");
}

/**
 * Update agent .md frontmatter with approved skills and add a
 * ## Skill Initialization section in the body. Skills are marked
 * as Required — agents MUST load them at step 0.
 */
export function writeAgentSkillPermissions(
  agentsDir: string,
  approvedSkills: Record<string, string[]>,
): void {
  for (const [agentName, skills] of Object.entries(approvedSkills)) {
    if (skills.length === 0) continue;

    const filePath = join(agentsDir, `${agentName}.md`);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // The frontmatter is between --- markers (line 0 and some later line)
    if (lines[0] !== "---") continue;

    // Find the closing --- of the frontmatter
    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === "---") {
        frontmatterEnd = i;
        break;
      }
    }
    if (frontmatterEnd === -1) continue;

    // Find the skill: line in frontmatter and replace its entries
    let skillLineIdx = -1;
    let skillIndent = 0;
    for (let i = 1; i < frontmatterEnd; i++) {
      const trimmed = lines[i];
      const indent = trimmed.length - trimmed.trimStart().length;
      if (trimmed.trimStart().startsWith("skill:")) {
        skillLineIdx = i;
        skillIndent = indent;
        break;
      }
    }

    if (skillLineIdx === -1) continue;

    // Find the end of the skill sub-entries
    let endIdx = skillLineIdx + 1;
    while (endIdx < frontmatterEnd) {
      const trimmed = lines[endIdx];
      const indent = trimmed.length - trimmed.trimStart().length;
      if (indent <= skillIndent || trimmed === "" || trimmed === "---") break;
      endIdx++;
    }

    const existingSkillLines = lines.slice(skillLineIdx + 1, endIdx);
    const existingSkillNames = new Set<string>();
    for (const line of existingSkillLines) {
      const match = line.trim().match(/^"?([^":]+)"?\s*:/);
      if (match) {
        existingSkillNames.add(match[1]);
      }
    }

    // Preserve required/runtime skill entries and append only newly approved skills.
    const skillEntries = skills
      .filter((skill) => !existingSkillNames.has(skill))
      .map((s) => `${" ".repeat(skillIndent + 2)}"${s}": allow`);

    // Build ## Skill Initialization section after frontmatter
    const initSection = [
      "",
      "## Skill Initialization",
      "",
      `This agent has ${skills.length} approved skills. Load them at session start:`,
      "",
    ];
    for (const s of skills) {
      initSection.push(`- \`skill: ${s}\` — Required`);
    }
    initSection.push("");
    initSection.push("**Failure to load any skill above means reduced capability.**");
    initSection.push("");

    // Check if a Skill Initialization section already exists in body
    let existingInitLine = -1;
    for (let i = frontmatterEnd + 1; i < lines.length; i++) {
      if (lines[i].trim() === "## Skill Initialization") {
        existingInitLine = i;
        break;
      }
    }

    let newContent: string;
    if (existingInitLine !== -1) {
      // Find end of existing Skill Initialization section (next ## heading or EOF)
      let initEnd = existingInitLine + 1;
      while (initEnd < lines.length) {
        if (lines[initEnd].startsWith("## ")) break;
        initEnd++;
      }
      const before = lines.slice(0, skillLineIdx + 1);
      const middle = [
        ...existingSkillLines,
        ...skillEntries,
        ...lines.slice(endIdx, existingInitLine),
      ];
      const after = lines.slice(initEnd);
      newContent = [...before, ...middle, ...initSection, ...after].join("\n");
    } else {
      // Add new Skill Initialization section right after frontmatter
      const before = lines.slice(0, skillLineIdx + 1);
      const middle = [
        ...existingSkillLines,
        ...skillEntries,
        ...lines.slice(endIdx, frontmatterEnd + 1),
      ];
      const after = lines.slice(frontmatterEnd + 1);
      newContent = [...before, ...middle, ...initSection, ...after].join("\n");
    }

    writeFileSync(filePath, newContent, "utf8");
  }
}
