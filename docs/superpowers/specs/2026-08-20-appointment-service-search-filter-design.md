# Appointment Service Search Filter Design

## Goal

Fix service search in the new appointment scope modal so a numeric service code such as `1234` is queried through `service_id` instead of `service_name`, while preserving name search.

## Scope

The change applies to the service picker in the new appointment flow. It does not change the service-list screen, backend API, paging, sorting, status filtering, or selection behavior.

## Filter behavior

Normalize the user's search term with `trim()` before building the API filter:

- An empty term adds no search filter.
- A term containing only ASCII digits (`/^\d+$/`) produces `service_id@=<term>`.
- Every other non-empty term produces `service_name@=<term>`.

The generated search condition remains combined with the existing `status==ACTIVE` condition. Existing query parameters for sorting and pagination remain unchanged.

Alphanumeric service codes are intentionally out of scope for this change. They continue to be treated as service names until a later search rule is agreed.

## Implementation shape

Extract the keyword-to-filter decision into a small pure helper and call it from the new-schedule form hook. Keeping the decision independent from React Query makes the behavior directly testable and reusable.

## Tests

Add focused tests proving that:

1. `1234` creates `service_id@=1234`.
2. Surrounding whitespace is removed before numeric detection.
3. A Vietnamese service name creates a `service_name@=` filter.
4. An empty or whitespace-only term creates no search filter.

Run the focused test first, then the repository type check to catch integration regressions.
