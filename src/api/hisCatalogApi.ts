/**
 * HIS Catalog API — Danh mục dùng chung đồng bộ từ HIS
 * (Quốc gia, Tỉnh/Thành, Quận/Huyện, Phường/Xã, Dân tộc, Nghề nghiệp)
 *
 * Kể từ 2026-09-24, GET các danh mục này chỉ đọc DB nội bộ (không tự gọi
 * HIS). Muốn cập nhật dữ liệu phải chủ động gọi `POST <endpoint>/sync` để
 * xem diff (bản ghi mới tự thêm ngay, bản ghi đã có mà khác nằm trong
 * `changes` chờ xác nhận), rồi `POST <endpoint>/sync-apply` để áp dụng các
 * thay đổi người dùng đã chọn. Xem `docs/api/HIS_MasterData_FE_Guide.md`
 * (backend repo) để biết chi tiết pattern.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/axios";

// ─── Types dùng chung cho mọi danh mục ──────────────────────────────────────

export interface HisCatalogListParams {
  /** Mã cơ sở y tế (HIS). Không truyền → BE tự fallback cơ sở active đầu tiên. */
  idbv?: string;
  currentPage?: number;
  pageSize?: number;
  /** Cú pháp Sieve, VD "profession_name@=Giáo". */
  filters?: string;
  /** Không có tác dụng trên các danh mục này — BE luôn sort cứng `*_name ASC`. */
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface HisCatalogPaginatedResult<T> {
  count: number;
  rows: T[];
  totalPages: number;
  currentPage: number;
}

/** Một dòng thay đổi cần xác nhận trong response `POST <endpoint>/sync`. */
export interface HisCatalogSyncChange<T> {
  id: string;
  code?: string;
  label?: string;
  diff_fields: string[];
  current: Partial<T>;
  /** Phải gửi lại NGUYÊN VĂN object này khi gọi `sync-apply` — server không xác thực lại với HIS. */
  incoming: Partial<T> & { raw_data?: Record<string, unknown> | null; synced_at?: string };
}

export interface HisCatalogSyncResult<T> {
  inserted_count: number;
  /** Bản ghi mới — đã ghi thẳng vào DB, không cần xác nhận. */
  inserted: T[];
  /** Bản ghi đã có mà khác dữ liệu HIS — CHƯA ghi DB, cần `sync-apply` mới áp dụng. */
  changes: HisCatalogSyncChange<T>[];
  unchanged_count: number;
}

export interface HisCatalogApplyChangeInput<T> {
  id: string;
  incoming: HisCatalogSyncChange<T>["incoming"];
}

export interface HisCatalogApplyResult<T> {
  applied_count: number;
  applied: T[];
  /** id gửi lên nhưng không tìm thấy row tương ứng — không phải lỗi HTTP. */
  not_found_ids: string[];
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Tạo bộ `{service, keys, hooks}` cho một danh mục "dùng chung" đồng bộ từ
 * HIS theo pattern diff/accept. Không dùng chung `createApi` (CRUD) vì các
 * danh mục này chỉ đọc + đồng bộ, không có create/update/delete thủ công.
 *
 * @param endpoint URL resource trên BE (lưu ý 4/6 danh mục dùng số ít:
 *   "district", "ward", "nation", "profession").
 * @param resourceKey Khoá dùng cho TanStack Query — mặc định trùng `endpoint`,
 *   truyền riêng khi `endpoint` không phải định danh duy nhất.
 */
export function createHisCatalogApi<
  T,
  TListParams extends HisCatalogListParams = HisCatalogListParams,
  TSyncParams extends Record<string, unknown> = { idbv?: string },
>(endpoint: string, resourceKey: string = endpoint) {
  const baseKey = `his-catalog-${resourceKey}`;

  const keys = {
    all: [baseKey] as const,
    list: (params?: TListParams) => [baseKey, "list", params] as const,
  };

  // ─── Service ───────────────────────────────────────────────────────────

  const service = {
    getList: async (params?: TListParams): Promise<HisCatalogPaginatedResult<T>> => {
      const res = await apiGet<HisCatalogPaginatedResult<T>>(`/${endpoint}`, { params });
      if (res.data.status === "success" && res.data.responseData) {
        return res.data.responseData;
      }
      throw new Error(res.data.message || "Không thể lấy danh sách");
    },

    /** `POST /<endpoint>/sync` — kéo dữ liệu từ HIS, diff với DB. */
    sync: async (params?: TSyncParams): Promise<HisCatalogSyncResult<T>> => {
      const res = await apiPost<HisCatalogSyncResult<T>>(`/${endpoint}/sync`, undefined, {
        params,
      });
      if (res.data.status === "success" && res.data.responseData) {
        return res.data.responseData;
      }
      throw new Error(res.data.message || "Đồng bộ từ HIS thất bại");
    },

    /** `POST /<endpoint>/sync-apply` — áp dụng các `changes` người dùng đã chọn. */
    syncApply: async (
      changes: HisCatalogApplyChangeInput<T>[]
    ): Promise<HisCatalogApplyResult<T>> => {
      const res = await apiPost<HisCatalogApplyResult<T>>(`/${endpoint}/sync-apply`, { changes });
      if (res.data.status === "success" && res.data.responseData) {
        return res.data.responseData;
      }
      throw new Error(res.data.message || "Áp dụng thay đổi thất bại");
    },
  };

  // ─── Hooks ─────────────────────────────────────────────────────────────

  const hooks = {
    useList: (
      params?: TListParams,
      options?: { enabled?: boolean; staleTime?: number }
    ): UseQueryResult<HisCatalogPaginatedResult<T>, Error> => {
      return useQuery<HisCatalogPaginatedResult<T>, Error>({
        queryKey: keys.list(params),
        queryFn: () => service.getList(params),
        staleTime: 1000 * 60 * 2,
        enabled: options?.enabled ?? true,
        ...options,
      });
    },

    useSync: (
      options?: UseMutationOptions<HisCatalogSyncResult<T>, Error, TSyncParams | void>
    ) => {
      const qc = useQueryClient();
      const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
      return useMutation<HisCatalogSyncResult<T>, Error, TSyncParams | void>({
        mutationFn: (params) => service.sync(params ?? undefined),
        onSuccess: (data, variables, context) => {
          // `inserted` đã được BE ghi thẳng vào DB ngay trong bước sync.
          qc.invalidateQueries({ queryKey: keys.all });
          (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
        },
        onError: (error, variables, context) => {
          (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
        },
        ...rest,
      });
    },

    useSyncApply: (
      options?: UseMutationOptions<
        HisCatalogApplyResult<T>,
        Error,
        HisCatalogApplyChangeInput<T>[]
      >
    ) => {
      const qc = useQueryClient();
      const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
      return useMutation<HisCatalogApplyResult<T>, Error, HisCatalogApplyChangeInput<T>[]>({
        mutationFn: (changes) => service.syncApply(changes),
        onSuccess: (data, variables, context) => {
          qc.invalidateQueries({ queryKey: keys.all });
          (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
        },
        onError: (error, variables, context) => {
          (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
        },
        ...rest,
      });
    },
  };

  return { service, keys, hooks };
}

// ─── Entities + instantiations ─────────────────────────────────────────────

export interface HisCountry {
  id: string;
  facility_id: string;
  country_code: string;
  country_name: string;
  raw_data?: Record<string, unknown> | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const {
  service: countriesService,
  keys: countriesKeys,
  hooks: countriesHooks,
} = createHisCatalogApi<HisCountry>("countries");

export interface HisProvince {
  id: string;
  facility_id: string;
  province_code: string;
  province_name: string;
  raw_data?: Record<string, unknown> | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const {
  service: provincesService,
  keys: provincesKeys,
  hooks: provincesHooks,
} = createHisCatalogApi<HisProvince>("provinces");

export interface HisDistrict {
  id: string;
  facility_id: string;
  province_code: string;
  district_code: string;
  district_name?: string;
  district_type?: string;
  raw_data?: Record<string, unknown> | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HisDistrictListParams extends HisCatalogListParams {
  /** Mã tỉnh/thành để lọc quận/huyện. Không truyền → trả toàn bộ. */
  city?: string;
}

// `type` (không phải `interface`) để có implicit index signature, thỏa constraint
// `TSyncParams extends Record<string, unknown>` của `createHisCatalogApi`.
export type HisDistrictSyncParams = {
  idbv?: string;
  city?: string;
};

// Lưu ý URL BE là số ít "district" (không phải "districts").
export const {
  service: districtsService,
  keys: districtsKeys,
  hooks: districtsHooks,
} = createHisCatalogApi<HisDistrict, HisDistrictListParams, HisDistrictSyncParams>(
  "district",
  "districts"
);

export interface HisWard {
  id: string;
  facility_id: string;
  district_code: string;
  ward_code: string;
  ward_name?: string;
  ward_type?: string;
  raw_data?: Record<string, unknown> | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HisWardListParams extends HisCatalogListParams {
  /** Mã quận/huyện để lọc phường/xã. Không truyền → trả toàn bộ. */
  districtcode?: string;
}

// `type` (không phải `interface`) để có implicit index signature, thỏa constraint
// `TSyncParams extends Record<string, unknown>` của `createHisCatalogApi`.
export type HisWardSyncParams = {
  idbv?: string;
  districtcode?: string;
};

// Lưu ý URL BE là số ít "ward" (không phải "wards").
export const {
  service: wardsService,
  keys: wardsKeys,
  hooks: wardsHooks,
} = createHisCatalogApi<HisWard, HisWardListParams, HisWardSyncParams>("ward", "wards");

export interface HisNation {
  id: string;
  facility_id: string;
  /** Tên cột thật là `nation_id`, không phải `nation_code`. */
  nation_id: string;
  nation_name: string;
  raw_data?: Record<string, unknown> | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Lưu ý URL BE là số ít "nation" (không phải "nations").
export const {
  service: nationsService,
  keys: nationsKeys,
  hooks: nationsHooks,
} = createHisCatalogApi<HisNation>("nation", "nations");

export interface HisProfession {
  id: string;
  facility_id: string;
  /** Tên cột thật là `profession_id`, không phải `profession_code`. */
  profession_id: string;
  profession_name: string;
  raw_data?: Record<string, unknown> | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Lưu ý URL BE là số ít "profession" (không phải "professions").
export const {
  service: professionsService,
  keys: professionsKeys,
  hooks: professionsHooks,
} = createHisCatalogApi<HisProfession>("profession", "professions");
