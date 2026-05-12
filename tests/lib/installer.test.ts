import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findOowlInstall,
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

function makeFrameworkDir() {
  const frameworkDir = makeTempDir();
  mkdirSync(join(frameworkDir, "agents", "01-test"), { recursive: true });
  mkdirSync(join(frameworkDir, "commands", "01-workflow"), { recursive: true });
  mkdirSync(join(frameworkDir, "prompts", "shared"), { recursive: true });
  mkdirSync(join(frameworkDir, "model-profiles"), { recursive: true });
  writeFileSync(
    join(frameworkDir, "agents", "01-test", "dispatcher.md"),
    "---\nmodel: test\n---\nBody\n",
  );
  writeFileSync(join(frameworkDir, "agents", "README.md"), "# Agents readme");
  writeFileSync(
    join(frameworkDir, "commands", "01-workflow", "build.md"),
    "# Build",
  );
  writeFileSync(
    join(frameworkDir, "commands", "README.md"),
    "# Commands readme",
  );
  writeFileSync(
    join(frameworkDir, "prompts", "shared", "model-strategy.md"),
    "# Strategy",
  );
  writeFileSync(join(frameworkDir, "model-profiles", "balanced.json"), "{}");
  writeFileSync(join(frameworkDir, "profile-models.json"), "{}");
  writeFileSync(join(frameworkDir, "opencode.jsonc"), "{}");
  writeFileSync(join(frameworkDir, "AGENTS.md"), "# Agents");
  return frameworkDir;
}

describe("readOowlJson / writeOowlJson", () => {
  it("round-trips data", () => {
    const dir = makeTempDir();
    const data = {
      version: "1.1.0",
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

describe("findOowlInstall", () => {
  it("finds local install metadata first", () => {
    const cwd = makeTempDir();
    const globalDir = makeTempDir();
    writeOowlJson(cwd, {
      version: "1.1.0",
      location: "local",
      profile: "low",
      opencodeGo: false,
      installedAt: "",
      updatedAt: "",
    });
    writeOowlJson(globalDir, {
      version: "1.1.0",
      location: "global",
      profile: "high",
      opencodeGo: false,
      installedAt: "",
      updatedAt: "",
    });

    const found = findOowlInstall(cwd, globalDir);
    assert.equal(found?.installRoot, cwd);
    assert.equal(found?.openCodeDir, join(cwd, ".opencode"));
    assert.equal(found?.oowl.profile, "low");
    rmSync(cwd, { recursive: true });
    rmSync(globalDir, { recursive: true });
  });

  it("falls back to global install metadata", () => {
    const cwd = makeTempDir();
    const globalDir = makeTempDir();
    writeOowlJson(globalDir, {
      version: "1.1.0",
      location: "global",
      profile: "high",
      opencodeGo: false,
      installedAt: "",
      updatedAt: "",
    });

    const found = findOowlInstall(cwd, globalDir);
    assert.equal(found?.installRoot, globalDir);
    assert.equal(found?.openCodeDir, globalDir);
    assert.equal(found?.oowl.profile, "high");
    rmSync(cwd, { recursive: true });
    rmSync(globalDir, { recursive: true });
  });
});

describe("install", () => {
  it("creates opencode dir with agents subdir", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeFrameworkDir();

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
    });

    assert.ok(existsSync(join(cwd, ".opencode", "agents")));
    assert.ok(existsSync(join(cwd, ".opencode", "agents", "dispatcher.md")));
    assert.ok(
      !existsSync(join(cwd, ".opencode", "agents", "test", "dispatcher.md")),
    );
    assert.ok(!existsSync(join(cwd, ".opencode", "agents", "README.md")));
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("writes .oowl.json to install root", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeFrameworkDir();

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
    const frameworkDir = makeFrameworkDir();

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
    });

    assert.ok(existsSync(join(cwd, ".opencode", "opencode.jsonc")));
    assert.ok(!existsSync(join(cwd, "opencode.jsonc")));
    assert.ok(existsSync(join(cwd, "AGENTS.md")));
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("copies opencode.jsonc and AGENTS.md for global install", async () => {
    const globalDir = makeTempDir();
    const frameworkDir = makeFrameworkDir();

    await install({
      location: "global",
      cwd: globalDir,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
      globalDir,
      force: true,
    });

    assert.ok(existsSync(join(globalDir, "opencode.jsonc")));
    assert.ok(existsSync(join(globalDir, "AGENTS.md")));
    rmSync(globalDir, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("refuses an existing target without force", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeFrameworkDir();
    mkdirSync(join(cwd, ".opencode"), { recursive: true });

    await assert.rejects(
      () =>
        install({
          location: "local",
          cwd,
          frameworkDir,
          profile: "low",
          opencodeGo: false,
        }),
      /Target already exists/,
    );

    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("overwrites an existing target with force", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeFrameworkDir();
    mkdirSync(join(cwd, ".opencode"), { recursive: true });
    writeFileSync(join(cwd, ".opencode", "old.md"), "old");

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
      force: true,
    });

    assert.ok(!existsSync(join(cwd, ".opencode", "old.md")));
    assert.ok(existsSync(join(cwd, ".opencode", "agents", "dispatcher.md")));
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });

  it("skips opencode.jsonc when installJsonc is false", async () => {
    const cwd = makeTempDir();
    const frameworkDir = makeFrameworkDir();

    await install({
      location: "local",
      cwd,
      frameworkDir,
      profile: "low",
      opencodeGo: false,
      installJsonc: false,
    });

    assert.ok(!existsSync(join(cwd, ".opencode", "opencode.jsonc")));
    assert.ok(existsSync(join(cwd, "AGENTS.md")));
    rmSync(cwd, { recursive: true });
    rmSync(frameworkDir, { recursive: true });
  });
});
