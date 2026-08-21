export type DateSlotOverride = {
  date: string;
  slot_limit?: number;
  scope_ids?: "all" | string[];
};

function sorted(overrides: DateSlotOverride[]): DateSlotOverride[] {
  return [...overrides].sort((a, b) => a.date.localeCompare(b.date));
}

export function getDateSlotLimit(
  overrides: DateSlotOverride[] | undefined,
  date: string,
  defaultLimit: number
): number {
  return overrides?.find((override) => override.date === date)?.slot_limit ?? defaultLimit;
}

export function setDateSlotLimit(
  overrides: DateSlotOverride[] | undefined,
  date: string,
  limit: number,
  defaultLimit: number
): DateSlotOverride[] {
  const current = overrides ?? [];
  const existing = current.find((item) => item.date === date);
  const withoutDate = current.filter((item) => item.date !== date);

  const nextLimit = limit === defaultLimit ? undefined : limit;
  const nextScopeIds = existing?.scope_ids;

  if (nextLimit === undefined && nextScopeIds === undefined) {
    return sorted(withoutDate);
  }

  return sorted([
    ...withoutDate,
    {
      date,
      ...(nextLimit !== undefined ? { slot_limit: nextLimit } : {}),
      ...(nextScopeIds !== undefined ? { scope_ids: nextScopeIds } : {}),
    },
  ]);
}

export function getDateScopeIds(
  overrides: DateSlotOverride[] | undefined,
  date: string,
  defaultScopeMode: "all" | "custom",
  defaultScopeIds: string[]
): "all" | string[] {
  const found = overrides?.find((override) => override.date === date);
  if (found && found.scope_ids !== undefined) {
    return found.scope_ids;
  }
  return defaultScopeMode === "all" ? "all" : defaultScopeIds;
}

export function setDateScopeIds(
  overrides: DateSlotOverride[] | undefined,
  date: string,
  scopeIds: "all" | string[] | undefined, // undefined = reset to default (inherit from slot)
  defaultScopeMode: "all" | "custom",
  defaultScopeIds: string[]
): DateSlotOverride[] {
  const current = overrides ?? [];
  const existing = current.find((item) => item.date === date);
  const withoutDate = current.filter((item) => item.date !== date);

  const slotDefaultScope: "all" | string[] = defaultScopeMode === "all" ? "all" : defaultScopeIds;
  const isSameAsDefault = scopeIds === undefined || (
    scopeIds === "all" && slotDefaultScope === "all"
  ) || (
    Array.isArray(scopeIds) && Array.isArray(slotDefaultScope) &&
    scopeIds.length === slotDefaultScope.length &&
    [...scopeIds].sort().join(",") === [...slotDefaultScope].sort().join(",")
  );

  const nextScopeIds = isSameAsDefault ? undefined : scopeIds;
  const nextLimit = existing?.slot_limit;

  if (nextLimit === undefined && nextScopeIds === undefined) {
    return sorted(withoutDate);
  }

  return sorted([
    ...withoutDate,
    {
      date,
      ...(nextLimit !== undefined ? { slot_limit: nextLimit } : {}),
      ...(nextScopeIds !== undefined ? { scope_ids: nextScopeIds } : {}),
    },
  ]);
}

export function reconcileDateOverrides(
  overrides: DateSlotOverride[] | undefined,
  selectedDates: string[],
  defaultLimit: number,
  validScopeIds?: Set<string>
): DateSlotOverride[] {
  if (!overrides || overrides.length === 0) return [];
  const selected = new Set(selectedDates);

  return sorted(
    overrides
      .filter((override) => selected.has(override.date))
      .map((override) => {
        const nextLimit = override.slot_limit !== defaultLimit ? override.slot_limit : undefined;
        let nextScopeIds = override.scope_ids;
        if (Array.isArray(nextScopeIds) && validScopeIds) {
          nextScopeIds = nextScopeIds.filter((id) => validScopeIds.has(id));
          if (nextScopeIds.length === 0) {
            nextScopeIds = undefined;
          }
        }
        return {
          date: override.date,
          ...(nextLimit !== undefined ? { slot_limit: nextLimit } : {}),
          ...(nextScopeIds !== undefined ? { scope_ids: nextScopeIds } : {}),
        };
      })
      .filter((override) => override.slot_limit !== undefined || override.scope_ids !== undefined)
  );
}
