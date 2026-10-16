import { test } from "node:test";
import assert from "node:assert/strict";
import { checkNeonEnvironment } from "./check-neon-env.mjs";

const productionUrl = "https://ep-fancy-cell-b9b0twp6.c-7.eu-central-1.aws.neon.tech/focus_flow";
const previewUrl = "https://ep-odd-water-b9jlfq77.c-7.eu-central-1.aws.neon.tech/focus_flow";

test("production only accepts the production Neon endpoint", () => {
  assert.equal(checkNeonEnvironment({ target: "production", baseUrl: productionUrl }).ok, true);
  assert.equal(checkNeonEnvironment({ target: "production", baseUrl: previewUrl }).ok, false);
  assert.equal(checkNeonEnvironment({ target: "production", baseUrl: undefined }).ok, false);
});

test("preview only accepts the preview Neon endpoint", () => {
  assert.equal(checkNeonEnvironment({ target: "preview", baseUrl: previewUrl }).ok, true);
  assert.equal(checkNeonEnvironment({ target: "preview", baseUrl: productionUrl }).ok, false);
});

test("rejects credentials, non-HTTPS, and altered path", () => {
  for (const bad of [
    "http://ep-fancy-cell-b9b0twp6.c-7.eu-central-1.aws.neon.tech/focus_flow",
    "https://admin:password@ep-fancy-cell-b9b0twp6.c-7.eu-central-1.aws.neon.tech/focus_flow",
    productionUrl + "/other",
    productionUrl + "?oops=true",
    "postgresql://user:password@hostname/database",
  ]) {
    assert.equal(checkNeonEnvironment({ target: "production", baseUrl: bad }).ok, false);
  }
});

test("local development remains usable without a Neon account", () => {
  assert.equal(checkNeonEnvironment({ target: undefined, baseUrl: undefined }).ok, true);
  assert.equal(checkNeonEnvironment({ target: "development", baseUrl: undefined }).ok, true);
});
