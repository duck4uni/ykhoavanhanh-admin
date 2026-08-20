import assert from "node:assert/strict";
import test from "node:test";
import { formatServicePriceLevelOptionLabel } from "./servicePriceLevelLabel";

const service = { servicename: "Khám MeU", serviceid: "123456" };

test("includes the service name in a price-level option label", () => {
  assert.equal(
    formatServicePriceLevelOptionLabel(service, { label: "Khám VIP", price: 250_000 }),
    "Khám MeU - Khám VIP - 250.000đ - (123456)"
  );
});

test("uses a dash when the price-level label is missing", () => {
  assert.equal(
    formatServicePriceLevelOptionLabel(service, { label: "", price: 250_000 }),
    "Khám MeU - — - 250.000đ - (123456)"
  );
});
