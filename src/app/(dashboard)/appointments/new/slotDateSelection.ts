function sortedUnique(dates: string[]): string[] {
  return Array.from(new Set(dates)).sort();
}

export function toggleWeekdayDates(
  selectedDates: string[],
  weekdayDates: string[],
  selected: boolean
): string[] {
  if (selected) return sortedUnique([...selectedDates, ...weekdayDates]);
  const removed = new Set(weekdayDates);
  return selectedDates.filter((date) => !removed.has(date)).sort();
}

export function toggleSpecificDate(selectedDates: string[], date: string): string[] {
  return selectedDates.includes(date)
    ? selectedDates.filter((item) => item !== date).sort()
    : sortedUnique([...selectedDates, date]);
}

export function reconcileSelectedDates(selectedDates: string[], validDates: string[]): string[] {
  const valid = new Set(validDates);
  return selectedDates.filter((date) => valid.has(date)).sort();
}
