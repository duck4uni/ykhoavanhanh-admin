# Per-Date Slot Limit Overrides Design

## Goal

Allow selected schedule dates to override the time slot's default appointment capacity.

## Data contract

Keep `slot_limit` as the default and add optional `date_overrides: Array<{ date: string; slot_limit: number }>` to each weekday-specific API time slot. Only values differing from the default are sent. Overrides must reference a date present in `dates`, match `weekday`, and have a positive integer limit.

## Interaction

Selected dates appear in a dedicated capacity configuration area. Each date starts with the default capacity. Changing it creates or updates an override; restoring the default removes the override. Removing a selected date also removes its override. Changing the default removes overrides that now equal the new default.

## Compatibility

Detail responses without `date_overrides` hydrate with no overrides. Existing `dates` backward compatibility remains unchanged.
