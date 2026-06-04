import { input, select, confirm, checkbox } from "@inquirer/prompts";
import kleur from "kleur";
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { join } from "node:path";
import { findOowlInstall, readOowlJson, writeOowlJson } from "../lib/installer.js";
import type { OowlInstall } from "../lib/installer.js";
import type { OowlJson } from "../lib/installer.js";
import { buildChecksums } from "../lib/checksum.js";
import { writeAgentPermissions, writeAgentSkillPermissions } from "../lib/opencode-config-writer.js";
import { getOpenCodeDir } from "../lib/paths.js";
import { recommend, filterByQualityGate, loadSkillsRegistry } from "../lib/skill-recommender.js";
import type { ProjectAnswers } from "../lib/skill-recommender.js";

// Entry prompt — user chooses describe or questions
async function choosePath(): Promise<"describe" | "questions"> {
  const useDescribe = await confirm({
    message: "Describe your project in free text? (otherwise answer a few questions)",
    default: true,
  });
  return useDescribe ? "describe" : "questions";
}

// Path 1: Free-form description with basic keyword parsing
async function describePath(): Promise<ProjectAnswers> {
  const description = await input({ message: "Describe your project in a sentence or two:" });
  return parseDescription(description);
}

// Lightweight keyword parser for the free-form description path.
function parseDescription(text: string): ProjectAnswers {
  const lower = text.toLowerCase();

  // Defaults
  const answers: ProjectAnswers = {
    projectType: "web",
    frontend: "none",
    backend: null,
    cloud: "none",
    database: "none",
    priorities: [],
    _source: "describe",
  };

  // Project type detection
  if (lower.includes("api") || lower.includes("microservice") || lower.includes("backend")) {
    answers.projectType = "api";
  } else if (lower.includes("fullstack") || lower.includes("full-stack")) {
    answers.projectType = "fullstack";
  } else if (lower.includes("mobile") || lower.includes("ios") || lower.includes("android") || lower.includes("expo")) {
    answers.projectType = "mobile";
  } else if (lower.includes("cli") || lower.includes("command line") || lower.includes("library")) {
    answers.projectType = "cli";
  } else if (lower.includes("data") || lower.includes("analytics")) {
    answers.projectType = "data";
  }

  // Frontend detection
  if (lower.includes("next.js") || lower.includes("nextjs") || lower.includes("next ")) {
    answers.frontend = "next";
  } else if (lower.includes("react")) {
    answers.frontend = "react";
  } else if (lower.includes("vue") || lower.includes("nuxt")) {
    answers.frontend = "vue";
  } else if (lower.includes("svelte")) {
    answers.frontend = "svelte";
  } else if (lower.includes("expo") || lower.includes("react native")) {
    answers.frontend = "expo";
  } else if (lower.includes("vanilla") || lower.includes("html") || lower.includes("css")) {
    answers.frontend = "vanilla";
  }

  // Cloud detection
  if (lower.includes("cloudflare")) {
    answers.cloud = "cloudflare";
  } else if (lower.includes("aws") || lower.includes("lambda") || lower.includes("ecs") || lower.includes("s3")) {
    answers.cloud = "aws";
  } else if (lower.includes("vercel") || lower.includes("netlify")) {
    answers.cloud = "vercel-netlify";
  } else if (lower.includes("docker") || lower.includes("self-host")) {
    answers.cloud = "self-hosted";
  }

  // Database detection
  if (lower.includes("postgres") || lower.includes("postgresql")) {
    answers.database = "postgres";
  } else if (lower.includes("neon")) {
    answers.database = "neon";
  } else if (lower.includes("clickhouse")) {
    answers.database = "clickhouse";
  } else if (lower.includes("mysql") || lower.includes("mariadb")) {
    answers.database = "mysql";
  } else if (lower.includes("mongo")) {
    answers.database = "mongodb";
  } else if (lower.includes("sqlite")) {
    answers.database = "sqlite";
  }

  // Priority detection
  if (lower.includes("security") || lower.includes("auth") || lower.includes("compliance")) {
    answers.priorities.push("security");
  }
  if (lower.includes("performance") || lower.includes("fast") || lower.includes("speed") || lower.includes("perf")) {
    answers.priorities.push("performance");
  }
  if (lower.includes("ui") || lower.includes("design") || lower.includes("polish") || lower.includes("animate")) {
    answers.priorities.push("ui-polish");
  }
  if (lower.includes("mobile") || lower.includes("native")) {
    answers.priorities.push("mobile");
  }
  if (lower.includes("devex") || lower.includes("ci/cd") || lower.includes("tooling")) {
    answers.priorities.push("devex");
  }
  if (lower.includes("data integrity") || lower.includes("migration") || lower.includes("rollback")) {
    answers.priorities.push("data-integrity");
  }
  if (lower.includes("engagement") || lower.includes("retention") || lower.includes("habit")) {
    answers.priorities.push("engagement");
  }

  return answers;
}

// Path 2: Structured 5-question flow
async function questionsPath(): Promise<ProjectAnswers> {
  const projectType = await select<
    "web" | "api" | "fullstack" | "mobile" | "cli" | "data" | "other"
  >({
    message: "What kind of project is this?",
    choices: [
      { name: "Web app (React, Next.js, Vue, Svelte)", value: "web" },
      { name: "API / microservice (REST, GraphQL)", value: "api" },
      { name: "Full-stack (frontend + backend)", value: "fullstack" },
      { name: "Mobile app (iOS, Android, Expo)", value: "mobile" },
      { name: "CLI tool or library", value: "cli" },
      { name: "Data / analytics platform", value: "data" },
      { name: "Other / not sure", value: "other" },
    ],
  });

  let frontend: "next" | "react" | "vue" | "svelte" | "expo" | "vanilla" | "none" = "none";
  if (projectType !== "api" && projectType !== "cli") {
    frontend = await select<"next" | "react" | "vue" | "svelte" | "expo" | "vanilla" | "none">({
      message: "Which frontend framework?",
      choices: [
        { name: "Next.js", value: "next" },
        { name: "React (not Next.js)", value: "react" },
        { name: "Vue / Nuxt", value: "vue" },
        { name: "Svelte / SvelteKit", value: "svelte" },
        { name: "Expo / React Native", value: "expo" },
        { name: "Vanilla / other", value: "vanilla" },
        { name: "No frontend", value: "none" },
      ],
    });
  }

  const backend = await input({ message: "Backend language/framework (or leave blank):" });

  const cloud = await select<"cloudflare" | "aws" | "vercel-netlify" | "self-hosted" | "multi" | "none">({
    message: "Where does this project run?",
    choices: [
      { name: "Cloudflare (Workers, Pages)", value: "cloudflare" },
      { name: "AWS (Lambda, ECS, S3)", value: "aws" },
      { name: "Vercel / Netlify", value: "vercel-netlify" },
      { name: "Self-hosted / Docker", value: "self-hosted" },
      { name: "Multiple / undecided", value: "multi" },
      { name: "No cloud (local tool)", value: "none" },
    ],
  });

  const database = await select<"postgres" | "neon" | "clickhouse" | "mysql" | "mongodb" | "sqlite" | "none">({
    message: "What database does this project use?",
    choices: [
      { name: "PostgreSQL", value: "postgres" },
      { name: "Neon (serverless Postgres)", value: "neon" },
      { name: "ClickHouse (analytics)", value: "clickhouse" },
      { name: "MySQL / MariaDB", value: "mysql" },
      { name: "MongoDB / document DB", value: "mongodb" },
      { name: "SQLite / embedded", value: "sqlite" },
      { name: "No database", value: "none" },
    ],
  });

  const priorities = await checkbox<
    "security" | "performance" | "ui-polish" | "mobile" | "devex" | "data-integrity" | "engagement"
  >({
    message: "What are the top priorities? (select up to 3)",
    choices: [
      { name: "Security — auth, secrets, compliance", value: "security" },
      { name: "Performance — Core Web Vitals, latency", value: "performance" },
      { name: "UI polish — animations, microinteractions, a11y", value: "ui-polish" },
      { name: "Mobile / native feel", value: "mobile" },
      { name: "Developer experience — CI/CD, tooling", value: "devex" },
      { name: "Data integrity — migrations, schema safety", value: "data-integrity" },
      { name: "Engagement — retention, habit loops", value: "engagement" },
    ],
  });

  return {
    projectType,
    frontend,
    backend: backend || null,
    cloud,
    database,
    priorities,
    _source: "questions",
  };
}

// Display parsed answers for confirmation
function displayAnswers(answers: ProjectAnswers): void {
  console.log(kleur.bold("\n─────────────────────────────────────────────────"));
  console.log(kleur.bold("  I understood your project as:"));
  console.log(`    - Type:       ${answers.projectType}`);
  console.log(`    - Frontend:   ${answers.frontend}`);
  console.log(`    - Backend:    ${answers.backend || "(none)"}`);
  console.log(`    - Cloud:      ${answers.cloud}`);
  console.log(`    - Database:   ${answers.database}`);
  console.log(`    - Priorities: ${answers.priorities.join(", ") || "(none)"}`);
  console.log(kleur.bold("─────────────────────────────────────────────────"));
}

function displaySummaryTable(skills: Record<string, string[]>): void {
  console.log(kleur.bold("\n─────────────────────────────────────────────────"));
  console.log(kleur.bold("  OOWL — Recommended Optional Skills"));
  console.log(kleur.bold("─────────────────────────────────────────────────"));

  let total = 0;
  for (const [agent, skillList] of Object.entries(skills)) {
    console.log(`\n  ${kleur.cyan(agent)}:`);
    for (const skill of skillList) {
      console.log(`    • ${skill}`);
      total++;
    }
  }

  console.log(`\n  ${kleur.dim(`${total} Optional skills across ${Object.keys(skills).length} agents`)}`);
  console.log(kleur.bold("─────────────────────────────────────────────────\n"));
}

async function editMode(skills: Record<string, string[]>): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};

  for (const [agent, skillList] of Object.entries(skills)) {
    const selected = await checkbox({
      message: `Skills for ${agent}:`,
      choices: skillList.map((skill) => ({
        name: skill,
        value: skill,
        checked: true,
      })),
    });
    if (selected.length > 0) {
      result[agent] = selected;
    }
  }

  return result;
}

// Prerequisite check
async function checkPrerequisite(): Promise<boolean> {
  const cwd = process.cwd();
  const openCodeDir = join(cwd, ".opencode");
  if (!existsSync(openCodeDir)) {
    console.error(kleur.red("\n✗ No local install found in this directory."));
    console.error(kleur.red("  Run 'oowl install' first, then re-run 'oowl init'."));
    return false;
  }
  return true;
}

// Help display
function printHelp(): void {
  console.log(kleur.bold("\nUsage: oowl init [options]"));
  console.log("\nConfigure Optional skills for your project.");
  console.log("\nOptions:");
  console.log("  --help, -h    Show this help message");
  console.log("  --list        Show currently configured Optional skills");
  console.log("  --reset       Clear all Optional skills and re-run questionnaire");
  console.log("  --apply       Re-write opencode.jsonc and agent skill frontmatter from .oowl.json");
  console.log("\nRun 'oowl init' without flags for the interactive wizard.");
}

function firstUnknownArg(args: string[]): string | undefined {
  const known = new Set(["--help", "-h", "--list", "--reset", "--apply"]);
  return args.find((arg) => !known.has(arg));
}

async function applySavedOptionalSkills(install: OowlInstall): Promise<boolean> {
  const latest = readOowlJson(install.installRoot) || install.oowl;
  const optionalSkills = latest.optionalSkills ?? {};
  const skillCount = Object.values(optionalSkills).reduce(
    (sum, skills) => sum + skills.length,
    0,
  );

  if (skillCount === 0) {
    console.log("No Optional skills configured. Run 'oowl init' to set them up.");
    return true;
  }

  const jsoncPath = join(install.openCodeDir, "opencode.jsonc");
  const agentsDir = join(install.openCodeDir, "agents");

  try {
    writeAgentPermissions(jsoncPath, optionalSkills);
    writeAgentSkillPermissions(agentsDir, optionalSkills);
    latest.checksums = await buildChecksums(install.openCodeDir);
    latest.updatedAt = new Date().toISOString();
    writeOowlJson(install.installRoot, latest);
    console.log(
      kleur.green(
        `Applied ${skillCount} Optional skill permission(s) from .oowl.json.`,
      ),
    );
    return true;
  } catch (err) {
    console.error(
      kleur.red(
        `Failed to apply Optional skills: ${(err as Error).message}`,
      ),
    );
    return false;
  }
}

// --- Skill source installation ---

function runCommand(command: string): boolean {
  console.log(kleur.cyan(`\nRunning: ${command}`));
  try {
    execSync(command, { stdio: "inherit" });
    console.log(kleur.green("Done."));
    return true;
  } catch (err) {
    console.error(kleur.red(`Failed: ${command}`));
    console.error(kleur.red(`Error: ${(err as Error).message}`));
    return false;
  }
}

function findSkillFile(cachePath: string, skillId: string): string | null {
  try {
    for (const entry of readdirSync(cachePath)) {
      const full = join(cachePath, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        if (entry === skillId) {
          const direct = join(full, "SKILL.md");
          if (existsSync(direct)) return direct;
        }
        const nested = findSkillFile(full, skillId);
        if (nested) return nested;
      } else if (entry === "SKILL.md" && cachePath.endsWith(skillId)) {
        return full;
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function runSkillSourceInstalls(
  openCodeDir: string,
  approvedSkills: Record<string, string[]>,
  skillRegistry: any[],
): Promise<void> {
  console.log(kleur.bold("\n─────────────────────────────────────────────────"));
  console.log(kleur.bold("  Installing skill sources…"));
  console.log(kleur.bold("─────────────────────────────────────────────────"));

  // Clone only the repos needed by approved skills, then link each approved
  // skill into .opencode/skills/<id>/ where OpenCode discovers it at startup.

  const cacheDir = join(openCodeDir, "cache");
  const skillsDir = join(openCodeDir, "skills");
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });

  // Repos to clone (all git-based — consistent approach)
  const repos: Record<string, string> = {
    "taste-skill": "https://github.com/Leonxlnx/taste-skill.git",
    "wshobson-agents": "https://github.com/wshobson/agents.git",
    "ui-ux-pro-max": "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git",
  };

  // Build a reverse map: skillId → source name
  const skillToSource: Record<string, string> = {};
  for (const entry of skillRegistry) {
    skillToSource[entry.id] = entry.source;
  }

  const allApproved = [...new Set(Object.values(approvedSkills).flat())];
  const neededSources = new Set(
    allApproved
      .map((skillId) => skillToSource[skillId])
      .filter((source): source is string => Boolean(source)),
  );
  const failedSources = new Set<string>();

  for (const [name, url] of Object.entries(repos)) {
    if (!neededSources.has(name)) continue;
    const target = join(cacheDir, name);
    if (existsSync(target)) {
      console.log(kleur.dim(`  ${name} already cached, skipping clone.`));
    } else {
      const ok = runCommand(`git clone --depth 1 ${url} "${target}"`);
      if (!ok) failedSources.add(name);
    }
  }

  // Symlink each approved skill's SKILL.md into .opencode/skills/<id>/
  let linked = 0;

  for (const skillId of allApproved) {
    const targetLink = join(skillsDir, skillId);
    if (existsSync(targetLink)) continue; // already linked

    const source = skillToSource[skillId];
    if (!source || failedSources.has(source)) continue;

    const cachePath = join(cacheDir, source);
    if (!existsSync(cachePath)) continue;

    let skillPath = findSkillFile(cachePath, skillId);

    if (!skillPath && source === "taste-skill") {
      const dirMap: Record<string, string> = {
        "design-taste-frontend": "taste-skill",
        "minimalist-ui": "minimalist-skill",
        "industrial-brutalist-ui": "brutalist-skill",
        "full-output-enforcement": "output-skill",
        "redesign-existing-projects": "redesign-skill",
        "high-end-visual-design": "soft-skill",
      };
      const repoDir = dirMap[skillId];
      if (repoDir) {
        const directPath = join(cachePath, "skills", repoDir, "SKILL.md");
        if (existsSync(directPath)) skillPath = directPath;
      }
    }
    if (!skillPath && source === "stitch-kit") {
      const directPath = join(
        cachePath, "node_modules", "stitch-kit", "skills", skillId, "SKILL.md",
      );
      if (existsSync(directPath)) skillPath = directPath;
    }
    if (!skillPath && source === "ui-ux-pro-max") {
      const directPath = join(cachePath, "SKILL.md");
      if (existsSync(directPath)) skillPath = directPath;
    }

    if (skillPath && existsSync(skillPath)) {
      mkdirSync(targetLink, { recursive: true });
      const targetSkill = join(targetLink, "SKILL.md");
      try {
        symlinkSync(skillPath, targetSkill);
        linked++;
      } catch {
        try {
          copyFileSync(skillPath, targetSkill);
          linked++;
        } catch {
          // Link/copy failure is reported by the aggregate count below.
        }
      }
    }
  }

  if (linked > 0) {
    console.log(kleur.green(`  ${linked}/${allApproved.length} skill files linked`));
  } else {
    console.log(kleur.dim("  No skill files linked."));
  }
  if (failedSources.size > 0) {
    console.log(
      kleur.yellow(
        `\n⚠ Skill source install incomplete. Failed source(s): ${[...failedSources].join(", ")}`,
      ),
    );
    console.log(kleur.dim("  Optional skill permissions were saved, but source links for those repos were not created."));
  } else {
    console.log(kleur.green("\n✓ Skill sources installed."));
  }
}

// Main exported function
export async function init(args: string[] = []): Promise<void> {
  // Handle flags
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const unknownArg = firstUnknownArg(args);
  if (unknownArg) {
    console.error(kleur.red(`Unknown option: ${unknownArg}`));
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (args.includes("--list")) {
    // Display currently configured Optional skills from .oowl.json
    const install = findOowlInstall(process.cwd());
    if (!install) {
      console.error(kleur.red("No install found."));
      return;
    }
    const oowlJson = readOowlJson(install.installRoot);
    if (
      oowlJson &&
      "optionalSkills" in oowlJson &&
      oowlJson.optionalSkills &&
      typeof oowlJson.optionalSkills === "object" &&
      Object.keys(oowlJson.optionalSkills).length > 0
    ) {
      console.log(kleur.bold("\nCurrently configured Optional skills:"));
      displaySummaryTable(oowlJson.optionalSkills as Record<string, string[]>);
    } else {
      console.log("No Optional skills configured. Run 'oowl init' to set them up.");
    }
    return;
  }

  if (args.includes("--reset")) {
    console.log(kleur.yellow("Resetting Optional skill configuration..."));
    const resetInstall = findOowlInstall(process.cwd());
    if (resetInstall) {
      const existing = readOowlJson(resetInstall.installRoot) || resetInstall.oowl;
      const resetPayload = {
        ...existing,
        optionalSkills: {},
        projectAnswers: undefined,
      } as OowlJson & { optionalSkills: Record<string, string[]>; projectAnswers: undefined };
      writeOowlJson(
        resetInstall.installRoot,
        resetPayload,
      );
    }
  }

  if (args.includes("--apply")) {
    const install = findOowlInstall(process.cwd());
    if (!install) {
      console.error(kleur.red("No install found."));
      process.exitCode = 1;
      return;
    }
    if (!(await applySavedOptionalSkills(install))) {
      process.exitCode = 1;
    }
    return;
  }

  // Prerequisite check
  const hasInstall = await checkPrerequisite();
  if (!hasInstall) return;

  // Discovery path
  const path = await choosePath();
  const answers = path === "describe" ? await describePath() : await questionsPath();

  // Display and confirm
  displayAnswers(answers);
  const confirmed = await confirm({ message: "Is this correct?", default: true });

  if (!confirmed) {
    console.log(kleur.yellow("\nAnswers not confirmed. Re-run 'oowl init' to try again."));
    return;
  }

  // Save projectAnswers to .oowl.json
  const install = findOowlInstall(process.cwd());
  if (install) {
    const existing: OowlJson = readOowlJson(install.installRoot) || {
      version: "1.1.0",
      location: "local",
      profile: "balanced",
      opencodeGo: false,
      installedAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
    writeOowlJson(install.installRoot, {
      ...existing,
      projectAnswers: answers as unknown as Record<string, unknown>,
    });

    // Run recommendation
    console.log(kleur.cyan("\nAnalyzing project profile and generating recommendations..."));
    const raw = recommend(answers);
    const filtered = filterByQualityGate(raw);

    if (Object.keys(filtered).length === 0) {
      console.log(kleur.yellow("\nNo Optional skills recommended for this project configuration."));
      console.log(kleur.dim("You can re-run 'oowl init' with different answers to explore other options."));
      return;
    }

    // Show summary
    displaySummaryTable(filtered);

    // Approval choice
    const action = await select({
      message: "How would you like to proceed?",
      choices: [
        { name: "Approve all — wire these skills now", value: "approve" },
        { name: "Edit — review and toggle individual selections", value: "edit" },
        { name: "Skip — don't configure Optional skills", value: "deny" },
      ],
    });

    let approvedSkills: Record<string, string[]>;
    if (action === "approve") {
      approvedSkills = filtered;
      console.log(kleur.green("✓ All skills approved."));
    } else if (action === "edit") {
      approvedSkills = await editMode(filtered);
      const total = Object.values(approvedSkills).reduce((sum, list) => sum + list.length, 0);
      console.log(kleur.green(`✓ ${total} skills selected across ${Object.keys(approvedSkills).length} agents.`));
    } else {
      approvedSkills = {};
      console.log(kleur.yellow("Optional skills skipped. Required skills still apply."));
    }

    // Save to .oowl.json
    const latest: OowlJson = readOowlJson(install.installRoot) || install.oowl;
    const payload: OowlJson = {
      ...latest,
      projectAnswers: answers as unknown as Record<string, unknown>,
      optionalSkills: approvedSkills,
    };
    writeOowlJson(install.installRoot, payload);

    const openCodeDir =
      install && Object.keys(approvedSkills).length > 0
        ? getOpenCodeDir(
            install.oowl.location,
            process.cwd(),
            install.installRoot,
          )
        : null;

    if (openCodeDir) {
      const jsoncPath = join(openCodeDir, "opencode.jsonc");
      try {
        writeAgentPermissions(jsoncPath, approvedSkills);
        console.log(
          kleur.green(
            `  ✓ Updated opencode.jsonc with ${Object.keys(approvedSkills).length} agent skill permissions`,
          ),
        );
      } catch (err) {
        console.error(
          kleur.red(
            `  ✗ Failed to update opencode.jsonc: ${(err as Error).message}`,
          ),
        );
      }

      // Install skill sources (clone repos + symlink SKILL.md files)
      await runSkillSourceInstalls(openCodeDir!, approvedSkills, loadSkillsRegistry());

      // Write approved skills directly into each agent's .md frontmatter
      // so agents see their Optional skills at session start.
      const agentsDir = join(openCodeDir!, "agents");
      writeAgentSkillPermissions(agentsDir, approvedSkills);
      const finalMetadata = readOowlJson(install.installRoot) || payload;
      finalMetadata.checksums = await buildChecksums(openCodeDir);
      finalMetadata.updatedAt = new Date().toISOString();
      writeOowlJson(install.installRoot, finalMetadata);
      console.log(
        kleur.green(
          `  ✓ Updated ${Object.keys(approvedSkills).length} agent files with skill permissions`,
        ),
      );

      // Restart prompt
      console.log(kleur.bold("\n─────────────────────────────────────────────────"));
      console.log(kleur.bold("  ⚡ Skills installed and permissions written."));
      console.log(kleur.bold("─────────────────────────────────────────────────"));
      console.log(kleur.yellow("\n  Restart your OpenCode session to load the new skills."));
      console.log(kleur.dim("  Close and reopen OpenCode, or press Ctrl+R to reload."));
      console.log("");
    } else {
      console.log(kleur.gray("No Optional skills configured."));
    }
  } else {
    console.error(kleur.red("Could not find oowl install."));
  }
}
