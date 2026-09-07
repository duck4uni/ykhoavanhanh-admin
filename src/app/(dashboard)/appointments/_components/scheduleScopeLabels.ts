import { formatCurrency } from "@/lib/utils";

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

/** Lấy mảng scopes từ item.scopes / item.raw_data.scopes / rawDataOrItem trực tiếp. */
function extractScopes(rawDataOrItem: unknown): UnknownRecord[] {
  const itemRecord = isRecord(rawDataOrItem) ? rawDataOrItem : undefined;
  const rawDataRecord = isRecord(itemRecord?.raw_data) ? itemRecord.raw_data : undefined;

  const rawScopes =
    (Array.isArray(itemRecord?.scopes) ? itemRecord.scopes : undefined) ??
    (Array.isArray(rawDataRecord?.scopes) ? rawDataRecord.scopes : undefined) ??
    (Array.isArray(rawDataOrItem) ? rawDataOrItem : []);

  return rawScopes.filter(isRecord);
}

export function getScheduleScopeLabels(
  rawDataOrItem: unknown,
  legacyRoomId?: string | null,
  roomLookup?: Map<string, string> | Record<string, string>,
  legacyRoomName?: string | null,
  legacyServiceId?: string | null,
  serviceLookup?: Map<string, string> | Record<string, string>,
  legacyServiceName?: string | null
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

  const getResolvedServiceName = (serviceId?: string): string | undefined => {
    if (!serviceId) return undefined;
    if (serviceLookup instanceof Map) {
      return serviceLookup.get(serviceId);
    }
    if (serviceLookup && typeof serviceLookup === "object") {
      return serviceLookup[serviceId];
    }
    return undefined;
  };

  const itemRecord = isRecord(rawDataOrItem) ? rawDataOrItem : undefined;
  const scopes = extractScopes(rawDataOrItem);

  const serviceLabels = unique(scopes.map((scope) => {
    const service = isRecord(scope.service) ? scope.service : undefined;
    const serviceRaw = isRecord(service?.raw_data) ? service.raw_data : undefined;
    const directServiceName =
      text(scope.service_name)
      ?? text(service?.service_name)
      ?? text(service?.servicename)
      ?? text(service?.name)
      ?? text(serviceRaw?.servicename)
      ?? text(serviceRaw?.service_name);

    if (directServiceName) return directServiceName;

    const serviceId = text(scope.service_id) ?? text(service?.id) ?? text(service?.serviceid);
    const lookedUpName = getResolvedServiceName(serviceId);

    return lookedUpName ?? serviceId;
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

  // Fallback từ root item nếu scopes chưa có serviceLabels
  const directItemServiceName =
    text(legacyServiceName)
    ?? text(itemRecord?.service_name)
    ?? (isRecord(itemRecord?.service) ? text(itemRecord.service.service_name) ?? text(itemRecord.service.servicename) ?? text(itemRecord.service.name) : undefined);

  const fallbackServiceId = text(legacyServiceId) ?? (itemRecord ? text(itemRecord.service_id) : undefined);
  const fallbackServiceName = directItemServiceName ?? getResolvedServiceName(fallbackServiceId);

  if (serviceLabels.length === 0) {
    if (fallbackServiceName) {
      serviceLabels.push(fallbackServiceName);
    } else if (fallbackServiceId) {
      serviceLabels.push(fallbackServiceId);
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

export type ServicePriceLines = {
  name: string;
  lines: string[];
};

/**
 * Gom các mức giá (price_levels) của từng dịch vụ trong scopes lịch khám —
 * ví dụ "Dịch vụ: 230.000đ", "BHYT: 185.000đ" — để hiển thị dưới tên dịch vụ.
 */
export function getScheduleServicePriceLines(rawDataOrItem: unknown): ServicePriceLines[] {
  const scopes = extractScopes(rawDataOrItem);
  const order: string[] = [];
  const linesByService = new Map<string, string[]>();

  for (const scope of scopes) {
    const service = isRecord(scope.service) ? scope.service : undefined;
    const serviceRaw = isRecord(service?.raw_data) ? service.raw_data : undefined;
    const name =
      text(scope.service_name)
      ?? text(service?.service_name)
      ?? text(service?.servicename)
      ?? text(service?.name)
      ?? text(serviceRaw?.servicename)
      ?? text(serviceRaw?.service_name);

    if (!name) continue;

    const fee = typeof scope.fee === "number" ? scope.fee : Number(scope.fee);
    if (!Number.isFinite(fee)) continue;

    const code = text(scope.price_level_code);
    const priceLevels = Array.isArray(serviceRaw?.price_levels) ? serviceRaw.price_levels.filter(isRecord) : [];
    const matchedLevel = code ? priceLevels.find((level) => text(level.code) === code) : undefined;
    const label = (matchedLevel && text(matchedLevel.label)) ?? code ?? "Giá";

    const line = `${label}: ${formatCurrency(fee)}`;
    const existing = linesByService.get(name) ?? [];
    if (!existing.includes(line)) existing.push(line);
    if (!linesByService.has(name)) order.push(name);
    linesByService.set(name, existing);
  }

  return order.map((name) => ({ name, lines: linesByService.get(name) ?? [] }));
}
