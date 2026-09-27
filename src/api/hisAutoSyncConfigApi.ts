/**
 * API cấu hình đồng bộ tự động lên HIS (Auto-Sync).
 *
 * Resource dạng singleton (chỉ 1 bản ghi cấu hình toàn hệ thống) — không dùng
 * `createApi`, theo pattern module bespoke cho resource không chuẩn (giống
 * `hisServicesApi.ts`, `appointmentBookingsApi.ts`).
 *
 * Endpoints:
 * - GET  /his-auto-sync-config           → đọc cấu hình hiện tại.
 * - PUT  /his-auto-sync-config           → cập nhật `is_enabled` / `sync_time`.
 * - POST /his-auto-sync-config/run-now   → chạy đồng bộ ngay (blocking call,
 *   luôn trả HTTP 200; `started: false` nghĩa là không có gì để chạy/đang chạy
 *   dở, KHÔNG phải lỗi).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiPost } from "@/lib/axios";

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

// ─── Query keys ──────────────────────────────────────────────────────────────

export const hisAutoSyncConfigKeys = {
  all: ["his-auto-sync-config"] as const,
  detail: () => [...hisAutoSyncConfigKeys.all, "detail"] as const,
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
};
