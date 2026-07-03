/**
 * Patient API - Patient Management
 * Proxy tới HIS external API, đồng bộ vào his_patients nội bộ.
 */

import { apiGet, apiPost, apiPut } from "@/lib/axios";
import type { Patient, SearchPatientParams, CreatePatientPayload } from "@/types/patient";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface HisApiParams {
  ip?: string;
  idbv?: string;
}

export interface PaginatedPatients {
  count: number;
  rows: Patient[];
  totalPages: number;
  currentPage: number;
}

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: SearchPatientParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (patientId: string) => [...patientKeys.details(), patientId] as const,
  byCode: (code: string) => [...patientKeys.all, "byCode", code] as const,
  byPhone: (phone: string) => [...patientKeys.all, "byPhone", phone] as const,
};

// ─── Service Functions ─────────────────────────────────────────────────────

async function searchPatients(params: SearchPatientParams): Promise<PaginatedPatients> {
  const res = await apiGet<PaginatedPatients>("/patient", { params });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể tìm kiếm bệnh nhân");
}

async function getAllPatients(): Promise<PaginatedPatients> {
  const res = await apiGet<PaginatedPatients>("/patients");
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy danh sách bệnh nhân");
}

async function getPatientById(patientId: string): Promise<Patient> {
  const res = await apiGet<Patient>(`/patient/${patientId}`);
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy thông tin bệnh nhân");
}

async function createPatient(args: { payload: CreatePatientPayload; options?: HisApiParams }): Promise<Patient> {
  const { payload, options = {} } = args;
  const res = await apiPost<Patient>("/patient", payload, {
    params: {
      ip: options.ip ?? "",
      idbv: options.idbv ?? "",
    },
  });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Tạo bệnh nhân thất bại");
}

async function updatePatient(args: {
  patientId: string;
  payload: Partial<CreatePatientPayload>;
  options?: HisApiParams;
}): Promise<Patient> {
  const { patientId, payload, options = {} } = args;
  const res = await apiPut<Patient>(`/patient/${patientId}`, payload, {
    params: {
      ip: options.ip ?? "",
      idbv: options.idbv ?? "",
    },
  });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Cập nhật hồ sơ bệnh nhân thất bại");
}

export interface MergePatientPayload {
  patientid_keep: string;
  patientid_merge: string;
}

async function mergePatients(args: {
  payload: MergePatientPayload;
  options?: HisApiParams;
}): Promise<unknown> {
  const { payload, options = {} } = args;
  const res = await apiPost<unknown>("/patient/merge", payload, {
    params: {
      ip: options.ip ?? "",
      idbv: options.idbv ?? "",
    },
  });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Gộp bệnh nhân thất bại");
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useSearchPatients(
  params: SearchPatientParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => searchPatients(params),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Tìm/tải bệnh nhân theo trang, hỗ trợ cuộn để tải thêm (infinite scroll).
 * Trả về danh sách phẳng qua `patients` + `fetchNextPage`/`hasNextPage`.
 */
export function useInfinitePatients(
  params: SearchPatientParams,
  options?: { enabled?: boolean; pageSize?: number }
) {
  const pageSize = options?.pageSize ?? 10;
  const query = useInfiniteQuery({
    queryKey: [...patientKeys.list(params), "infinite", pageSize],
    queryFn: ({ pageParam }) => searchPatients({ ...params, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    enabled: options?.enabled ?? true,
  });

  const patients = query.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = query.data?.pages[0]?.count ?? 0;

  return { ...query, patients, total };
}

export function useGetAllPatients() {
  return useQuery({
    queryKey: patientKeys.lists(),
    queryFn: getAllPatients,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function useGetPatientById(patientId: string | null | undefined) {
  return useQuery({
    queryKey: patientKeys.detail(patientId ?? ""),
    queryFn: () => getPatientById(patientId!),
    enabled: Boolean(patientId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreatePatient(options?: {
  onSuccess?: (data: Patient) => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPatient,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: patientKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (error) => options?.onError?.(error),
  });
}

export function useUpdatePatient(options?: {
  onSuccess?: (data: Patient) => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePatient,
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: patientKeys.all });
      qc.invalidateQueries({ queryKey: patientKeys.detail(variables.patientId) });
      options?.onSuccess?.(data);
    },
    onError: (error) => options?.onError?.(error),
  });
}

export function useMergePatients(options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mergePatients,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: patientKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (error) => options?.onError?.(error),
  });
}
