import { select, confirm } from "@inquirer/prompts";
import kleur from "kleur";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FRAMEWORK_DIR,
  getInstallRoot,
  getOpenCodeDir,
} from "../lib/paths.js";
import type { InstallLocation } from "../lib/paths.js";
import { install as installFramework, readOowlJson, writeOowlJson } from "../lib/installer.js";
import { buildChecksums } from "../lib/checksum.js";
import { applyProfile, writeProfileArtifacts } from "../lib/profiles.js";
import type { Profile } from "../lib/profiles.js";
import {
  applyProfileJsonToJsonc,
  BUILT_IN_PROFILES,
  FREE_PROFILE,
  printFreeProfileWarning,
  profileChoiceName,
  resolveCustomProfile,
} from "./profile.js";

const DEFAULT_PROFILE = "low";

function printHelp(): void {
  console.log(`
${kleur.bold("Usage:")} oowl install

Install the OOWL multi-agent framework into this project or your global OpenCode config.

${kleur.bold("Options:")}
  --help, -h  Show this help message

${kleur.bold("Flow:")}
  1. Choose local or global install
  2. Choose built-in model profile or build a custom profile
  3. Write framework files, opencode.jsonc, AGENTS.md, and .oowl.json metadata
`);
}

async function chooseLocation(): Promise<InstallLocation> {
  return select({
    message: "Where do you want to install OOWL?",
    choices: [
      {
        name: "Local — this project only (PWD/.opencode)",
        value: "local",
      },
      {
        name: "Global — all projects (~/.config/opencode)",
        value: "global",
      },
    ],
  });
}

async function chooseProfile(): Promise<{
  name: string;
  opencodeGo: boolean;
  profileJson: Profile;
}> {
  const opencodeGo = await confirm({
    message: "Do you have an OpenCode Go subscription?",
    default: false,
  });

  const loadBuiltInProfile = (name: string): Profile => {
    const profilePath = join(FRAMEWORK_DIR, "model-profiles", `${name}.json`);
    if (!existsSync(profilePath)) {
      throw new Error(`Profile file not found: ${profilePath}`);
    }
    return JSON.parse(readFileSync(profilePath, "utf8")) as Profile;
  };

  if (!opencodeGo) {
    console.log(
      kleur.yellow(
        "\nWithout OpenCode Go, use the free profile or build a custom profile from your connected models.",
      ),
    );
    const name = await select({
      message: "Choose a model cost profile:",
      choices: [
        {
          name: profileChoiceName(FREE_PROFILE, opencodeGo),
          value: FREE_PROFILE,
        },
        { name: "custom - choose models by tier", value: "custom" },
      ],
      default: FREE_PROFILE,
    });

    if (name === "custom") {
      return {
        name,
        opencodeGo,
        profileJson: await resolveCustomProfile(),
      };
    }

    printFreeProfileWarning(name);
    return {
      name,
      opencodeGo,
      profileJson: loadBuiltInProfile(name),
    };
  }

  const name = await select({
    message: "Choose a model cost profile:",
    choices: [
      ...BUILT_IN_PROFILES.map((profile) => ({
        name: profileChoiceName(profile, opencodeGo),
        value: profile,
      })),
      { name: "custom - choose models by tier", value: "custom" },
    ],
    default: DEFAULT_PROFILE,
  });

  if (name === "custom") {
    return {
      name,
      opencodeGo,
      profileJson: await resolveCustomProfile(),
    };
  }

  printFreeProfileWarning(name);
  return {
    name,
    opencodeGo,
    profileJson: loadBuiltInProfile(name),
  };
}

async function runInstallWizard(): Promise<void> {
  const cwd = process.cwd();

  console.log(kleur.bold("\nOOWL — OpenCode Opinionated Workflow Layer\n"));

  const location = await chooseLocation();
  const installRoot = getInstallRoot(location, cwd);
  const openCodeDir = getOpenCodeDir(location, cwd);

  let force = false;
  if (existsSync(openCodeDir)) {
    force = await confirm({
      message: `Target already exists at ${openCodeDir}. Replace it?`,
      default: false,
    });
    if (!force) {
      console.log("Aborted.");
      return;
    }
  }

  const profile = await chooseProfile();

  console.log(
    kleur.dim(
      `\nInstalling OOWL (${location}, profile: ${profile.name})…`,
    ),
  );

  await installFramework({
    location,
    cwd,
    frameworkDir: FRAMEWORK_DIR,
    profile: profile.name,
    opencodeGo: profile.opencodeGo,
    force,
    installJsonc: true,
  });

  await applyProfile(profile.profileJson, openCodeDir);
  writeProfileArtifacts(
    profile.profileJson,
    openCodeDir,
    profile.name === "custom" ? "profile-models.json" : `model-profiles/${profile.name}.json`,
  );
  applyProfileJsonToJsonc(join(openCodeDir, "opencode.jsonc"), profile.profileJson);

  const metadata = readOowlJson(installRoot);
  if (metadata) {
    metadata.checksums = await buildChecksums(openCodeDir);
    metadata.updatedAt = new Date().toISOString();
    writeOowlJson(installRoot, metadata);
  }

  console.log(kleur.green("\nOOWL installed successfully!"));
  if (location === "local") {
    console.log(
      `  .opencode/      ${kleur.dim("→ agents, commands, prompts, model-profiles")}`,
    );
    console.log(`  .opencode/opencode.jsonc  ${kleur.dim("→ runtime config")}`);
    console.log(`  AGENTS.md       ${kleur.dim("→ workflow instructions")}`);
    console.log(`  .oowl.json      ${kleur.dim("→ install metadata")}`);
  } else {
    console.log(
      `  ${installRoot}/  ${kleur.dim("→ agents, commands, prompts, model-profiles")}`,
    );
    console.log(
      `  ${join(installRoot, "opencode.jsonc")}  ${kleur.dim("→ runtime config")}`,
    );
  }
  console.log(
    kleur.dim(
      "\nRun `oowl profile` to switch profiles, `oowl update` to upgrade.",
    ),
  );
  console.log(
    kleur.cyan(
      "\nRun `oowl init` to configure Optional skills for your project.\n",
    ),
  );
}

export async function install(args: string[] = []): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.length > 0) {
    console.error(kleur.red(`Unknown option: ${args[0]}`));
    printHelp();
    process.exitCode = 1;
    return;
  }

  await runInstallWizard();
}
