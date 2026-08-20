# Appointment Table Column Widths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent key appointment-list columns from becoming too narrow and wrapping excessively.

**Architecture:** Apply matching Tailwind minimum-width utilities to each affected header and data cell while retaining the existing horizontally scrollable table container.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: Appointment table widths

**Files:**
- Modify: `src/app/(dashboard)/appointments/_components/AppointmentScheduleTable.tsx`

- [ ] Apply approved minimum widths to doctor, exam area, room, service, date, time, shift, and capacity headers.
- [ ] Apply the same widths to the corresponding cells; retain truncation for room and service labels.
- [ ] Run `npm run type-check` and `git diff --check`.
