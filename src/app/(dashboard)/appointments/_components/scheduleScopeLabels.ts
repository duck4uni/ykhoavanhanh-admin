type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getScheduleScopeLabels(rawData: unknown, legacyRoomId?: string | null): {
  roomLabels: string[];
  serviceLabels: string[];
} {
  const scopes = isRecord(rawData) && Array.isArray(rawData.scopes)
    ? rawData.scopes.filter(isRecord)
    : [];

  const serviceLabels = unique(scopes.map((scope) => {
    const service = isRecord(scope.service) ? scope.service : undefined;
    return text(scope.service_name) ?? text(service?.service_name) ?? text(service?.servicename);
  }));

  const roomLabels = unique(scopes.map((scope) => {
    const room = isRecord(scope.room) ? scope.room : undefined;
    return text(scope.room_name)
      ?? text(room?.room_name)
      ?? text(room?.roomname)
      ?? text(scope.room_id);
  }));

  const fallbackRoomId = text(legacyRoomId);
  if (roomLabels.length === 0 && fallbackRoomId) roomLabels.push(fallbackRoomId);

  return { roomLabels, serviceLabels };
}

export function summarizeScopeLabels(labels: string[]): {
  text: string;
  title?: string;
} {
  if (labels.length === 0) return { text: "—", title: undefined };
  return {
    text: labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`,
    title: labels.join(", "),
  };
}
