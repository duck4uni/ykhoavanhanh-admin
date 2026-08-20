# Specific Schedule Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist individual dates for each weekday-specific schedule time slot.

**Architecture:** Add a dependency-free date-selection helper, extend the shared frontend/API models with `dates`, update state transitions and serialization/hydration, then make concrete date chips interactive.

**Tech Stack:** TypeScript, React, Node.js built-in test runner

---

### Task 1: Date selection rules

- Create `src/app/(dashboard)/appointments/new/slotDateSelection.ts` and focused tests.
- Verify tests fail before implementation, then implement select/remove/toggle/reconcile helpers.

### Task 2: State and API contract

- Extend `TimeSlotRow`, API time-slot types, defaults, auto-generation, range reconciliation, payload serialization, and detail hydration with `dates`.
- Preserve backward compatibility when detail data omits `dates`.

### Task 3: Interactive date chips

- Expose `toggleSlotDate` from the schedule controller.
- Render each date as an accessible pressed-state button with check styling and keep the compact `+N` behavior.
- Update summary counts and validation to use selected dates.

### Task 4: Documentation and verification

- Update `src/docs/api/doctor-work-schedules-v2-payload.md` with the `dates` contract and validation.
- Run focused tests, `npm run type-check`, and `git diff --check`.
