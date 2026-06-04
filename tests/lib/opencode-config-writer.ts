import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  writeFileSync,
  unlinkSync,
  readFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  writeAgentPermissions,
  writeAgentSkillPermissions,
  validateAgentPermissions,
} from "../../src/lib/opencode-config-writer.js";

function createTempJsonc(initial: string): string {
  const dir = mkdtempSync(join(tmpdir(), "oowl-test-"));
  const filePath = join(dir, "opencode.jsonc");
  writeFileSync(filePath, initial, "utf8");
  return filePath;
}

describe("opencode-config-writer", () => {
  it("writeAgentPermissions adds new agent permission blocks", () => {
    const initial = JSON.stringify({
      model: "opencode-go/deepseek-v4-flash",
      permission: { "*": "ask" },
    });
    const path = createTempJsonc(initial);

    writeAgentPermissions(path, {
      "frontend-engineer": ["composition-patterns"],
    });

    const content = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(
      content.agent["frontend-engineer"].permission.skill["composition-patterns"],
      "allow",
    );
    assert.equal(content.model, "opencode-go/deepseek-v4-flash");

    unlinkSync(path);
  });

  it("writeAgentPermissions merges with existing agent blocks", () => {
    const initial = JSON.stringify({
      agent: {
        "frontend-engineer": {
          permission: {
            skill: {
              "react-best-practices": "allow",
            },
          },
        },
      },
    });
    const path = createTempJsonc(initial);

    writeAgentPermissions(path, {
      "frontend-engineer": ["composition-patterns"],
    });

    const content = JSON.parse(readFileSync(path, "utf8"));
    const skills = content.agent["frontend-engineer"].permission.skill;
    assert.equal(skills["react-best-practices"], "allow");
    assert.equal(skills["composition-patterns"], "allow");

    unlinkSync(path);
  });

  it("writeAgentPermissions is idempotent", () => {
    const initial = JSON.stringify({
      agent: {},
      permission: { "*": "ask" },
    });
    const path = createTempJsonc(initial);

    writeAgentPermissions(path, { architect: ["senior-architect"] });
    const first = readFileSync(path, "utf8");

    writeAgentPermissions(path, { architect: ["senior-architect"] });
    const second = readFileSync(path, "utf8");

    assert.equal(first, second);
    unlinkSync(path);
  });

  it("writeAgentPermissions throws on non-existent file", () => {
    assert.throws(() => {
      writeAgentPermissions("/nonexistent/opencode.jsonc", {});
    }, /not found/);
  });

  it("validateAgentPermissions returns false for non-allow permissions", () => {
    const invalid = {
      agent: {
        "frontend-engineer": {
          permission: {
            skill: { "composition-patterns": "deny" },
          },
        },
      },
    };
    assert.equal(validateAgentPermissions(invalid), false);
  });

  it("validateAgentPermissions returns true for all-allow permissions", () => {
    const valid = {
      agent: {
        "frontend-engineer": {
          permission: {
            skill: { "composition-patterns": "allow" },
          },
        },
      },
    };
    assert.equal(validateAgentPermissions(valid), true);
  });

  it("validateAgentPermissions returns true when no agent block", () => {
    assert.equal(validateAgentPermissions({ model: "test" }), true);
  });

  it("writeAgentSkillPermissions preserves existing required skill entries", () => {
    const dir = mkdtempSync(join(tmpdir(), "oowl-test-"));
    const agentsDir = join(dir, "agents");
    mkdirSync(agentsDir, { recursive: true });
    const agentPath = join(agentsDir, "frontend-engineer.md");
    writeFileSync(
      agentPath,
      [
        "---",
        "description: Frontend implementation specialist.",
        "permission:",
        "  skill:",
        '    "*": allow',
        '    "test-driven-development": allow',
        "  task:",
        '    "*": deny',
        "---",
        "",
        "# Frontend Engineer",
        "",
      ].join("\n"),
      "utf8",
    );

    writeAgentSkillPermissions(agentsDir, {
      "frontend-engineer": ["responsive-design"],
    });

    const content = readFileSync(agentPath, "utf8");
    assert.match(content, /"\*": allow/);
    assert.match(content, /"test-driven-development": allow/);
    assert.match(content, /"responsive-design": allow/);

    rmSync(dir, { recursive: true, force: true });
  });
});
