export type DateSlotOverride = {
  date: string;
  slot_limit: number;
};

function sorted(overrides: DateSlotOverride[]): DateSlotOverride[] {
  return [...overrides].sort((a, b) => a.date.localeCompare(b.date));
}

export function getDateSlotLimit(
  overrides: DateSlotOverride[],
  date: string,
  defaultLimit: number
): number {
  return overrides.find((override) => override.date === date)?.slot_limit ?? defaultLimit;
}

export function setDateSlotLimit(
  overrides: DateSlotOverride[],
  date: string,
  limit: number,
  defaultLimit: number
): DateSlotOverride[] {
  const withoutDate = overrides.filter((override) => override.date !== date);
  return limit === defaultLimit ? sorted(withoutDate) : sorted([...withoutDate, { date, slot_limit: limit }]);
}

export function reconcileDateOverrides(
  overrides: DateSlotOverride[],
  selectedDates: string[],
  defaultLimit: number
): DateSlotOverride[] {
  const selected = new Set(selectedDates);
  return sorted(overrides.filter(
    (override) => selected.has(override.date) && override.slot_limit !== defaultLimit
  ));
}
