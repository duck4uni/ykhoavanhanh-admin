# Time Slot Editor Layout Design

## Goal

Prevent start time, end time, and appointment capacity controls from overlapping in expanded time-slot cards.

## Layout

Replace the current three equal columns with two responsive groups:

- `Thời gian khám` occupies the flexible majority of the row. It contains a start-time group, a centered arrow separator, and an end-time group.
- `Số phiếu khám` uses a dedicated column with enough width for its number input.

At narrow widths, the capacity field moves below the time-range group. The existing right-side `Áp dụng cho phạm vi` area remains unchanged. Existing `TimeSelect`, values, update handlers, validation, and payload behavior remain unchanged.

## Accessibility and testing

Keep visible labels for `Bắt đầu`, `Kết thúc`, and `Số phiếu khám`; mark the arrow decorative. Verify the responsive class structure, run the project type check, and preserve existing time-slot behavior.
