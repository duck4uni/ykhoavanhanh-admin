# Time Slot Editor Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the time range and appointment capacity enough responsive space so their controls never overlap.

**Architecture:** Replace the equal three-column row with a flexible time-range group plus a dedicated capacity column. Ensure the reusable time controls can shrink within CSS grid tracks by applying `min-w-0` at the label, wrapper, and select levels.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: Responsive time-range controls

**Files:**
- Modify: `src/app/(dashboard)/appointments/new/_components/TimeSlotSection.tsx`
- Modify: `src/app/(dashboard)/appointments/new/_components/TimeSelect.tsx`

- [ ] Group start/end controls under `Thời gian khám` with a decorative arrow between them.
- [ ] Place capacity in a dedicated responsive column that stacks below the range on narrower widths.
- [ ] Add `min-w-0` to the relevant grid children and reusable time-select elements.
- [ ] Preserve all values, handlers, validation, and payload behavior.
- [ ] Run `npm run type-check` and `git diff --check`.
