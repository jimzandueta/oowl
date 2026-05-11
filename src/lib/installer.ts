import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { GLOBAL_INSTALL_DIR } from "./paths.js";
import { buildChecksums } from "./checksum.js";

const OOWL_JSON = ".oowl.json";

export interface OowlJson {
  version: string;
  location: "local" | "global";
  profile: string;
  opencodeGo: boolean;
  installedAt: string;
  updatedAt: string;
  checksums?: Record<string, string>;
}

export interface InstallOptions {
  location: "local" | "global";
  cwd: string;
  frameworkDir: string;
  profile: string;
  opencodeGo: boolean;
  globalDir?: string;
}

export function readOowlJson(root: string): OowlJson | null {
  const file = join(root, OOWL_JSON);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as OowlJson;
  } catch {
    return null;
  }
}

export function writeOowlJson(root: string, data: OowlJson): void {
  writeFileSync(
    join(root, OOWL_JSON),
    JSON.stringify(data, null, 2) + "\n",
    "utf8",
  );
}

/** Strip leading NN- or NN_ numeric prefixes from directory names (e.g. "01-orchestration" → "orchestration"). */
export function stripNumericPrefix(name: string): string {
  return name.replace(/^\d+[_-]/, "");
}

/**
 * Recursively copy src → dest, stripping numeric prefixes from directory names.
 * Files keep their original names; only directories are renamed.
 */
function copyStripped(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry);
    const isDir = statSync(srcFull).isDirectory();
    const destName = isDir ? stripNumericPrefix(entry) : entry;
    const destFull = join(dest, destName);
    if (isDir) {
      copyStripped(srcFull, destFull);
    } else {
      copyFileSync(srcFull, destFull);
    }
  }
}

/** Recursively collect all files from subdirectories into a single flat directory. */
function copyFlat(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry);
    if (statSync(srcFull).isDirectory()) {
      copyFlat(srcFull, dest);
    } else if (statSync(srcFull).isFile()) {
      const destFull = join(dest, entry);
      if (!existsSync(destFull)) {
        copyFileSync(srcFull, destFull);
      }
    }
  }
}

export async function install({
  location,
  cwd,
  frameworkDir,
  profile,
  opencodeGo,
  globalDir,
}: InstallOptions): Promise<void> {
  const installRoot =
    location === "global" ? (globalDir ?? GLOBAL_INSTALL_DIR) : cwd;
  const openCodeDir =
    location === "global"
      ? (globalDir ?? GLOBAL_INSTALL_DIR)
      : join(cwd, ".opencode");

  // Copy agents — strip numeric prefixes from category directories
  const agentsSrc = join(frameworkDir, "agents");
  if (existsSync(agentsSrc)) {
    copyStripped(agentsSrc, join(openCodeDir, "agents"));
  }

  // Copy prompts and model-profiles (keep directory names, strip numeric prefixes)
  for (const sub of ["prompts", "model-profiles"]) {
    const src = join(frameworkDir, sub);
    if (existsSync(src)) {
      copyStripped(src, join(openCodeDir, sub));
    }
  }

  // Copy commands — flatten: OpenCode expects commands directly in the commands/
  // directory (e.g. .opencode/commands/build.md), not nested in subdirectories.
  const commandsSrc = join(frameworkDir, "commands");
  if (existsSync(commandsSrc)) {
    copyFlat(commandsSrc, join(openCodeDir, "commands"));
  }

  // Copy profile-models.json
  const profileModelsJson = join(frameworkDir, "profile-models.json");
  if (existsSync(profileModelsJson)) {
    mkdirSync(openCodeDir, { recursive: true });
    copyFileSync(profileModelsJson, join(openCodeDir, "profile-models.json"));
  }

  // Copy opencode.jsonc and AGENTS.md to the appropriate location
  const jsonc = join(frameworkDir, "opencode.jsonc");
  const agentsMd = join(frameworkDir, "AGENTS.md");

  if (location === "local") {
    if (existsSync(jsonc)) copyFileSync(jsonc, join(cwd, "opencode.jsonc"));
    if (existsSync(agentsMd)) copyFileSync(agentsMd, join(cwd, "AGENTS.md"));
  } else if (location === "global") {
    if (existsSync(jsonc))
      copyFileSync(jsonc, join(openCodeDir, "opencode.jsonc"));
  }

  // Build checksums for conflict detection on future updates
  const checksums = existsSync(openCodeDir)
    ? await buildChecksums(openCodeDir)
    : {};

  const oowlData: OowlJson = {
    version: "1.0.5",
    location,
    profile,
    opencodeGo,
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checksums,
  };

  writeOowlJson(installRoot, oowlData);
}
