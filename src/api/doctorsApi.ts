import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api, apiGet, apiPost, apiPut, apiDelete } from "@/lib/axios";
import { createApi } from "./createApi";

// ─── HIS Doctor Type (khớp api.md) ────────────────────────────────────────

export interface HisDoctor {
  /** UUID nội bộ nếu API trả về; fallback về doctorid với response HIS cũ. */
  id: string;
  /** Mã bác sĩ HIS, normalize từ doctor_id/doctorid. */
  doctorid: string;
  /** Tên bác sĩ, normalize từ doctor_name/doctorname. */
  doctorname: string;
  description: string | null;
  updatetime: string;
  facility_id?: string | null;
  specialty_id?: string | null;
  avatar_url?: string | null;
  his_updated_at?: string | null;
  synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
  raw_data?: Record<string, unknown> | null;
}

type DoctorApiItem = Partial<HisDoctor> & {
  doctor_id?: string | null;
  doctor_name?: string | null;
  raw_data?: Record<string, unknown> | null;
};

type DoctorsListResponse =
  | DoctorApiItem[]
  | {
      count: number;
      rows: DoctorApiItem[];
      totalPages: number;
      currentPage: number;
    };

function normalizeDoctor(item: DoctorApiItem): HisDoctor {
  const raw = item.raw_data ?? null;
  const rawDoctorId = typeof raw?.doctorid === "string" ? raw.doctorid : undefined;
  const rawDoctorName = typeof raw?.doctorname === "string" ? raw.doctorname : undefined;
  const rawUpdateTime = typeof raw?.updatetime === "string" ? raw.updatetime : undefined;
  const doctorid = item.doctorid ?? item.doctor_id ?? rawDoctorId ?? item.id ?? "";
  return {
    ...item,
    id: item.id ?? doctorid,
    doctorid,
    doctorname: item.doctorname ?? item.doctor_name ?? rawDoctorName ?? "—",
    description: item.description ?? (typeof raw?.description === "string" ? raw.description : null),
    updatetime: item.updatetime ?? rawUpdateTime ?? item.updated_at ?? item.synced_at ?? "",
    raw_data: raw,
  };
}

function normalizeDoctorList(data: DoctorsListResponse): HisDoctor[] {
  const rows = Array.isArray(data) ? data : data.rows;
  return rows.map(normalizeDoctor);
}

export interface DoctorImportResult {
  row: number;
  doctor_id: string;
  doctor_name: string;
  status: "success" | "error";
  error?: string;
}

export interface DoctorImportReport {
  total: number;
  success: number;
  error: number;
  results: DoctorImportResult[];
}

export interface DoctorListParams {
  ip?: string;
  idbv?: string;
}

// ─── CRUD factory ─────────────────────────────────────────────────────────

const { service: baseService, hooks: baseHooks, keys } = createApi<HisDoctor>("doctors");

// ─── Custom service methods ─────────────────────────────────────────────────

export const doctorsService = {
  ...baseService,

  getList: async (params?: DoctorListParams): Promise<HisDoctor[]> => {
    const res = await apiGet<DoctorsListResponse>("/doctors", { params });
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeDoctorList(res.data.responseData);
    }
    throw new Error(res.data.message || "Không thể lấy danh sách bác sĩ");
  },

  getById: async (id: string): Promise<HisDoctor> => {
    const res = await apiGet<DoctorApiItem>(`/doctors/${id}`);
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeDoctor(res.data.responseData);
    }
    throw new Error(res.data.message || "Không thể lấy thông tin bác sĩ");
  },

  create: async (data: Partial<HisDoctor>): Promise<HisDoctor> => {
    const res = await apiPost<DoctorApiItem>("/doctors", {
      doctor_id: data.doctorid,
      doctor_name: data.doctorname,
      description: data.description,
    });
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeDoctor(res.data.responseData);
    }
    throw new Error(res.data.message || "Tạo bác sĩ thất bại");
  },

  update: async (id: string, data: Partial<HisDoctor>): Promise<HisDoctor> => {
    const res = await apiPut<DoctorApiItem>(`/doctors/${id}`, {
      doctor_id: data.doctorid ?? id,
      doctor_name: data.doctorname,
      description: data.description,
    });
    if (res.data.status === "success" && res.data.responseData) {
      return normalizeDoctor(res.data.responseData);
    }
    throw new Error(res.data.message || "Cập nhật bác sĩ thất bại");
  },

  remove: async (id: string): Promise<void> => {
    const res = await apiDelete(`/doctors/${id}`);
    if (res.data.status === "fail") {
      throw new Error(res.data.message || "Xóa bác sĩ thất bại");
    }
  },

  downloadTemplate: async (): Promise<Blob> => {
    const res = await api.get<Blob>("/doctors/template", { responseType: "blob" });
    return res.data;
  },

  exportList: async (params?: DoctorListParams): Promise<Blob> => {
    const res = await api.get<Blob>("/doctors/export", { params, responseType: "blob" });
    return res.data;
  },

  importDoctors: async (file: File): Promise<DoctorImportReport> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiPost<DoctorImportReport>("/doctors/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Import bác sĩ thất bại");
  },
};

// ─── Query Keys ───────────────────────────────────────────────────────────

export const doctorsKeys = keys;

// ─── Hooks ────────────────────────────────────────────────────────────────

export const doctorsHooks = {
  ...baseHooks,

  useList: (
    params?: DoctorListParams,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<HisDoctor[], Error> => {
    return useQuery<HisDoctor[], Error>({
      queryKey: doctorsKeys.list(params as unknown as Record<string, unknown>),
      queryFn: () => doctorsService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },

  useDetail: (
    id: string | null | undefined,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<HisDoctor, Error> => {
    return useQuery<HisDoctor, Error>({
      queryKey: doctorsKeys.detail(id ?? ""),
      queryFn: () => doctorsService.getById(id!),
      enabled: Boolean(id),
      staleTime: 1000 * 60 * 5,
      ...options,
    });
  },

  useCreate: (
    options?: UseMutationOptions<HisDoctor, Error, Partial<HisDoctor>>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisDoctor, Error, Partial<HisDoctor>>({
      mutationFn: (data) => doctorsService.create(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: doctorsKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useUpdate: (
    options?: UseMutationOptions<HisDoctor, Error, { id: string; data: Partial<HisDoctor> }>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<HisDoctor, Error, { id: string; data: Partial<HisDoctor> }>({
      mutationFn: ({ id, data }) => doctorsService.update(id, data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: doctorsKeys.all });
        qc.invalidateQueries({ queryKey: doctorsKeys.detail(variables.id) });
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
      mutationFn: (id) => doctorsService.remove(id),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: doctorsKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useImport: (
    options?: UseMutationOptions<DoctorImportReport, Error, File>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<DoctorImportReport, Error, File>({
      mutationFn: (file) => doctorsService.importDoctors(file),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: doctorsKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },
};
