import test from "node:test";
import assert from "node:assert/strict";
import { init } from "../../src/commands/init.js";

test("init rejects flags because it is wizard-only", async () => {
  await assert.rejects(
    () => init(["--global"]),
    /wizard-only and does not accept flags/,
  );
});
