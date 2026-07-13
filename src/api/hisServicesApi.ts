/**
 * HIS Services API — Dịch vụ HIS
 * Resource: /his-services (proxy tới HIS external API)
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete, api } from "@/lib/axios";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface HisService {
  /** UUID nội bộ nếu API trả về; fallback về serviceid với response HIS cũ. */
  id: string;
  /** Mã dịch vụ HIS, normalize từ service_id/serviceid. */
  serviceid: string;
  servicetype: string;
  /** Tên dịch vụ, normalize từ service_name/servicename. */
  servicename: string;
  price: string;
  fromdate: string;
  insurancetype: string;
  description: string | null;
  updatetime: string;
  exam_area_id?: string | null;
  specialty_id?: string | null;
  is_delete?: boolean;
  /** Trạng thái hoạt động của dịch vụ. */
  status?: "ACTIVE" | "INACTIVE";
  booking_note?: string | null;
  display_priority?: number | null;
  display_group?: number | null;
  room_visit_instruction?: string | null;
  detail?: string | null;
  /** Quan hệ chuyên khoa kèm sẵn (include) — dùng để hiển thị tên mà không cần tra cứu riêng. */
  specialty?: { id: string; name: string; description?: string | null; is_active?: boolean } | null;
  /** Quan hệ khu vực khám kèm sẵn (include). */
  exam_area?: {
    id: string;
    code?: string;
    name: string;
    short_name?: string | null;
    address?: string | null;
    phone?: string | null;
    status?: string;
  } | null;
  synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
  raw_data?: Record<string, unknown> | null;
}

export interface HisServiceParams {
  /** Mã cơ sở y tế — dùng để đồng bộ từ HIS & xác định khu vực khám (GET list). */
  idbv?: string;
  /** Trang hiện tại. Không truyền cùng pageSize → BE trả full data. */
  currentPage?: number;
  /** Số bản ghi/trang. Không truyền cùng currentPage → BE trả full data. */
  pageSize?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  /** Bộ lọc phía server (Sieve). `@=` là chứa, `==` là bằng. VD: `service_name@=Khám`. */
  filters?: string;
}

type HisServiceApiItem = Partial<HisService> & {
  service_id?: string | null;
  service_name?: string | null;
  raw_data?: Record<string, unknown> | null;
};

export interface PaginatedHisServices {
  count: number;
  rows: HisService[];
  totalPages: number;
  currentPage: number;
}

type HisServicesListResponse =
  | HisServiceApiItem[]
  | {
      count: number;
      rows: HisServiceApiItem[];
      totalPages: number;
      currentPage: number;
    };

function normalizeHisService(item: HisServiceApiItem): HisService {
  const raw = item.raw_data ?? null;
  const rawServiceId = typeof raw?.serviceid === "string" ? raw.serviceid : undefined;
  const rawServiceName = typeof raw?.servicename === "string" ? raw.servicename : undefined;
  const rawServiceType = typeof raw?.servicetype === "string" ? raw.servicetype : undefined;
  const rawPrice = typeof raw?.price === "string" ? raw.price : undefined;
  const rawFromDate = typeof raw?.fromdate === "string" ? raw.fromdate : undefined;
  const rawInsuranceType = typeof raw?.insurancetype === "string" ? raw.insurancetype : undefined;
  const rawUpdateTime = typeof raw?.updatetime === "string" ? raw.updatetime : undefined;
  const serviceid = item.serviceid ?? item.service_id ?? rawServiceId ?? item.id ?? "";
  return {
    ...item,
    id: item.id ?? serviceid,
    serviceid,
    servicename: item.servicename ?? item.service_name ?? rawServiceName ?? "—",
    servicetype: item.servicetype ?? rawServiceType ?? "—",
    price: item.price ?? rawPrice ?? "0",
    fromdate: item.fromdate ?? rawFromDate ?? "",
    insurancetype: item.insurancetype ?? rawInsuranceType ?? "—",
    description: item.description ?? (typeof raw?.description === "string" ? raw.description : null),
    updatetime: item.updatetime ?? rawUpdateTime ?? item.updated_at ?? item.synced_at ?? "",
    raw_data: raw,
  };
}

function normalizeHisServiceList(data: HisServicesListResponse): HisService[] {
  const rows = Array.isArray(data) ? data : data.rows;
  return rows.map(normalizeHisService);
}

export type CreateHisServicePayload = {
  /** UUID khu vực khám — chọn từ GET /exam-areas. */
  exam_area_id?: string;
  service_id: string;
  service_name: string;
  price?: number;
  specialty_id?: string;
  booking_note?: string | null;
  display_priority?: number | null;
  display_group?: number | null;
  room_visit_instruction?: string | null;
  detail?: string | null;
  /** Field mở rộng (servicetype/insurancetype/description...) ghi vào cột jsonb. */
  raw_data?: Record<string, unknown>;
  [key: string]: unknown;
};

export type UpdateHisServicePayload = Partial<CreateHisServicePayload>;

// ─── Query Keys ────────────────────────────────────────────────────────────

const baseKey = "his-services";

export const hisServicesKeys = {
  all: [baseKey] as const,
  list: (params?: HisServiceParams) => [baseKey, "list", params] as const,
  detail: (id: string) => [baseKey, "detail", id] as const,
};

// ─── Service Functions ─────────────────────────────────────────────────────

export const hisServicesService = {
  /** Lấy danh sách dịch vụ từ HIS */
  getList: async (params?: HisServiceParams): Promise<HisService[]> => {
    const queryParams: HisServiceParams = {
      sortField: "created_at",
      sortOrder: "DESC",
      ...params,
    };
    const res = await apiGet<HisServicesListResponse>("/his-services", { params: queryParams });
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeHisServiceList(res.data.responseData);
    }
    throw new Error(res.data.message || "Không thể lấy danh sách dịch vụ");
  },

  /** Lấy danh sách dịch vụ từ HIS kèm thông tin phân trang */
  getPaginatedList: async (params?: HisServiceParams): Promise<PaginatedHisServices> => {
    const queryParams: HisServiceParams = {
      sortField: "created_at",
      sortOrder: "DESC",
      ...params,
    };
    const res = await apiGet<HisServicesListResponse>("/his-services", { params: queryParams });
    if (res.data.status === "success" && res.data.responseData) {
      if (Array.isArray(res.data.responseData)) {
        const rows = normalizeHisServiceList(res.data.responseData);
        return {
          count: rows.length,
          rows,
          totalPages: 1,
          currentPage: 1,
        };
      }
      return {
        count: res.data.responseData.count,
        rows: res.data.responseData.rows.map(normalizeHisService),
        totalPages: res.data.responseData.totalPages,
        currentPage: res.data.responseData.currentPage,
      };
    }
    throw new Error(res.data.message || "Không thể lấy danh sách dịch vụ");
  },

  /** Lấy chi tiết một dịch vụ theo ID */
  getById: async (id: string, params?: HisServiceParams): Promise<HisService> => {
    const res = await apiGet<HisServiceApiItem>(`/his-services/${id}`, { params });
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeHisService(res.data.responseData);
    }
    throw new Error(res.data.message || "Không thể lấy thông tin dịch vụ");
  },

  /** Tạo mới dịch vụ trên HIS */
  create: async (data: CreateHisServicePayload): Promise<HisService> => {
    const res = await apiPost<HisServiceApiItem>("/his-services", data);
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeHisService(res.data.responseData);
    }
    throw new Error(res.data.message || "Tạo dịch vụ thất bại");
  },

  /** Cập nhật dịch vụ theo ID */
  update: async (id: string, data: UpdateHisServicePayload): Promise<HisService> => {
    const res = await apiPut<HisServiceApiItem>(`/his-services/${id}`, data);
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeHisService(res.data.responseData);
    }
    throw new Error(res.data.message || "Cập nhật dịch vụ thất bại");
  },

  /** Xóa dịch vụ theo ID */
  remove: async (id: string): Promise<void> => {
    const res = await apiDelete(`/his-services/${id}`);
    if (res.data.status === "fail") {
      throw new Error(res.data.message || "Xóa dịch vụ thất bại");
    }
  },

  /** Xuất danh sách dịch vụ ra file Excel */
  export: async (params?: HisServiceParams): Promise<Blob> => {
    const res = await api.get<Blob>("/his-services/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },
};

// ─── TanStack Query Hooks ──────────────────────────────────────────────────

export const hisServicesHooks = {
  useList: (
    params?: HisServiceParams,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<HisService[], Error> => {
    return useQuery<HisService[], Error>({
      queryKey: hisServicesKeys.list(params),
      queryFn: () => hisServicesService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },

  usePaginatedList: (
    params?: HisServiceParams,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<PaginatedHisServices, Error> => {
    return useQuery<PaginatedHisServices, Error>({
      queryKey: hisServicesKeys.list(params),
      queryFn: () => hisServicesService.getPaginatedList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },

  useDetail: (
    id: string | null | undefined,
    params?: HisServiceParams,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<HisService, Error> => {
    return useQuery<HisService, Error>({
      queryKey: hisServicesKeys.detail(id ?? ""),
      queryFn: () => hisServicesService.getById(id!, params),
      enabled: Boolean(id),
      staleTime: 1000 * 60 * 5,
      ...options,
    });
  },

  useCreate: (
    options?: UseMutationOptions<HisService, Error, CreateHisServicePayload>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisService, Error, CreateHisServicePayload>({
      mutationFn: (data) => hisServicesService.create(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: hisServicesKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useUpdate: (
    options?: UseMutationOptions<HisService, Error, { id: string; data: UpdateHisServicePayload }>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisService, Error, { id: string; data: UpdateHisServicePayload }>({
      mutationFn: ({ id, data }) => hisServicesService.update(id, data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: hisServicesKeys.all });
        qc.invalidateQueries({ queryKey: hisServicesKeys.detail(variables.id) });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useDelete: (
    options?: UseMutationOptions<void, Error, string>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<void, Error, string>({
      mutationFn: (id) => hisServicesService.remove(id),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: hisServicesKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },
};
