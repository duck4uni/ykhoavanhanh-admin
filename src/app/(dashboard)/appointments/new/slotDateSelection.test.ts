import assert from "node:assert/strict";
import test from "node:test";
import {
  reconcileSelectedDates,
  toggleSpecificDate,
  toggleWeekdayDates,
} from "./slotDateSelection";

test("selecting a weekday selects all of its dates", () => {
  assert.deepEqual(
    toggleWeekdayDates(["2026-08-18"], ["2026-08-17", "2026-08-24"], true),
    ["2026-08-17", "2026-08-18", "2026-08-24"]
  );
});

test("removing a weekday removes all of its dates", () => {
  assert.deepEqual(
    toggleWeekdayDates(["2026-08-17", "2026-08-18", "2026-08-24"], ["2026-08-17", "2026-08-24"], false),
    ["2026-08-18"]
  );
});

test("toggles an individual date", () => {
  assert.deepEqual(toggleSpecificDate(["2026-08-17"], "2026-08-24"), ["2026-08-17", "2026-08-24"]);
  assert.deepEqual(toggleSpecificDate(["2026-08-17", "2026-08-24"], "2026-08-17"), ["2026-08-24"]);
});

test("removes dates outside the current range", () => {
  assert.deepEqual(
    reconcileSelectedDates(["2026-08-17", "2026-09-14"], ["2026-08-17", "2026-08-24"]),
    ["2026-08-17"]
  );
});
