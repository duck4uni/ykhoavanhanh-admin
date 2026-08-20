# Appointment Service Search Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route numeric service-picker searches in the new appointment flow to `service_id` while preserving `service_name` searches and the active-status filter.

**Architecture:** Add one pure filter-building helper beside the new-schedule hook, then make the hook compose that helper's output with `status==ACTIVE`. Test the helper independently with Node's built-in test runner after compiling the focused TypeScript files to a temporary directory.

**Tech Stack:** TypeScript, React/Next.js, Node.js built-in test runner, TypeScript compiler

---

### Task 1: Service search filter helper

**Files:**
- Create: `src/app/(dashboard)/appointments/new/hooks/serviceSearchFilter.ts`
- Create: `src/app/(dashboard)/appointments/new/hooks/serviceSearchFilter.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildServiceSearchFilter } from "./serviceSearchFilter";

test("uses service_id for a numeric keyword", () => {
  assert.equal(buildServiceSearchFilter("1234"), "service_id@=1234");
});

test("trims a numeric keyword before building the filter", () => {
  assert.equal(buildServiceSearchFilter("  1234  "), "service_id@=1234");
});

test("uses service_name for a non-numeric keyword", () => {
  assert.equal(buildServiceSearchFilter("Khám tổng quát"), "service_name@=Khám tổng quát");
});

test("returns no filter for an empty keyword", () => {
  assert.equal(buildServiceSearchFilter("   "), undefined);
});
```

- [ ] **Step 2: Compile and run the focused test to verify it fails**

Run:

```bash
rm -rf /tmp/vanhanh-service-search-test
npx tsc 'src/app/(dashboard)/appointments/new/hooks/serviceSearchFilter.ts' 'src/app/(dashboard)/appointments/new/hooks/serviceSearchFilter.test.ts' --outDir /tmp/vanhanh-service-search-test --module commonjs --target es2020 --esModuleInterop --skipLibCheck
node --test /tmp/vanhanh-service-search-test/serviceSearchFilter.test.js
```

Expected: compilation fails because `serviceSearchFilter.ts` or `buildServiceSearchFilter` does not exist.

- [ ] **Step 3: Implement the minimal helper**

```ts
export function buildServiceSearchFilter(search: string): string | undefined {
  const keyword = search.trim();
  if (!keyword) return undefined;
  return /^\d+$/.test(keyword) ? `service_id@=${keyword}` : `service_name@=${keyword}`;
}
```

- [ ] **Step 4: Compile and run the focused test to verify it passes**

Run the compile and `node --test` commands from Step 2.

Expected: four tests pass.

### Task 2: New appointment hook integration

**Files:**
- Modify: `src/app/(dashboard)/appointments/new/hooks/useNewScheduleForm.ts`

- [ ] **Step 1: Import and use the helper**

Add:

```ts
import { buildServiceSearchFilter } from "./serviceSearchFilter";
```

Replace the inline service-name condition with:

```ts
filters: [
  buildServiceSearchFilter(servicePicker.debouncedSearch),
  "status==ACTIVE",
]
  .filter(Boolean)
  .join(","),
```

- [ ] **Step 2: Run focused tests and integration checks**

Run:

```bash
node --test /tmp/vanhanh-service-search-test/serviceSearchFilter.test.js
npm run type-check
git diff --check
```

Expected: four focused tests pass, TypeScript exits successfully, and `git diff --check` prints no errors.

- [ ] **Step 3: Review the resulting request behavior**

Confirm from the code that `1234` produces `filters=service_id@=1234,status==ACTIVE`, while `Khám` produces `filters=service_name@=Khám,status==ACTIVE`. Confirm pagination and all other query parameters remain unchanged.
