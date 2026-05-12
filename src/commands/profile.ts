import { select, confirm, input } from "@inquirer/prompts";
import kleur from "kleur";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FRAMEWORK_DIR } from "../lib/paths.js";
import { findOowlInstall, writeOowlJson } from "../lib/installer.js";
import { applyProfile, buildCustomProfile } from "../lib/profiles.js";
import type { Profile } from "../lib/profiles.js";
import {
  scanOpenCodeModels,
  KNOWN_MODEL_TIERS,
} from "../lib/opencode-scanner.js";
import type { Model, ScanResult } from "../lib/opencode-scanner.js";

export const BUILT_IN_PROFILES = ["low", "balanced", "high"];

type TierKey = "cheap/fast" | "mid/balanced" | "premium/deep";

/**
 * Show a tier picker with remaining unassigned connected models
 * and a free-text fallback for custom model IDs.
 */
async function pickModelForTier(
  tier: TierKey,
  allModels: Model[],
  assigned: Set<string>,
): Promise<string> {
  const unassigned = allModels.filter((m) => !assigned.has(m.id));

  const connectedChoices = unassigned.map((m) => ({
    name: `${m.id}  ${kleur.green("(connected)")}`,
    value: m.id,
  }));

  const label =
    assigned.size === 0
      ? `${kleur.cyan(tier)} tier:`
      : `${kleur.cyan(tier)} tier (${allModels.length - assigned.size} remaining):`;

  const choices = [
    ...connectedChoices,
    { name: kleur.dim("Enter a custom model ID…"), value: "__custom__" },
  ];

  const chosen = await select({ message: label, choices });

  if (chosen === "__custom__") {
    return input({
      message: `Model ID for ${kleur.cyan(tier)}:`,
      validate: (v: string) => v.trim().length > 0 || "Model ID required",
    });
  }
  return chosen;
}

interface TierAssignment {
  cheap: string;
  mid: string;
  premium: string;
}

function showKnownTiers(): void {
  const tiers: Record<string, string[]> = {
    "cheap/fast": [],
    "mid/balanced": [],
    "premium/deep": [],
  };
  for (const [slug, tier] of Object.entries(KNOWN_MODEL_TIERS)) {
    tiers[tier].push(slug);
  }
  console.log(kleur.bold("Known model tier reference:"));
  for (const [tier, models] of Object.entries(tiers)) {
    console.log(
      `  ${kleur.cyan(tier.padEnd(15))} ${models.slice(0, 8).join(", ")}${models.length > 8 ? " …" : ""}`,
    );
  }
}

async function autoAssignModels(
  scan: ScanResult,
): Promise<TierAssignment | null> {
  const { cheap, mid, premium, unclassified } = scan.classified;
  const assigned = new Set<string>();

  const unclassifiedIds = new Set(unclassified.map((m) => m.id));
  const knownMid = mid.filter((m) => !unclassifiedIds.has(m.id));

  const missingTiers: string[] = [];
  if (cheap.length === 0) missingTiers.push("cheap/fast");

  const midCandidates = knownMid.length > 0 ? knownMid : mid;
  if (midCandidates.length === 0) missingTiers.push("mid/balanced");

  if (premium.length === 0) missingTiers.push("premium/deep");

  if (missingTiers.length > 0) {
    console.log(
      kleur.red(`\n✗ Not enough connected models to auto-assign all 3 tiers.`),
    );
    console.log(kleur.yellow(`  Missing: ${missingTiers.join(", ")}\n`));
    showKnownTiers();
    console.log("");
    return null;
  }

  const cheapId = cheap[0].id;
  assigned.add(cheapId);

  const remainingMid = midCandidates.filter((m) => !assigned.has(m.id));
  const midId = remainingMid[0].id;
  assigned.add(midId);

  const remainingPremium = premium.filter((m) => !assigned.has(m.id));
  const premiumId = remainingPremium[0].id;

  console.log(kleur.bold("\nAuto-assigned:"));
  console.log(`  cheap/fast:    ${kleur.cyan(cheapId)}`);
  console.log(`  mid/balanced:  ${kleur.cyan(midId)}`);
  console.log(`  premium/deep:  ${kleur.cyan(premiumId)}`);

  if (unclassified.length > 0) {
    console.log(
      kleur.yellow(
        `\n⚠ ${unclassified.length} model(s) not yet in OOWL's tier list:`,
      ),
    );
    for (const m of unclassified) {
      console.log(`   ${m.id}`);
    }
  }
  console.log("");

  return { cheap: cheapId, mid: midId, premium: premiumId };
}

async function manualAssignModels(scan: ScanResult): Promise<TierAssignment> {
  const allModels = scan.models;
  const assigned = new Set<string>();

  console.log(kleur.bold("\nAssign a model to each cost tier:"));
  console.log(kleur.dim("Pick from your connected models.\n"));

  const cheapId = await pickModelForTier("cheap/fast", allModels, assigned);
  assigned.add(cheapId);
  const midId = await pickModelForTier("mid/balanced", allModels, assigned);
  assigned.add(midId);
  const premiumId = await pickModelForTier("premium/deep", allModels, assigned);

  return { cheap: cheapId, mid: midId, premium: premiumId };
}

async function confirmAssignments(
  assignment: TierAssignment,
): Promise<boolean> {
  console.log(kleur.bold("──────────────────────────────────────────"));
  console.log(kleur.bold("  Your model tier assignment"));
  console.log("");
  console.log(`  cheap/fast:    ${kleur.cyan(assignment.cheap)}`);
  console.log(`  mid/balanced:  ${kleur.cyan(assignment.mid)}`);
  console.log(`  premium/deep:  ${kleur.cyan(assignment.premium)}`);
  console.log(kleur.bold("──────────────────────────────────────────\n"));

  return confirm({ message: "Does this look right?", default: true });
}

export async function resolveCustomProfile(): Promise<Profile> {
  process.stdout.write(kleur.dim("Checking connected models… "));
  const scan = await scanOpenCodeModels();

  if (scan.available && scan.models.length > 0) {
    console.log(kleur.green(`${scan.models.length} found`));
  } else {
    console.log(kleur.dim("none found"));
  }

  while (true) {
    const mode = await select({
      message: "How do you want to assign models to tiers?",
      choices: [
        {
          name: "Auto — let OOWL assign based on known model tiers",
          value: "auto",
        },
        {
          name: "Manual — you pick which model goes to each tier",
          value: "manual",
        },
      ],
    });

    let assignment: TierAssignment | null;
    if (mode === "auto") {
      assignment = await autoAssignModels(scan);
      if (assignment === null) {
        console.log(
          kleur.dim("Try manual mode to assign your models yourself.\n"),
        );
        continue;
      }
    } else {
      assignment = await manualAssignModels(scan);
    }

    const ok = await confirmAssignments(assignment);
    if (ok) {
      return buildCustomProfile(
        assignment.cheap,
        assignment.mid,
        assignment.premium,
      );
    }
    console.log(kleur.dim("\nLet's try a different approach.\n"));
  }
}

export function applyProfileJsonToJsonc(
  jsoncPath: string,
  profileJson: Profile,
): void {
  if (!existsSync(jsoncPath)) return;
  let content = readFileSync(jsoncPath, "utf8");
  const gm = profileJson.global?.model;
  const sm = profileJson.global?.small_model;
  const da = profileJson.global?.default_agent;
  if (gm)
    content = content.replace(/"model"\s*:\s*"[^"]+"/, `"model": "${gm}"`);
  if (sm)
    content = content.replace(
      /"small_model"\s*:\s*"[^"]+"/,
      `"small_model": "${sm}"`,
    );
  if (da)
    content = content.replace(
      /"default_agent"\s*:\s*"[^"]+"/,
      `"default_agent": "${da}"`,
    );
  writeFileSync(jsoncPath, content, "utf8");
}

export async function profile(): Promise<void> {
  const cwd = process.cwd();
  const install = findOowlInstall(cwd);

  if (!install) {
    console.error(
      kleur.red(
        "OOWL is not installed in this directory. Run `oowl init` first.",
      ),
    );
    process.exitCode = 1;
    return;
  }

  const { oowl, openCodeDir, installRoot } = install;

  console.log(kleur.bold("\nOOWL Profile Switcher\n"));
  console.log(`Current profile: ${kleur.cyan(oowl.profile)}`);

  const choices = [
    ...BUILT_IN_PROFILES.map((p) => ({
      name: `${p}${oowl.opencodeGo ? "" : kleur.dim(" (requires OpenCode Go)")}`,
      value: p,
    })),
    { name: "custom — choose models by tier", value: "custom" },
  ];

  const chosen = await select({
    message: "Switch to profile:",
    choices,
  });

  let profileJson: Profile;
  if (chosen === "custom") {
    profileJson = await resolveCustomProfile();
  } else {
    const profilePath = join(FRAMEWORK_DIR, "model-profiles", `${chosen}.json`);
    if (!existsSync(profilePath)) {
      console.error(kleur.red(`Profile file not found: ${profilePath}`));
      process.exitCode = 1;
      return;
    }
    profileJson = JSON.parse(readFileSync(profilePath, "utf8")) as Profile;
  }

  console.log(kleur.dim(`\nApplying profile: ${chosen}…`));
  await applyProfile(profileJson, openCodeDir);

  applyProfileJsonToJsonc(join(openCodeDir, "opencode.jsonc"), profileJson);

  oowl.profile = chosen;
  oowl.updatedAt = new Date().toISOString();
  writeOowlJson(installRoot, oowl);

  console.log(kleur.green(`\nProfile switched to: ${chosen}`));
}
