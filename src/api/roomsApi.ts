import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/axios";

// ─── HIS Room Type (khớp schema API trả về) ───────────────────────────

export interface HisRoomService {
  id: string;
  service_id: string;
  service?: {
    id: string;
    service_id: string;
    service_name: string;
    price?: number | string | null;
    specialty_id?: string | null;
  } | null;
}

export interface HisRoom {
  id: string;
  roomid: string;
  roomname: string;
  description: string | null;
  updatetime: string;
  his_updated_at?: string | null;
  synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
  is_delete?: boolean;
  exam_area_description?: string | null;
  visit_instruction?: string | null;
  clinic_type?: string | null;
  exam_area_id?: string | null;
  /** Quan hệ khu vực khám kèm sẵn (include). */
  exam_area?: { id: string; code?: string; name: string; short_name?: string | null } | null;
  his_room_services?: HisRoomService[];
  raw_data?: Record<string, unknown> | null;
}

type RoomApiItem = Partial<HisRoom> & {
  room_id?: string | null;
  room_name?: string | null;
  raw_data?: Record<string, unknown> | null;
};

type RoomsListResponse =
  | RoomApiItem[]
  | {
      count: number;
      rows: RoomApiItem[];
      totalPages: number;
      currentPage: number;
    };

function normalizeRoom(item: RoomApiItem): HisRoom {
  const raw = item.raw_data ?? null;
  const rawRoomId = typeof raw?.roomid === "string" ? raw.roomid : undefined;
  const rawRoomName = typeof raw?.roomname === "string" ? raw.roomname : undefined;
  const rawUpdateTime = typeof raw?.updatetime === "string" ? raw.updatetime : undefined;
  const roomid = item.roomid ?? item.room_id ?? rawRoomId ?? item.id ?? "";

  return {
    ...item,
    id: item.id ?? roomid,
    roomid,
    roomname: item.roomname ?? item.room_name ?? rawRoomName ?? "—",
    description: item.description ?? (typeof raw?.description === "string" ? raw.description : null),
    updatetime: item.updatetime ?? rawUpdateTime ?? item.updated_at ?? item.synced_at ?? "",
    his_room_services: item.his_room_services ?? [],
    raw_data: raw,
  };
}

function normalizeRoomList(data: RoomsListResponse): HisRoom[] {
  const rows = Array.isArray(data) ? data : data.rows;
  return rows.map(normalizeRoom);
}

export interface RoomListParams {
  currentPage?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  /** Bộ lọc phía server (Sieve). `@=` là chứa, `==` là bằng. VD: `room_name@=Phòng khám`. */
  filters?: string;
}

export interface PaginatedRooms {
  count: number;
  rows: HisRoom[];
  totalPages: number;
  currentPage: number;
}

export interface UpdateRoomPayload {
  room_id?: string;
  room_name?: string;
  description?: string | null;
  his_updated_at?: string | null;
  exam_area_description?: string | null;
  visit_instruction?: string | null;
  clinic_type?: string | null;
  exam_area_id?: string | null;
}

export interface CreateRoomPayload {
  room_id: string;
  room_name: string;
  description?: string | null;
  his_updated_at?: string | null;
  exam_area_description?: string | null;
  visit_instruction?: string | null;
  clinic_type?: string | null;
  exam_area_id?: string | null;
}

export interface AssignRoomServicesPayload {
  service_ids: string[];
}

export interface AssignRoomServicesResult {
  created: HisRoomService[];
  skipped: string[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────

const baseKey = "rooms";

export const roomsKeys = {
  all: [baseKey] as const,
  list: (params?: RoomListParams) =>
    [baseKey, "list", params] as const,
  detail: (id: string) => [baseKey, "detail", id] as const,
};

// ─── Service Functions ──────────────────────────────────────────────────────

export const roomsService = {
  /** Lấy danh sách phòng khám từ HIS */
  getList: async (params?: RoomListParams): Promise<HisRoom[]> => {
    const res = await apiGet<RoomsListResponse>("/rooms", { params });
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeRoomList(res.data.responseData);
    }
    throw new Error(res.data.message || "Không thể lấy danh sách phòng khám");
  },

  /** Lấy danh sách phòng khám kèm thông tin phân trang */
  getPaginatedList: async (params?: RoomListParams): Promise<PaginatedRooms> => {
    const res = await apiGet<RoomsListResponse>("/rooms", { params });
    if (res.data.status === "success" && res.data.responseData) {
      const payload = res.data.responseData;
      if (Array.isArray(payload)) {
        const rows = normalizeRoomList(payload);
        return { count: rows.length, rows, totalPages: 1, currentPage: 1 };
      }
      return {
        count: payload.count,
        rows: payload.rows.map(normalizeRoom),
        totalPages: payload.totalPages,
        currentPage: payload.currentPage,
      };
    }
    throw new Error(res.data.message || "Không thể lấy danh sách phòng khám");
  },

  getById: async (id: string): Promise<HisRoom> => {
    const res = await apiGet<RoomApiItem>(`/rooms/${id}`);
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeRoom(res.data.responseData);
    }
    throw new Error(res.data.message || "Không thể lấy chi tiết phòng khám");
  },

  update: async (id: string, payload: UpdateRoomPayload): Promise<HisRoom> => {
    const res = await apiPut<RoomApiItem>(`/rooms/${id}`, payload);
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeRoom(res.data.responseData);
    }
    throw new Error(res.data.message || "Cập nhật phòng khám thất bại");
  },

  create: async (payload: CreateRoomPayload): Promise<HisRoom> => {
    const res = await apiPost<RoomApiItem>("/rooms", payload);
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeRoom(res.data.responseData);
    }
    throw new Error(res.data.message || "Tạo phòng khám thất bại");
  },

  assignServices: async (id: string, payload: AssignRoomServicesPayload): Promise<AssignRoomServicesResult> => {
    const res = await apiPost<AssignRoomServicesResult>(`/rooms/${id}/services`, payload);
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Gán dịch vụ cho phòng khám thất bại");
  },

  unassignService: async (id: string, serviceId: string): Promise<void> => {
    const res = await apiDelete(`/rooms/${id}/services/${serviceId}`);
    if (res.data.status === "fail") {
      throw new Error(res.data.message || "Bỏ gán dịch vụ khỏi phòng khám thất bại");
    }
  },

  remove: async (id: string): Promise<void> => {
    const res = await apiDelete(`/rooms/${id}`);
    if (res.data.status === "fail") {
      throw new Error(res.data.message || "Xóa phòng khám thất bại");
    }
  },
};

// ─── TanStack Query Hooks ───────────────────────────────────────────────────

export const roomsHooks = {
  useList: (
    params?: RoomListParams,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<HisRoom[], Error> => {
    return useQuery<HisRoom[], Error>({
      queryKey: roomsKeys.list(params),
      queryFn: () => roomsService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },

  usePaginatedList: (
    params?: RoomListParams,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<PaginatedRooms, Error> => {
    return useQuery<PaginatedRooms, Error>({
      queryKey: roomsKeys.list(params),
      queryFn: () => roomsService.getPaginatedList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },

  useDetail: (
    id: string | null | undefined,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<HisRoom, Error> => {
    return useQuery<HisRoom, Error>({
      queryKey: roomsKeys.detail(id ?? ""),
      queryFn: () => roomsService.getById(id!),
      staleTime: 1000 * 60 * 5,
      enabled: Boolean(id) && (options?.enabled ?? true),
      ...options,
    });
  },

  useUpdate: (
    options?: UseMutationOptions<HisRoom, Error, { id: string; data: UpdateRoomPayload }>
  ) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};

    return useMutation<HisRoom, Error, { id: string; data: UpdateRoomPayload }>({
      mutationFn: ({ id, data }) => roomsService.update(id, data),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: roomsKeys.all });
        queryClient.invalidateQueries({ queryKey: roomsKeys.detail(variables.id) });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },

  useCreate: (
    options?: UseMutationOptions<HisRoom, Error, CreateRoomPayload>
  ) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};

    return useMutation<HisRoom, Error, CreateRoomPayload>({
      mutationFn: (data) => roomsService.create(data),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: roomsKeys.all });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },

  useAssignServices: (
    options?: UseMutationOptions<AssignRoomServicesResult, Error, { id: string; serviceIds: string[] }>
  ) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};

    return useMutation<AssignRoomServicesResult, Error, { id: string; serviceIds: string[] }>({
      mutationFn: ({ id, serviceIds }) => roomsService.assignServices(id, { service_ids: serviceIds }),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: roomsKeys.all });
        queryClient.invalidateQueries({ queryKey: roomsKeys.detail(variables.id) });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },

  useUnassignService: (
    options?: UseMutationOptions<void, Error, { id: string; serviceId: string }>
  ) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};

    return useMutation<void, Error, { id: string; serviceId: string }>({
      mutationFn: ({ id, serviceId }) => roomsService.unassignService(id, serviceId),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: roomsKeys.all });
        queryClient.invalidateQueries({ queryKey: roomsKeys.detail(variables.id) });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },

  useDelete: (
    options?: UseMutationOptions<void, Error, string>
  ) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};

    return useMutation<void, Error, string>({
      mutationFn: (id) => roomsService.remove(id),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: roomsKeys.all });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },
};
