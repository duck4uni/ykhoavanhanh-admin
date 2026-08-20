import assert from "node:assert/strict";
import test from "node:test";
import { buildServiceSearchFilter } from "./serviceSearchFilter";

test("uses service_id for a numeric keyword", () => {
  assert.equal(buildServiceSearchFilter("1234"), "service_id@=1234");
});

test("trims a numeric keyword before building the filter", () => {
  assert.equal(buildServiceSearchFilter("  1234  "), "service_id@=1234");
});

test("uses service_name for a non-numeric keyword", () => {
  assert.equal(buildServiceSearchFilter("Khám tổng quát"), "service_name@=Khám tổng quát");
});

test("returns no filter for an empty keyword", () => {
  assert.equal(buildServiceSearchFilter("   "), undefined);
});
