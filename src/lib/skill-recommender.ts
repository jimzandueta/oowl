import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FRAMEWORK_DIR } from "./paths.js";

export interface ProjectAnswers {
  projectType: "web" | "api" | "fullstack" | "mobile" | "cli" | "data" | "other";
  frontend: "next" | "react" | "vue" | "svelte" | "expo" | "vanilla" | "none";
  backend: string | null;
  cloud: "cloudflare" | "aws" | "vercel-netlify" | "self-hosted" | "multi" | "none";
  database: "postgres" | "neon" | "clickhouse" | "mysql" | "mongodb" | "sqlite" | "none";
  priorities: Array<"security" | "performance" | "ui-polish" | "mobile" | "devex" | "data-integrity" | "engagement">;
  _source?: "describe" | "questions";
}

const EXCLUDED_AGENTS = new Set([
  "dispatcher",
  "builder",
  "plan-reviewer",
  "low-engineer",
  "low-task-worker",
  "low-architect",
  "low-designer",
]);

export const SKILLS_REGISTRY_PATH = join(FRAMEWORK_DIR, "skills-registry.json");

export function loadSkillsRegistry(): any[] {
  if (!existsSync(SKILLS_REGISTRY_PATH)) return [];
  try {
    return JSON.parse(readFileSync(SKILLS_REGISTRY_PATH, "utf8"));
  } catch {
    return [];
  }
}

export function getQualityGatedSkills(): Set<string> {
  const registry = loadSkillsRegistry();
  const gated = new Set<string>();

  for (const entry of registry) {
    if (entry.qualityGate?.passed === true) {
      gated.add(entry.id);
    }
  }

  return gated;
}

/**
 * Deterministic recommendation engine using skills from taste-skill, 
 * wshobson-agents, and ui-ux-pro-max. No catalog-based skills.
 */
export function recommend(answers: ProjectAnswers): Record<string, string[]> {
  const results: Record<string, string[]> = {};

  function add(agent: string, skill: string): void {
    if (EXCLUDED_AGENTS.has(agent)) return;
    if (!results[agent]) results[agent] = [];
    if (!results[agent].includes(skill)) results[agent].push(skill);
  }

  const fe = answers.frontend;
  const cloud = answers.cloud;
  const db = answers.database;
  const priorities = answers.priorities;
  const backend = answers.backend;

  // === FRONTEND RULES ===
  if (fe !== "none") {
    add("frontend-engineer", "responsive-design");
    add("frontend-polisher", "responsive-design");
    add("frontend-polisher", "interaction-design");
    add("designer", "interaction-design");
    add("high-designer", "interaction-design");
    add("designer", "visual-design-foundations");
    add("frontend-polisher", "visual-design-foundations");
    add("high-designer", "visual-design-foundations");
    add("designer", "mobile-ios-design");
    add("high-designer", "mobile-ios-design");
    add("designer", "design-system-patterns");
    add("high-designer", "design-system-patterns");
    add("frontend-engineer", "design-taste-frontend");
    add("frontend-polisher", "design-taste-frontend");
    add("frontend-polisher", "high-end-visual-design");
    add("frontend-polisher", "redesign-existing-projects");
    add("designer", "redesign-existing-projects");
    add("high-designer", "redesign-existing-projects");
    add("designer", "minimalist-ui");
    add("frontend-polisher", "minimalist-ui");
  }

  if (fe === "expo" || fe === "next" || fe === "react") {
    add("frontend-engineer", "e2e-testing-patterns");
    add("test-engineer", "e2e-testing-patterns");
  }

  // === CLOUD RULES ===
  if (cloud !== "none") {
    add("cloud-architect", "multi-cloud-architecture");
    add("high-architect", "multi-cloud-architecture");
    add("cloud-architect", "terraform-module-library");
    add("cloud-architect", "cost-optimization");
    add("high-architect", "cost-optimization");
    add("cloud-architect", "prometheus-configuration");
    add("cloud-architect", "grafana-dashboards");
    add("high-architect", "grafana-dashboards");
    add("cloud-architect", "distributed-tracing");
    add("high-architect", "distributed-tracing");
    add("cloud-architect", "slo-implementation");
    add("high-architect", "slo-implementation");
    add("cloud-architect", "service-mesh-observability");
    add("cloud-architect", "deployment-pipeline-design");
    add("cloud-architect", "secrets-management");
    add("backend-engineer", "secrets-management");
    add("cloud-architect", "hybrid-cloud-networking");
    add("cloud-architect", "incident-runbook-templates");
    add("cloud-architect", "on-call-handoff-patterns");
    add("cloud-architect", "github-actions-templates");
    add("cloud-architect", "gitlab-ci-patterns");
    add("backend-engineer", "github-actions-templates");
  }

  // === DATABASE RULES ===
  if (db !== "none") {
    add("database-engineer", "postgresql-table-design");
    add("architect", "postgresql-table-design");
    add("database-engineer", "sql-optimization-patterns");
    add("backend-engineer", "sql-optimization-patterns");
    add("database-engineer", "database-migration");
    add("architect", "database-migration");
  }

  // === BACKEND RULES ===
  if (backend && backend.trim().length > 0) {
    add("backend-engineer", "api-design-principles");
    add("code-reviewer", "api-design-principles");
    add("backend-engineer", "debugging-strategies");
    add("high-engineer", "debugging-strategies");
    add("backend-engineer", "error-handling-patterns");
    add("frontend-engineer", "error-handling-patterns");
    add("high-engineer", "error-handling-patterns");
    add("backend-engineer", "dependency-upgrade");
    add("code-reviewer", "dependency-upgrade");
    add("high-engineer", "dependency-upgrade");
    add("test-engineer", "python-testing-patterns");
    add("backend-engineer", "python-testing-patterns");
    add("test-engineer", "javascript-testing-patterns");
    add("frontend-engineer", "javascript-testing-patterns");
  }

  // === PRIORITY RULES ===
  if (priorities.includes("performance")) {
    add("backend-engineer", "debugging-strategies");
    add("high-engineer", "debugging-strategies");
    add("cloud-architect", "distributed-tracing");
    add("high-architect", "distributed-tracing");
  }

  if (priorities.includes("ui-polish")) {
    add("frontend-polisher", "interaction-design");
    add("designer", "interaction-design");
    add("frontend-polisher", "high-end-visual-design");
    add("high-designer", "high-end-visual-design");
  }

  if (priorities.includes("devex")) {
    add("high-engineer", "monorepo-management");
    add("cloud-architect", "deployment-pipeline-design");
  }

  if (priorities.includes("data-integrity")) {
    add("database-engineer", "database-migration");
    add("architect", "database-migration");
  }

  // === ALWAYS-ON RULES ===
  add("frontend-engineer", "full-output-enforcement");
  add("backend-engineer", "full-output-enforcement");
  add("high-engineer", "full-output-enforcement");
  add("architect", "architecture-patterns");
  add("high-architect", "architecture-patterns");
  add("architect", "microservices-patterns");
  add("high-architect", "microservices-patterns");
  add("architect", "workflow-orchestration-patterns");
  add("planner", "workflow-orchestration-patterns");
  add("architect", "event-store-design");
  add("database-engineer", "event-store-design");
  add("architect", "cqrs-implementation");
  add("architect", "saga-orchestration");
  add("backend-engineer", "saga-orchestration");
  add("architect", "architecture-decision-records");
  add("high-architect", "architecture-decision-records");
  add("code-reviewer", "code-review-excellence");
  add("reviewer", "code-review-excellence");
  add("reviewer", "changelog-automation");
  add("reviewer", "postmortem-writing");
  add("high-engineer", "postmortem-writing");
  add("high-engineer", "monorepo-management");
  add("planner", "monorepo-management");
  // Note: architecture principles (Clean Architecture, DDD, Pragmatic Programmer)
  // are provided via framework/prompts/engineering/architecture-principles.md instructions.

  return results;
}

export function filterByQualityGate(recommendations: Record<string, string[]>): Record<string, string[]> {
  const gatedSkills = getQualityGatedSkills();
  const filtered: Record<string, string[]> = {};

  for (const [agent, skills] of Object.entries(recommendations)) {
    const filteredSkills = skills.filter((skill) => gatedSkills.has(skill));
    if (filteredSkills.length > 0) {
      filtered[agent] = filteredSkills;
    }
  }

  return filtered;
}
