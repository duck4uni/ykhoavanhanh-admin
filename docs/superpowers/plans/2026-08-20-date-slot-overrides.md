# Per-Date Slot Limit Overrides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure and persist appointment capacity overrides per selected date.

**Architecture:** Add pure override helpers, extend frontend/API models and serialization, then render selected-date capacity cards beneath the date selector.

**Tech Stack:** TypeScript, React, Node.js built-in test runner

---

### Task 1: Override rules
- Add failing tests for create, update, default removal, date removal, and reconciliation.
- Implement dependency-free override helpers and verify tests pass.

### Task 2: State and API
- Extend time-slot types with `date_overrides`.
- Update defaults, range reconciliation, date removal, default changes, hydrate, and serializer.

### Task 3: UI and documentation
- Add responsive per-date capacity controls for selected dates.
- Update the API document with contract and validation.
- Run focused tests, type-check, and diff checks.
