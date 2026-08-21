# Specific Schedule Dates Design

## Goal

Allow each working-hours block to select individual calendar dates after selecting weekdays.

## State and interaction

Each frontend time-slot group stores `dates: string[]` in `YYYY-MM-DD` format. Selecting a weekday selects every occurrence in the configured date range by default. Removing a weekday removes its dates. Individual date chips toggle independently; removing the last selected date for a weekday also removes that weekday.

## API contract

Each expanded `time_slots[]` payload item includes `dates: string[]`, containing only dates matching its `weekday` and the schedule range. Detail responses return the same field. For backward compatibility, a detail time slot without `dates` hydrates as every date matching its weekday.

## Validation and summary

A selected weekday must retain at least one selected date. Summary date counts use the union of explicitly selected dates rather than every occurrence of selected weekdays.

## Tests

Test weekday selection/removal, individual date toggling, range reconciliation, payload serialization, and backward-compatible hydration. Run focused tests and the project type check.
