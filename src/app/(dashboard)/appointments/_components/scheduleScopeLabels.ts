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

export function getScheduleScopeLabels(
  rawDataOrItem: unknown,
  legacyRoomId?: string | null,
  roomLookup?: Map<string, string> | Record<string, string>,
  legacyRoomName?: string | null
): {
  roomLabels: string[];
  serviceLabels: string[];
} {
  const getResolvedRoomName = (roomId?: string): string | undefined => {
    if (!roomId) return undefined;
    if (roomLookup instanceof Map) {
      return roomLookup.get(roomId);
    }
    if (roomLookup && typeof roomLookup === "object") {
      return roomLookup[roomId];
    }
    return undefined;
  };

  const itemRecord = isRecord(rawDataOrItem) ? rawDataOrItem : undefined;
  const rawDataRecord = isRecord(itemRecord?.raw_data) ? itemRecord.raw_data : undefined;

  // Lấy scopes từ item.scopes hoặc item.raw_data.scopes hoặc rawDataOrItem.scopes
  const rawScopes =
    (Array.isArray(itemRecord?.scopes) ? itemRecord.scopes : undefined) ??
    (Array.isArray(rawDataRecord?.scopes) ? rawDataRecord.scopes : undefined) ??
    (Array.isArray(rawDataOrItem) ? rawDataOrItem : []);

  const scopes = rawScopes.filter(isRecord);

  const serviceLabels = unique(scopes.map((scope) => {
    const service = isRecord(scope.service) ? scope.service : undefined;
    return text(scope.service_name) ?? text(service?.service_name) ?? text(service?.servicename);
  }));

  const roomLabels = unique(scopes.map((scope) => {
    const room = isRecord(scope.room) ? scope.room : undefined;
    const roomRaw = isRecord(room?.raw_data) ? room.raw_data : undefined;
    const directRoomName =
      text(scope.room_name)
      ?? text(room?.room_name)
      ?? text(room?.roomname)
      ?? text(roomRaw?.roomname)
      ?? text(roomRaw?.room_name);

    if (directRoomName) return directRoomName;

    const roomId = text(scope.room_id) ?? text(room?.id) ?? text(room?.roomid);
    const lookedUpName = getResolvedRoomName(roomId);

    return lookedUpName ?? roomId;
  }));

  // Fallback từ root item nếu scopes chưa có roomLabels
  const directItemRoomName =
    text(legacyRoomName)
    ?? text(itemRecord?.room_name)
    ?? (isRecord(itemRecord?.room) ? text(itemRecord.room.room_name) ?? text(itemRecord.room.roomname) : undefined);

  const fallbackRoomId = text(legacyRoomId) ?? (itemRecord ? text(itemRecord.room_id) : undefined);
  const fallbackRoomName = directItemRoomName ?? getResolvedRoomName(fallbackRoomId);

  if (roomLabels.length === 0) {
    if (fallbackRoomName) {
      roomLabels.push(fallbackRoomName);
    } else if (fallbackRoomId) {
      roomLabels.push(fallbackRoomId);
    }
  }

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
