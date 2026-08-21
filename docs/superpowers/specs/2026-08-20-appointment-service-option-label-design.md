# Appointment Service Option Label Design

## Goal

Show the service name in every service price-level option in the new appointment scope modal.

## Display format

Both dropdown rows and the selected value use this format:

`Tên dịch vụ - Loại - Giá - (Mã dịch vụ)`

Example:

`Khám MeU - Khám VIP - 250.000đ - (123456)`

If a price level has no label, preserve the existing `—` fallback. Service selection values, saved service IDs, prices, search, pagination, and API payloads remain unchanged.

## Implementation and tests

Extract a pure formatter for a service plus one price level and use it for both dropdown rows and the selected label. Add focused tests for a normal label and the missing-label fallback, then run the project type check.
