import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  statSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { GLOBAL_INSTALL_DIR, getInstallRoot, getOpenCodeDir } from "./paths.js";
import type { InstallLocation } from "./paths.js";
import { buildChecksums } from "./checksum.js";

const OOWL_JSON = ".oowl.json";

export interface OowlJson {
  version: string;
  location: InstallLocation;
  profile: string;
  opencodeGo: boolean;
  installedAt: string;
  updatedAt: string;
  checksums?: Record<string, string>;
}

export interface InstallOptions {
  location: InstallLocation;
  cwd: string;
  frameworkDir: string;
  profile: string;
  opencodeGo: boolean;
  globalDir?: string;
  force?: boolean;
  installJsonc?: boolean;
  dryRun?: boolean;
  logger?: (message: string) => void;
}

export interface OowlInstall {
  oowl: OowlJson;
  installRoot: string;
  openCodeDir: string;
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

export function findOowlInstall(
  cwd: string = process.cwd(),
  globalDir: string = GLOBAL_INSTALL_DIR,
): OowlInstall | null {
  const local = readOowlJson(cwd);
  if (local) {
    return {
      oowl: local,
      installRoot: getInstallRoot(local.location, cwd, globalDir),
      openCodeDir: getOpenCodeDir(local.location, cwd, globalDir),
    };
  }

  const global = readOowlJson(globalDir);
  if (global) {
    return {
      oowl: global,
      installRoot: getInstallRoot(global.location, cwd, globalDir),
      openCodeDir: getOpenCodeDir(global.location, cwd, globalDir),
    };
  }

  return null;
}

function validateFramework(frameworkDir: string): void {
  for (const dir of ["agents", "commands", "prompts", "model-profiles"]) {
    const full = join(frameworkDir, dir);
    if (!existsSync(full) || !statSync(full).isDirectory()) {
      throw new Error(`Required source directory not found: ${full}`);
    }
  }

  const agentsMd = join(frameworkDir, "AGENTS.md");
  if (!existsSync(agentsMd) || !statSync(agentsMd).isFile()) {
    throw new Error(`Required file not found: ${agentsMd}`);
  }
}

function run(
  dryRun: boolean,
  logger: ((message: string) => void) | undefined,
  description: string,
  action: () => void,
): void {
  if (dryRun) {
    logger?.(`[dry-run] ${description}`);
    return;
  }
  action();
}

/** Recursively copy src → dest preserving directory names. */
function copyRecursive(
  src: string,
  dest: string,
  dryRun: boolean,
  logger?: (message: string) => void,
): void {
  run(dryRun, logger, `mkdir -p ${dest}`, () =>
    mkdirSync(dest, { recursive: true }),
  );
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry);
    const destFull = join(dest, entry);
    const isDir = statSync(srcFull).isDirectory();
    if (isDir) {
      copyRecursive(srcFull, destFull, dryRun, logger);
    } else {
      run(dryRun, logger, `cp ${srcFull} ${destFull}`, () =>
        copyFileSync(srcFull, destFull),
      );
    }
  }
}

/** Recursively collect all files from subdirectories into a single flat directory. */
function copyFlat(
  src: string,
  dest: string,
  dryRun: boolean,
  logger?: (message: string) => void,
  ensureDest = true,
): void {
  if (ensureDest) {
    run(dryRun, logger, `mkdir -p ${dest}`, () =>
      mkdirSync(dest, { recursive: true }),
    );
  }
  for (const entry of readdirSync(src)) {
    const srcFull = join(src, entry);
    if (statSync(srcFull).isDirectory()) {
      copyFlat(srcFull, dest, dryRun, logger, false);
    } else if (statSync(srcFull).isFile()) {
      if (entry === "README.md") continue;
      const destFull = join(dest, entry);
      run(dryRun, logger, `cp ${srcFull} ${destFull}`, () =>
        copyFileSync(srcFull, destFull),
      );
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
  force = false,
  installJsonc = true,
  dryRun = false,
  logger,
}: InstallOptions): Promise<void> {
  validateFramework(frameworkDir);

  const effectiveGlobalDir = globalDir ?? GLOBAL_INSTALL_DIR;
  const installRoot = getInstallRoot(location, cwd, effectiveGlobalDir);
  const openCodeDir = getOpenCodeDir(location, cwd, effectiveGlobalDir);

  if (existsSync(openCodeDir)) {
    if (!force) {
      throw new Error(
        `Target already exists: ${openCodeDir}. Re-run with --force to overwrite.`,
      );
    }
    logger?.(`Removing existing install at ${openCodeDir}`);
    run(dryRun, logger, `rm -rf ${openCodeDir}`, () =>
      rmSync(openCodeDir, { recursive: true, force: true }),
    );
  }

  run(dryRun, logger, `mkdir -p ${dirname(openCodeDir)}`, () =>
    mkdirSync(dirname(openCodeDir), { recursive: true }),
  );

  copyFlat(
    join(frameworkDir, "agents"),
    join(openCodeDir, "agents"),
    dryRun,
    logger,
  );
  logger?.(
    `Flat copied agents: ${join(frameworkDir, "agents")} -> ${join(openCodeDir, "agents")}`,
  );

  copyFlat(
    join(frameworkDir, "commands"),
    join(openCodeDir, "commands"),
    dryRun,
    logger,
  );
  logger?.(
    `Flat copied commands: ${join(frameworkDir, "commands")} -> ${join(openCodeDir, "commands")}`,
  );

  copyRecursive(
    join(frameworkDir, "prompts"),
    join(openCodeDir, "prompts"),
    dryRun,
    logger,
  );
  logger?.(
    `Copied prompts: ${join(frameworkDir, "prompts")} -> ${join(openCodeDir, "prompts")}`,
  );

  copyRecursive(
    join(frameworkDir, "model-profiles"),
    join(openCodeDir, "model-profiles"),
    dryRun,
    logger,
  );
  logger?.(
    `Copied model-profiles: ${join(frameworkDir, "model-profiles")} -> ${join(openCodeDir, "model-profiles")}`,
  );

  const profileModelsJson = join(frameworkDir, "profile-models.json");
  if (existsSync(profileModelsJson)) {
    run(dryRun, logger, `mkdir -p ${openCodeDir}`, () =>
      mkdirSync(openCodeDir, { recursive: true }),
    );
    run(
      dryRun,
      logger,
      `cp ${profileModelsJson} ${join(openCodeDir, "profile-models.json")}`,
      () =>
        copyFileSync(
          profileModelsJson,
          join(openCodeDir, "profile-models.json"),
        ),
    );
    logger?.("Copied profile-models.json");
  }

  const jsonc = join(frameworkDir, "opencode.jsonc");
  const agentsMd = join(frameworkDir, "AGENTS.md");

  if (installJsonc && existsSync(jsonc)) {
    run(
      dryRun,
      logger,
      `cp ${jsonc} ${join(openCodeDir, "opencode.jsonc")}`,
      () => copyFileSync(jsonc, join(openCodeDir, "opencode.jsonc")),
    );
    logger?.("Copied opencode.jsonc");
  }

  if (location === "local") {
    run(dryRun, logger, `cp ${agentsMd} ${join(cwd, "AGENTS.md")}`, () =>
      copyFileSync(agentsMd, join(cwd, "AGENTS.md")),
    );
    logger?.(`Installed AGENTS.md to ${cwd}/`);
  } else if (location === "global") {
    run(
      dryRun,
      logger,
      `cp ${agentsMd} ${join(openCodeDir, "AGENTS.md")}`,
      () => copyFileSync(agentsMd, join(openCodeDir, "AGENTS.md")),
    );
    logger?.(`Installed AGENTS.md to ${openCodeDir}/`);
  }

  if (dryRun) {
    return;
  }

  const checksums = existsSync(openCodeDir)
    ? await buildChecksums(openCodeDir)
    : {};

  const oowlData: OowlJson = {
    version: "1.1.0",
    location,
    profile,
    opencodeGo,
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checksums,
  };

  writeOowlJson(installRoot, oowlData);
}
