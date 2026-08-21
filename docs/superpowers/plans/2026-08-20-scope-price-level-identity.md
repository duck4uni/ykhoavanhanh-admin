# Scope Price-Level Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Treat service price-level code as part of schedule-scope identity.

**Architecture:** Add a pure duplicate checker, persist level code in scope state/API models, and make both service and level selectors code-aware.

**Tech Stack:** TypeScript, React, Node.js built-in test runner

---

### Task 1: Duplicate identity regression tests
- Test same service/different code, same code duplicate, and different service.
- Implement the pure identity checker.

### Task 2: Scope state and selectors
- Add `price_level_code` to scope types/defaults/hydration/payload.
- Include code in option values and use it in the level selector and labels.
- Use the identity checker in `saveScope`.

### Task 3: Contract and verification
- Update the API document.
- Run focused tests, type-check, and diff checks.
