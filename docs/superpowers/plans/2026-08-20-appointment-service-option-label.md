# Appointment Service Option Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display service name, price-level type, price, and service code consistently in the new appointment service picker.

**Architecture:** Add a dependency-free pure formatter beside the scope modal, then reuse it for dropdown rows and the selected value. Keep option values and save behavior unchanged.

**Tech Stack:** TypeScript, React/Next.js, Node.js built-in test runner, TypeScript compiler

---

### Task 1: Price-level option formatter

**Files:**
- Create: `src/app/(dashboard)/appointments/new/_components/servicePriceLevelLabel.ts`
- Create: `src/app/(dashboard)/appointments/new/_components/servicePriceLevelLabel.test.ts`

- [ ] Add failing tests expecting `Khám MeU - Khám VIP - 250.000đ - (123456)` and the `—` fallback for a missing level label.
- [ ] Compile and run the focused test; verify failure because the formatter is absent.
- [ ] Add `formatServicePriceLevelOptionLabel(service, level)` using `servicename`, `level.label`, the Vietnamese-formatted `level.price`, and `serviceid`.
- [ ] Recompile and verify both tests pass.

### Task 2: Service picker integration

**Files:**
- Modify: `src/app/(dashboard)/appointments/new/_components/ScopeModal.tsx`

- [ ] Import the formatter and replace both inline label templates with it.
- [ ] Keep the existing option `value`, service ID, selected price, and event handlers unchanged.
- [ ] Run all focused service-search and option-label tests, `npm run type-check`, and `git diff --check`.
