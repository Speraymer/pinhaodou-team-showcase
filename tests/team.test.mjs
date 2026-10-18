import assert from "node:assert/strict";
import test from "node:test";
import { TEAM } from "../src/team.js";

test("the public constellation exposes exactly ten safe member routes", () => {
  assert.equal(TEAM.length, 10);
  assert.equal(new Set(TEAM.map(({ slug }) => slug)).size, 10);
  assert.equal(TEAM.filter(({ featured }) => featured).length, 1);
  assert.equal(TEAM.find(({ featured }) => featured)?.slug, "ying");
  assert.equal(TEAM.some(({ avatar }) => /\d{5,}/.test(avatar)), false);
});
