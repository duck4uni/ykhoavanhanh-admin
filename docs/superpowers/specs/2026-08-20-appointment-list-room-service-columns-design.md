# Appointment List Room and Service Columns Design

## Goal

Add `Phòng khám` and `Dịch vụ khám` columns to the appointment schedule list using data already returned by the list endpoint.

## Data extraction

Read scope data from `row.raw_data.scopes`.

- Service label priority: `scope.service_name`, `scope.service.service_name`, `scope.service.servicename`.
- Room label priority: `scope.room_name`, `scope.room.room_name`, `scope.room.roomname`, `scope.room_id`.
- For legacy rows without scopes, room falls back to `row.room_id`.
- Missing values render as `—`.

This room fallback allows the current payload to display its UUID immediately and automatically prefers a room name after the backend adds it.

## Presentation

Deduplicate labels while preserving scope order. Show the first label in the table; when additional unique values exist, append `+N`. Set the cell title to the complete comma-separated list so users can inspect every value without widening the table.

## Tests

Add pure helper tests for service extraction, room-name priority, room-ID fallback, deduplication, summary formatting, and missing data. Run focused tests and the repository type check.
