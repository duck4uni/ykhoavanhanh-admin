import assert from "node:assert/strict";
import test from "node:test";
import { isDuplicateScope } from "./scopeIdentity";

const base = {
  clientId: "scope-1",
  specialty_id: "specialty-1",
  area_id: "area-1",
  room_id: "room-1",
  service_id: "service-001122",
  price_level_code: "VIP",
};

test("allows the same service with a different price-level code", () => {
  assert.equal(isDuplicateScope([base], { ...base, clientId: "", price_level_code: "DV" }, null), false);
});

test("rejects the same service and price-level code", () => {
  assert.equal(isDuplicateScope([base], { ...base, clientId: "" }, null), true);
});

test("allows a different service", () => {
  assert.equal(isDuplicateScope([base], { ...base, clientId: "", service_id: "service-123456" }, null), false);
});

test("ignores the scope currently being edited", () => {
  assert.equal(isDuplicateScope([base], base, "scope-1"), false);
});
