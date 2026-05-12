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
import { install } from "../lib/installer.js";
import { applyProfile } from "../lib/profiles.js";
import type { Profile } from "../lib/profiles.js";
import {
  applyProfileJsonToJsonc,
  BUILT_IN_PROFILES,
  resolveCustomProfile,
} from "./profile.js";

const DEFAULT_PROFILE = "balanced";

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

  if (!opencodeGo) {
    console.log(
      kleur.yellow(
        "\nBuilt-in profiles use opencode-go/* models. Let's build a custom profile from your connected models.",
      ),
    );
    return {
      name: "custom",
      opencodeGo,
      profileJson: await resolveCustomProfile(),
    };
  }

  const name = await select({
    message: "Choose a model cost profile:",
    choices: BUILT_IN_PROFILES.map((profile) => ({
      name: profile,
      value: profile,
    })),
    default: DEFAULT_PROFILE,
  });

  const profilePath = join(FRAMEWORK_DIR, "model-profiles", `${name}.json`);
  if (!existsSync(profilePath)) {
    throw new Error(`Profile file not found: ${profilePath}`);
  }

  return {
    name,
    opencodeGo,
    profileJson: JSON.parse(readFileSync(profilePath, "utf8")) as Profile,
  };
}

async function runInitWizard(): Promise<void> {
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

  await install({
    location,
    cwd,
    frameworkDir: FRAMEWORK_DIR,
    profile: profile.name,
    opencodeGo: profile.opencodeGo,
    force,
    installJsonc: true,
  });

  await applyProfile(profile.profileJson, openCodeDir);
  applyProfileJsonToJsonc(
    join(openCodeDir, "opencode.jsonc"),
    profile.profileJson,
  );

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
}

export async function init(args: string[] = []): Promise<void> {
  if (args.length > 0) {
    throw new Error(
      "oowl init is wizard-only and does not accept flags. Use install.sh for scripted installs.",
    );
  }

  await runInitWizard();
}
