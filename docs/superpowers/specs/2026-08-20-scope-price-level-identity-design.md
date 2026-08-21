# Scope Price-Level Identity Design

## Goal

Allow the same service to appear in multiple schedule scopes when each scope uses a different service price level/type.

## Identity and API

Add `price_level_code` to each scope. Scope uniqueness becomes specialty + area + room + service + price-level code. The code is the stable identity; fee is not used because two levels can share a price.

Dropdown values carry service UUID, level code, and price. The level selector uses code values. Create/update payloads send `price_level_code`, and detail responses return it. Legacy scopes without a code remain supported with an empty-code fallback.

## Validation

The frontend rejects only a scope whose complete identity matches another scope. Same service with `VIP` and `DV` is allowed; a second `VIP` scope in the same specialty/area/room is rejected.
