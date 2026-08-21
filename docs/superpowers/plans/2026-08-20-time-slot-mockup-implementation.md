# Time Slot Mockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use product-design:image-to-code and superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the supplied working-hours editor mockup while preserving existing schedule behavior.

**Architecture:** Refine the existing `TimeSlotSection` and `SummaryCard` components rather than introducing a parallel screen. Use existing Lucide icons and design tokens, and keep all controller state and handlers unchanged.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React

---

### Task 1: Time-slot card fidelity

**Files:**
- Modify: `src/app/(dashboard)/appointments/new/_components/TimeSlotSection.tsx`
- Modify: `src/app/(dashboard)/appointments/new/_components/TimeSelect.tsx`

- [ ] Make the primary add action solid blue and retain the secondary auto-generate action.
- [ ] Replace textual summary separators with icon-backed time, capacity, weekday-count, and selected-weekday summaries.
- [ ] Lay out time range, capacity, and scope controls as three responsive groups.
- [ ] Render selected weekdays with solid primary styling and check icons.
- [ ] Render concrete dates as chips, limiting each weekday row and appending `+N` for hidden dates.
- [ ] Preserve collapse, delete, update, validation, scope, and weekday handlers.

### Task 2: Summary sidebar fidelity

**Files:**
- Modify: `src/app/(dashboard)/appointments/new/_components/SummaryCard.tsx`
- Modify: `src/app/(dashboard)/appointments/new/_components/ScheduleEditorPage.tsx`

- [ ] Rename the sidebar heading to `Thông tin cấu hình` and match the clean key-value hierarchy.
- [ ] Keep the info/warning block and primary/secondary actions functional.
- [ ] Adjust the desktop content/sidebar proportions to match the selected mockup.

### Task 3: Verification and visual QA

- [ ] Run `npm run type-check` and `git diff --check`.
- [ ] Run the local app and capture the edit screen at the target desktop viewport when browser access is available.
- [ ] Compare source and implementation, record findings in `design-qa.md`, and fix P0–P2 mismatches before handoff.
