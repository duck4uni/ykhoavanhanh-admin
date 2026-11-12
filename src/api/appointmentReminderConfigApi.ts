/**
 * API cấu hình nhắc lịch khám qua OneSignal (Appointment Reminder Config).
 *
 * Resource dạng singleton (chỉ 1 bản ghi cấu hình toàn hệ thống) — không dùng
 * `createApi`, theo pattern module bespoke cho resource không chuẩn (giống
 * `hisAutoSyncConfigApi.ts`).
 *
 * Job nền (cron) chạy ngầm mỗi 5 phút, với mỗi lịch khám PAID/CONFIRMED sẽ gửi
 * thông báo (push OneSignal + ghi bảng notification) vào 2 mốc giờ độc lập
 * trước giờ hẹn — mỗi mốc chỉ gửi đúng 1 lần cho mỗi lịch khám.
 *
 * Endpoints:
 * - GET /appointment-reminder-config  → đọc cấu hình hiện tại + kết quả lần
 *   tick gần nhất.
 * - PUT /appointment-reminder-config  → cập nhật `is_enabled` /
 *   `reminder_1_hours_before` / `reminder_2_hours_before` (partial update).
 *
 * FE không cần tự quy đổi timezone — mọi mốc giờ được tính theo giờ Việt Nam
 * (Asia/Ho_Chi_Minh) ở backend; `reminder_N_hours_before` chỉ là số giờ.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppointmentReminderConfig {
  is_enabled: boolean;
  /** Số giờ trước giờ hẹn cho mốc nhắc thứ nhất (mặc định 24, khoảng 1-720). */
  reminder_1_hours_before: number;
  /** Số giờ trước giờ hẹn cho mốc nhắc thứ hai (mặc định 2, khoảng 1-720). */
  reminder_2_hours_before: number;
  /** `null` nghĩa là job nền chưa từng tick lần nào. */
  last_tick_at: string | null;
  /** Số thông báo mốc 1 đã gửi ở LẦN TICK GẦN NHẤT (không phải tổng cộng từ trước tới giờ). */
  last_tick_reminder_1_count: number;
  /** Số thông báo mốc 2 đã gửi ở LẦN TICK GẦN NHẤT. */
  last_tick_reminder_2_count: number;
}

export interface UpdateAppointmentReminderConfigPayload {
  is_enabled?: boolean;
  reminder_1_hours_before?: number;
  reminder_2_hours_before?: number;
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const appointmentReminderConfigKeys = {
  all: ["appointment-reminder-config"] as const,
  detail: () => [...appointmentReminderConfigKeys.all, "detail"] as const,
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const appointmentReminderConfigService = {
  getConfig: async (): Promise<AppointmentReminderConfig> => {
    const res = await apiGet<AppointmentReminderConfig>("/appointment-reminder-config");
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Không tải được cấu hình nhắc lịch khám");
  },
  updateConfig: async (
    payload: UpdateAppointmentReminderConfigPayload,
  ): Promise<AppointmentReminderConfig> => {
    const res = await apiPut<AppointmentReminderConfig>("/appointment-reminder-config", payload);
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Cập nhật cấu hình nhắc lịch khám thất bại");
  },
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const appointmentReminderConfigHooks = {
  useConfig: () =>
    useQuery({
      queryKey: appointmentReminderConfigKeys.detail(),
      queryFn: appointmentReminderConfigService.getConfig,
      staleTime: 60_000,
    }),

  useUpdateConfig: (options?: {
    onSuccess?: (data: AppointmentReminderConfig) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: appointmentReminderConfigService.updateConfig,
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: appointmentReminderConfigKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error: Error) => options?.onError?.(error),
    });
  },
};
