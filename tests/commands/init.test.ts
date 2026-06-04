import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "../../src/commands/init.js";
import { install } from "../../src/commands/install.js";
import { profile } from "../../src/commands/profile.js";
import { update } from "../../src/commands/update.js";

test("init --help prints init command usage", async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    await init(["--help"]);
  } finally {
    console.log = originalLog;
  }

  const output = logs.join("\n");
  assert.match(output, /Usage: oowl init/);
  assert.match(output, /--list/);
  assert.match(output, /--reset/);
  assert.match(output, /--apply/);
});

test("command-specific help flags print usage without entering interactive flows", async () => {
  const cases = [
    {
      run: () => install(["--help"]),
      pattern: /Usage: oowl install/,
    },
    {
      run: () => profile(["--help"]),
      pattern: /Usage: oowl profile/,
    },
    {
      run: () => update(["--help"]),
      pattern: /Usage: oowl update/,
    },
  ];

  for (const command of cases) {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      await command.run();
    } finally {
      console.log = originalLog;
    }

    assert.match(logs.join("\n"), command.pattern);
  }
});

test("init --list handles current install state", async () => {
  const errors: string[] = [];
  const logs: string[] = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(" "));
  };
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    await init(["--list"]);
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }

  const combined = `${errors.join("\n")}\n${logs.join("\n")}`;
  assert.match(
    combined,
    /(No install found\.|No Optional skills configured\.|Currently configured Optional skills:)/,
  );
});

test("init --apply rewrites optional skill permissions from metadata", async () => {
  const dir = mkdtempSync(join(tmpdir(), "oowl-init-"));
  const previousCwd = process.cwd();
  const previousExitCode = process.exitCode;

  mkdirSync(join(dir, ".opencode", "agents"), { recursive: true });
  writeFileSync(
    join(dir, ".opencode", "opencode.jsonc"),
    JSON.stringify({ model: "test-model", permission: { "*": "ask" } }),
    "utf8",
  );
  writeFileSync(
    join(dir, ".opencode", "agents", "frontend-engineer.md"),
    [
      "---",
      "description: Frontend implementation specialist.",
      "permission:",
      "  skill:",
      '    "*": allow',
      "  task:",
      '    "*": deny',
      "---",
      "",
      "# Frontend Engineer",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(dir, ".oowl.json"),
    JSON.stringify(
      {
        version: "1.1.3",
        location: "local",
        profile: "balanced",
        opencodeGo: true,
        installedAt: "",
        updatedAt: "",
        optionalSkills: {
          "frontend-engineer": ["responsive-design"],
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  process.chdir(dir);
  try {
    await init(["--apply"]);
  } finally {
    process.chdir(previousCwd);
    process.exitCode = previousExitCode;
  }

  const config = JSON.parse(
    readFileSync(join(dir, ".opencode", "opencode.jsonc"), "utf8"),
  );
  assert.equal(
    config.agent["frontend-engineer"].permission.skill["responsive-design"],
    "allow",
  );
  const agent = readFileSync(
    join(dir, ".opencode", "agents", "frontend-engineer.md"),
    "utf8",
  );
  assert.match(agent, /"responsive-design": allow/);
  assert.match(agent, /## Skill Initialization/);

  rmSync(dir, { recursive: true, force: true });
});

test("init command source does not contain old install wizard selectors", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "init.ts"),
    "utf8",
  );

  assert.ok(!source.includes("chooseLocation"));
  assert.ok(!source.includes("chooseProfile"));
});

test("init command source contains both discovery paths", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "init.ts"),
    "utf8",
  );

  assert.ok(source.includes("function parseDescription"));
  assert.ok(source.includes("async function questionsPath"));
  assert.ok(source.includes("async function choosePath"));
});

test("init command source wires recommendation engine and approval UX", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "init.ts"),
    "utf8",
  );

  assert.ok(source.includes("recommend"));
  assert.ok(source.includes("filterByQualityGate"));
  assert.ok(source.includes("function displaySummaryTable"));
  assert.ok(source.includes("async function editMode"));
  assert.ok(source.includes('value: "approve"'));
  assert.ok(source.includes('value: "edit"'));
  assert.ok(source.includes('value: "deny"'));
  assert.ok(source.includes("optionalSkills: approvedSkills"));
});

test("init command source imports ProjectAnswers from skill recommender", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "init.ts"),
    "utf8",
  );

  assert.ok(source.includes('from "../lib/skill-recommender.js"'));
  assert.ok(source.includes("import type { ProjectAnswers }"));
  assert.ok(!source.includes("interface ProjectAnswers {"));
});

test("init command source reset handler clears optionalSkills and projectAnswers", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "init.ts"),
    "utf8",
  );

  assert.ok(source.includes("Resetting Optional skill configuration..."));
  assert.ok(source.includes("optionalSkills: {}"));
  assert.ok(source.includes("projectAnswers: undefined"));
});

test("cli source registers install command and updated help text", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "cli.ts"),
    "utf8",
  );

  assert.ok(source.includes("install: args => import('./commands/install.js').then(m => m.install(args))"));
  assert.ok(source.includes("profile: args => import('./commands/profile.js').then(m => m.profile(args))"));
  assert.ok(source.includes("update: args => import('./commands/update.js').then(m => m.update(args))"));
  assert.ok(source.includes("Install the OOWL multi-agent framework"));
  assert.ok(source.includes("Configure Optional skills for your project"));
  assert.ok(source.includes("npx @jimzandueta/oowl install"));
  assert.ok(!source.includes("npx @jimzandueta/oowl init"));
});

test("profile command source includes free profile warning", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "profile.ts"),
    "utf8",
  );

  assert.ok(source.includes('"free"'));
  assert.ok(source.includes("free-data will be used in training"));
  assert.ok(source.includes("profileChoiceName"));
});

test("install command defaults to low and offers free profile path", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "install.ts"),
    "utf8",
  );

  assert.ok(source.includes('const DEFAULT_PROFILE = "low"'));
  assert.ok(source.includes("FREE_PROFILE"));
  assert.ok(source.includes("Without OpenCode Go, use the free profile"));
});

test("init command source wires opencode config writer after approval", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "commands", "init.ts"),
    "utf8",
  );

  assert.ok(source.includes("writeAgentPermissions"));
  assert.ok(source.includes("getOpenCodeDir"));
  assert.ok(source.includes("opencode.jsonc"));
  assert.ok(source.includes("Failed to update opencode.jsonc"));
});
