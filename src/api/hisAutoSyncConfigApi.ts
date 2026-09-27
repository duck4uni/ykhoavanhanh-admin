/**
 * API cấu hình đồng bộ tự động lên HIS (Auto-Sync).
 *
 * Resource dạng singleton (chỉ 1 bản ghi cấu hình toàn hệ thống) — không dùng
 * `createApi`, theo pattern module bespoke cho resource không chuẩn (giống
 * `hisServicesApi.ts`, `appointmentBookingsApi.ts`).
 *
 * Endpoints:
 * - GET  /his-auto-sync-config                    → đọc cấu hình hiện tại.
 * - PUT  /his-auto-sync-config                    → cập nhật `is_enabled` / `sync_time`.
 * - POST /his-auto-sync-config/run-now            → chạy đồng bộ ngay (blocking call,
 *   luôn trả HTTP 200; `started: false` nghĩa là không có gì để chạy/đang chạy
 *   dở, KHÔNG phải lỗi).
 * - GET  /his-auto-sync-config/last-run-detail    → danh sách chi tiết từng lịch
 *   khám/bệnh nhân đã xử lý trong lần chạy gần nhất (chỉ giữ 1 lần gần nhất, không
 *   có lịch sử nhiều lần chạy).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiPost } from "@/lib/axios";
import type { AppointmentHisSyncStatus } from "@/api/appointmentBookingsApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export type HisAutoSyncRunStatus = "SUCCESS" | "PARTIAL" | "FAILED";

/** Thống kê 1 nhóm đối tượng (lịch khám/bệnh nhân) trong 1 lần chạy auto-sync. */
export interface HisAutoSyncCategorySummary {
  total: number;
  success: number;
  error: number;
  skipped?: number;
  /** Có giá trị khi riêng nhóm này không đồng bộ được (thường kèm số liệu = 0) — ưu
   * tiên hiển thị message này thay vì lưới số liệu 0/0/0/0 gây hiểu nhầm. */
  message?: string;
}

/** Tóm tắt kết quả lần chạy auto-sync gần nhất. */
export interface HisAutoSyncSummary {
  appointments?: HisAutoSyncCategorySummary;
  patients?: HisAutoSyncCategorySummary;
  /** Có giá trị khi cả lần chạy thất bại hoàn toàn (không tách được theo nhóm). */
  message?: string;
}

export interface HisAutoSyncConfig {
  is_enabled: boolean;
  /** Giờ chạy hàng ngày, định dạng "HH:mm:ss" theo giờ Việt Nam (Asia/Ho_Chi_Minh). */
  sync_time: string;
  last_run_at: string | null;
  last_run_status: HisAutoSyncRunStatus | null;
  last_run_summary: HisAutoSyncSummary | null;
}

export interface UpdateHisAutoSyncConfigPayload {
  is_enabled?: boolean;
  sync_time?: string;
}

export interface HisAutoSyncRunNowResult {
  started: boolean;
  summary?: HisAutoSyncSummary;
}

/** 1 lịch hẹn khám đã được xử lý trong lần chạy auto-sync gần nhất. */
export interface HisAutoSyncLastRunAppointmentItem {
  appointment_id: string;
  patient_id: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  his_sync_status: AppointmentHisSyncStatus;
  synced_to_his_at: string | null;
  his_booking_id: string | null;
  his_mavaovien: string | null;
  his_stt: string | null;
  last_his_sync_error: string | null;
}

/** 1 hồ sơ bệnh nhân đã được xử lý trong lần chạy auto-sync gần nhất. */
export interface HisAutoSyncLastRunPatientItem {
  patient_id: string;
  his_patient_id: string | null;
  patient_name: string | null;
  phone_number: string | null;
  /** Kết quả của LẦN THỬ TRONG LẦN CHẠY NÀY, không phải trạng thái hiện tại của bệnh nhân. */
  is_success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface HisAutoSyncLastRunDetail {
  /** `null` nghĩa là chưa từng chạy lần nào — khi đó 2 mảng dưới luôn rỗng. */
  last_run_at: string | null;
  window_start: string | null;
  window_end: string | null;
  appointments: HisAutoSyncLastRunAppointmentItem[];
  patients: HisAutoSyncLastRunPatientItem[];
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const hisAutoSyncConfigKeys = {
  all: ["his-auto-sync-config"] as const,
  detail: () => [...hisAutoSyncConfigKeys.all, "detail"] as const,
  lastRunDetail: () => [...hisAutoSyncConfigKeys.all, "last-run-detail"] as const,
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const hisAutoSyncConfigService = {
  getConfig: async (): Promise<HisAutoSyncConfig> => {
    const res = await apiGet<HisAutoSyncConfig>("/his-auto-sync-config");
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Không tải được cấu hình đồng bộ tự động HIS");
  },
  updateConfig: async (payload: UpdateHisAutoSyncConfigPayload): Promise<HisAutoSyncConfig> => {
    const res = await apiPut<HisAutoSyncConfig>("/his-auto-sync-config", payload);
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Cập nhật cấu hình đồng bộ tự động HIS thất bại");
  },
  runNow: async (): Promise<HisAutoSyncRunNowResult> => {
    // Endpoint luôn trả HTTP 200 kể cả khi có lỗi từng phần — không throw theo
    // status HTTP, chỉ đọc responseData.
    const res = await apiPost<HisAutoSyncRunNowResult>("/his-auto-sync-config/run-now");
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Không thể chạy đồng bộ HIS ngay bây giờ");
  },
  getLastRunDetail: async (): Promise<HisAutoSyncLastRunDetail> => {
    const res = await apiGet<HisAutoSyncLastRunDetail>("/his-auto-sync-config/last-run-detail");
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Không tải được chi tiết lần chạy gần nhất");
  },
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const hisAutoSyncConfigHooks = {
  useConfig: () =>
    useQuery({
      queryKey: hisAutoSyncConfigKeys.detail(),
      queryFn: hisAutoSyncConfigService.getConfig,
      staleTime: 60_000,
    }),

  useUpdateConfig: (options?: {
    onSuccess?: (data: HisAutoSyncConfig) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: hisAutoSyncConfigService.updateConfig,
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: hisAutoSyncConfigKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error: Error) => options?.onError?.(error),
    });
  },

  useRunNow: (options?: {
    onSuccess?: (data: HisAutoSyncRunNowResult) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: hisAutoSyncConfigService.runNow,
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: hisAutoSyncConfigKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error: Error) => options?.onError?.(error),
    });
  },

  // Chỉ fetch khi modal chi tiết được mở (enabled) — tránh gọi API này ngay khi
  // vào trang trong khi phần lớn thời gian người dùng không cần xem chi tiết.
  useLastRunDetail: (options?: { enabled?: boolean }) =>
    useQuery({
      queryKey: hisAutoSyncConfigKeys.lastRunDetail(),
      queryFn: hisAutoSyncConfigService.getLastRunDetail,
      enabled: options?.enabled ?? false,
      staleTime: 30_000,
    }),
};
