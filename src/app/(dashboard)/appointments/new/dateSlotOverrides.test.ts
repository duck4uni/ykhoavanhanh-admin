import assert from "node:assert/strict";
import test from "node:test";
import {
  getDateSlotLimit,
  reconcileDateOverrides,
  setDateSlotLimit,
} from "./dateSlotOverrides";

test("creates and updates an override", () => {
  const created = setDateSlotLimit([], "2026-08-27", 15, 20);
  assert.deepEqual(created, [{ date: "2026-08-27", slot_limit: 15 }]);
  assert.deepEqual(setDateSlotLimit(created, "2026-08-27", 25, 20), [{ date: "2026-08-27", slot_limit: 25 }]);
});

test("removes an override when restored to the default", () => {
  assert.deepEqual(setDateSlotLimit([{ date: "2026-08-27", slot_limit: 15 }], "2026-08-27", 20, 20), []);
});

test("resolves an override or the default", () => {
  const overrides = [{ date: "2026-08-27", slot_limit: 15 }];
  assert.equal(getDateSlotLimit(overrides, "2026-08-27", 20), 15);
  assert.equal(getDateSlotLimit(overrides, "2026-09-03", 20), 20);
});

test("removes overrides for unselected dates and values matching a new default", () => {
  assert.deepEqual(
    reconcileDateOverrides(
      [
        { date: "2026-08-20", slot_limit: 20 },
        { date: "2026-08-27", slot_limit: 15 },
        { date: "2026-09-03", slot_limit: 25 },
      ],
      ["2026-08-20", "2026-08-27"],
      20
    ),
    [{ date: "2026-08-27", slot_limit: 15 }]
  );
});
