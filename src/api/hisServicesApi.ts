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
import type {
  HisCatalogApplyChangeInput,
  HisCatalogApplyResult,
  HisCatalogSyncResult,
} from "@/api/hisCatalogApi";

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Một mức giá của dịch vụ khám (VD: Khám thường / Khám BHYT / Khám VIP).
 * Bảng `his_services` chỉ có 1 cột `price` → danh sách mức giá lưu trong `raw_data.price_levels`,
 * cột `price` giữ mức giá mặc định để các màn cũ (lịch khám, đặt khám) vẫn đọc được.
 */
export interface HisServicePriceLevel {
  /** Mã mức giá, ổn định để đối chiếu (VD "THUONG", "BHYT", "VIP"). */
  code: string;
  /** Tên hiển thị (VD "Khám thường"). */
  label: string;
  price: number;
  /** Mức giá mặc định — đồng bộ với cột `price`. */
  is_default?: boolean;
  /** Trạng thái riêng của mức giá; mặc định coi là ACTIVE nếu thiếu (dữ liệu cũ). */
  status?: "ACTIVE" | "INACTIVE";
}

export interface HisService {
  /** UUID nội bộ nếu API trả về; fallback về serviceid với response HIS cũ. */
  id: string;
  /** Mã dịch vụ HIS, normalize từ service_id/serviceid. */
  serviceid: string;
  servicetype: string;
  /** Tên dịch vụ, normalize từ service_name/servicename. */
  servicename: string;
  /** Mức giá mặc định (cột `price`). Danh sách đầy đủ xem `price_levels`. */
  price: string;
  /** Các mức giá của dịch vụ; rỗng nếu dịch vụ chỉ có một mức giá duy nhất. */
  price_levels: HisServicePriceLevel[];
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

/** Đọc `raw_data.price_levels` (dữ liệu tự do) về mảng mức giá đã chuẩn hóa. */
function parsePriceLevels(raw: Record<string, unknown> | null): HisServicePriceLevel[] {
  const source = raw?.price_levels;
  if (!Array.isArray(source)) return [];
  return source.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const level = entry as Record<string, unknown>;
    const label =
      typeof level.label === "string" && level.label.trim()
        ? level.label.trim()
        : typeof level.name === "string"
          ? level.name.trim()
          : "";
    const price = Number(level.price);
    if (!label || !Number.isFinite(price)) return [];
    return [{
      code: typeof level.code === "string" && level.code.trim() ? level.code.trim() : label,
      label,
      price,
      is_default: level.is_default === true,
      status: level.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    }];
  });
}

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
    price_levels: parsePriceLevels(raw),
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
  /** UUID khu vực khám — chọn từ GET /exam-areas. Không bắt buộc; `null` để gỡ ràng buộc. */
  exam_area_id?: string | null;
  service_id: string;
  service_name: string;
  /** Mức giá mặc định — ghi thẳng cột `price`. */
  price?: number;
  /** Danh sách mức giá; không phải cột thật → nằm trong `raw_data` (POST) hoặc được merge vào `raw_data` (PUT). */
  price_levels?: HisServicePriceLevel[];
  /** UUID chuyên khoa. Không bắt buộc; `null` để gỡ ràng buộc. */
  specialty_id?: string | null;
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

// ─── Đồng bộ HIS (2 chiều) ──────────────────────────────────────────────────

/**
 * Shape thô lưu trong bảng `his_services`, dùng riêng cho luồng diff/accept
 * (`POST /his-services/sync` + `/sync-apply`). Khác với `HisService` ở trên
 * (đã chuẩn hoá theo field kiểu HIS cũ: `servicename`, `servicetype`...),
 * `current`/`incoming` trả về từ BE dùng đúng tên cột DB (`service_name`,
 * `service_id`...) — không dùng `HisService` ở đây để tránh nhầm field.
 */
export interface HisServiceSyncRow {
  id: string;
  exam_area_id?: string | null;
  service_id?: string;
  service_name?: string;
  price?: number | string | null;
  specialty_id?: string | null;
  booking_note?: string | null;
  display_priority?: number | null;
  display_group?: number | null;
  room_visit_instruction?: string | null;
  detail?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  raw_data?: Record<string, unknown> | null;
  synced_at?: string | null;
  is_delete?: boolean;
}

/**
 * `POST /his-services/sync` theo pattern diff/accept dùng chung với 6 danh
 * mục HIS khác (xem `hisCatalogApi.ts`): bản ghi mới tự thêm ngay
 * (`inserted`), bản ghi đã có mà khác dữ liệu HIS nằm trong `changes` chờ
 * `POST /his-services/sync-apply` xác nhận.
 */
export type HisServiceSyncFromHisResult = HisCatalogSyncResult<HisServiceSyncRow>;
export type HisServiceSyncApplyChangeInput = HisCatalogApplyChangeInput<HisServiceSyncRow>;
export type HisServiceSyncApplyResult = HisCatalogApplyResult<HisServiceSyncRow>;

export interface HisServiceSyncToHisResultRow {
  service_id: string;
  service_name: string;
  status: "success" | "error";
  error?: string;
}

export interface HisServiceSyncToHisResult {
  message: string;
  total: number;
  success: number;
  error: number;
  results: HisServiceSyncToHisResultRow[];
}

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

  /**
   * `POST /his-services/sync` — kéo dữ liệu từ HIS, diff với DB theo khoá
   * `(exam_area_id, service_id)`. `idbv` để trống nếu không cần lọc theo cơ
   * sở. Trả `{inserted_count, inserted, changes, unchanged_count}` — bản ghi
   * trong `changes` CHƯA ghi DB, phải gọi `syncApplyFromHis` mới áp dụng.
   */
  syncFromHis: async (idbv?: string): Promise<HisServiceSyncFromHisResult> => {
    const res = await apiPost<HisServiceSyncFromHisResult>("/his-services/sync", undefined, {
      params: idbv ? { idbv } : undefined,
    });
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Đồng bộ từ HIS thất bại");
  },

  /** `POST /his-services/sync-apply` — áp dụng các `changes` người dùng đã chọn từ `syncFromHis`. */
  syncApplyFromHis: async (
    changes: HisServiceSyncApplyChangeInput[]
  ): Promise<HisServiceSyncApplyResult> => {
    const res = await apiPost<HisServiceSyncApplyResult>("/his-services/sync-apply", { changes });
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Áp dụng thay đổi thất bại");
  },

  /**
   * POST /his-services/sync-to-his — gửi dữ liệu dịch vụ lên HIS. BE trả HTTP 200
   * ngay cả khi có lỗi cục bộ ở một vài dịch vụ — phải đọc `responseData`
   * (total/success/error/results) chứ không chỉ dựa vào HTTP status. Lưu ý:
   * tích hợp HIS phía BE cho endpoint này chưa được verify với HIS thật.
   */
  syncToHis: async (): Promise<HisServiceSyncToHisResult> => {
    const res = await apiPost<{ total: number; success: number; error: number; results: HisServiceSyncToHisResultRow[] }>(
      "/his-services/sync-to-his",
    );
    const responseData = res.data.responseData;
    if (responseData) {
      return {
        message: res.data.message || "",
        total: responseData.total,
        success: responseData.success,
        error: responseData.error,
        results: responseData.results ?? [],
      };
    }
    throw new Error(res.data.message || "Đồng bộ lên HIS thất bại");
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

  useSyncFromHis: (
    options?: UseMutationOptions<HisServiceSyncFromHisResult, Error, string | void>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisServiceSyncFromHisResult, Error, string | void>({
      mutationFn: (idbv) => hisServicesService.syncFromHis(idbv ?? undefined),
      onSuccess: (data, variables, context) => {
        // `inserted` đã được BE ghi thẳng vào DB ngay trong bước sync.
        qc.invalidateQueries({ queryKey: hisServicesKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useSyncApplyFromHis: (
    options?: UseMutationOptions<HisServiceSyncApplyResult, Error, HisServiceSyncApplyChangeInput[]>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisServiceSyncApplyResult, Error, HisServiceSyncApplyChangeInput[]>({
      mutationFn: (changes) => hisServicesService.syncApplyFromHis(changes),
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

  useSyncToHis: (
    options?: UseMutationOptions<HisServiceSyncToHisResult, Error, void>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisServiceSyncToHisResult, Error, void>({
      mutationFn: () => hisServicesService.syncToHis(),
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
