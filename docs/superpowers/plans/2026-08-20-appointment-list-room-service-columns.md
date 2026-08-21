# Appointment List Room and Service Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show compact room and service labels for each schedule in the appointment list.

**Architecture:** Add a dependency-free helper that safely reads the unknown `raw_data.scopes` payload, applies documented fallbacks, deduplicates labels, and returns compact/full display text. Render its result in two new table columns without additional API requests.

**Tech Stack:** TypeScript, React/Next.js, Node.js built-in test runner, TypeScript compiler

---

### Task 1: Scope label extraction

**Files:**
- Create: `src/app/(dashboard)/appointments/_components/scheduleScopeLabels.ts`
- Create: `src/app/(dashboard)/appointments/_components/scheduleScopeLabels.test.ts`

- [ ] Add failing tests using the supplied API shape for service-name extraction, room-name priority, room-ID fallback, deduplication, compact `+N` summary, and empty fallback.
- [ ] Compile the focused files and verify failure because the helper does not exist.
- [ ] Implement safe record/array guards and export `getScheduleScopeLabels(rawData, legacyRoomId)` plus `summarizeScopeLabels(labels)`.
- [ ] Recompile and verify all focused tests pass.

### Task 2: Table columns

**Files:**
- Modify: `src/app/(dashboard)/appointments/_components/AppointmentScheduleTable.tsx`

- [ ] Add `Phòng khám` and `Dịch vụ khám` headers after `Khu khám`.
- [ ] Compute room/service summaries per row and render compact text with the full list in `title`.
- [ ] Update the empty-state `colSpan` from 9 to 11.
- [ ] Run focused tests, existing appointment tests, `npm run type-check`, and `git diff --check`.
