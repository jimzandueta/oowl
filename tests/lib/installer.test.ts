import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  install,
  readOowlJson,
  writeOowlJson,
} from "../../src/lib/installer.js";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function makeTempDir() {
  const dir = join(
    tmpdir(),
    `oowl-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("readOowlJson / writeOowlJson", () => {
  it("round-trips data", () => {
    const dir = makeTempDir();
    const data = {
      version: "1.0.7",
      location: "local" as const,
      profile: "low",
      opencodeGo: false,
      installedAt: "",
      updatedAt: "",
    };
    writeOowlJson(dir, data);
    const read = readOowlJson(dir);
    assert.deepEqual(read, data);
    rmSync(dir, { recursive: true });
  });

  it("readOowlJson returns null when file absent", () => {
    const dir = makeTempDir();
    assert.equal(readOowlJson(dir), null);
    rmSync(dir, { recursive: true });
  });
});

describe("install", () => {
  it("creates opencode dir with agents subdir", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeTempDir();
    mkdirSync(join(frameworkDir, "agents", "01-test"), { recursive: true });
    writeFileSync(
      join(frameworkDir, "agents", "01-test", "dispatcher.md"),
      "---\nmodel: test\n---\nBody\n",
    );

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
    });

    assert.ok(existsSync(join(cwd, ".opencode", "agents")));
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("writes .oowl.json to install root", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeTempDir();
    mkdirSync(join(frameworkDir, "agents"), { recursive: true });

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
    });

    const oowl = readOowlJson(cwd);
    assert.ok(oowl !== null);
    assert.equal(oowl.location, "local");
    assert.equal(oowl.profile, "low");
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("copies opencode.jsonc and AGENTS.md for local install", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeTempDir();
    mkdirSync(join(frameworkDir, "agents"), { recursive: true });
    writeFileSync(join(frameworkDir, "opencode.jsonc"), "{}");
    writeFileSync(join(frameworkDir, "AGENTS.md"), "# Agents");

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
    });

    assert.ok(existsSync(join(cwd, "opencode.jsonc")));
    assert.ok(existsSync(join(cwd, "AGENTS.md")));
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("copies opencode.jsonc but not AGENTS.md for global install", async () => {
    const globalDir = makeTempDir();
    const frameworkDir = makeTempDir();
    mkdirSync(join(frameworkDir, "agents"), { recursive: true });
    writeFileSync(join(frameworkDir, "opencode.jsonc"), "{}");
    writeFileSync(join(frameworkDir, "AGENTS.md"), "# Agents");

    await install({
      location: "global",
      cwd: globalDir,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
      globalDir,
    });

    assert.ok(existsSync(join(globalDir, "opencode.jsonc")));
    assert.ok(!existsSync(join(globalDir, "AGENTS.md")));
    rmSync(globalDir, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });
});
