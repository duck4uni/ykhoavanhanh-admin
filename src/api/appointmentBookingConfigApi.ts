/**
 * API công tắc ĐÓNG/MỞ chức năng đặt lịch khám trên app (Appointment Booking Config).
 *
 * Resource dạng singleton (chỉ 1 bản ghi cấu hình toàn hệ thống) — không dùng
 * `createApi`, theo pattern module bespoke cho resource không chuẩn (giống
 * `appointmentReminderConfigApi.ts` / `hisAutoSyncConfigApi.ts`).
 *
 * Dùng khi cần tạm dừng tiếp nhận đặt lịch từ app: bảo trì hệ thống, nghỉ Tết,
 * HIS lỗi, phát hiện sai giá hàng loạt… mà không phải deploy lại backend hay
 * ép app cập nhật.
 *
 * Khi `is_enabled = false`:
 * - Bệnh nhân gọi POST /appointments → 403 kèm `disabled_message`.
 * - Tiếp tân (quyền receptionist.create_schedule) và super admin VẪN lập được
 *   lịch hộ bệnh nhân tại viện.
 * - Lịch đã đặt KHÔNG bị ảnh hưởng: xem/thanh toán/huỷ/hoàn tiền/nhắc lịch/
 *   đồng bộ HIS vẫn chạy bình thường.
 *
 * Endpoints:
 * - GET /appointment-booking-config  → đọc cấu hình hiện tại (admin).
 * - PUT /appointment-booking-config  → cập nhật `is_enabled` / `disabled_message`
 *   (partial update, admin).
 *
 * Ngoài ra backend còn có GET /appointment-booking-config/status (public, không
 * cần token) dành riêng cho app mobile đọc trạng thái — FE admin không dùng.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppointmentBookingConfig {
  /** `true` = đang cho đặt lịch trên app; `false` = đang tạm ngưng. */
  is_enabled: boolean;
  /**
   * Lý do hiển thị cho người dùng khi đang đóng (tối đa 1000 ký tự).
   * `null` = chưa soạn, khi đóng backend sẽ dùng câu mặc định.
   */
  disabled_message: string | null;
  /** `users.id` của admin sửa lần cuối — để đối soát "ai đóng đặt lịch lúc nào". */
  updated_by: string | null;
  updated_at: string;
}

export interface UpdateAppointmentBookingConfigPayload {
  is_enabled?: boolean;
  /** Gửi `null` hoặc chuỗi rỗng để xoá lý do (quay về câu mặc định của backend). */
  disabled_message?: string | null;
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const appointmentBookingConfigKeys = {
  all: ["appointment-booking-config"] as const,
  detail: () => [...appointmentBookingConfigKeys.all, "detail"] as const,
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const appointmentBookingConfigService = {
  getConfig: async (): Promise<AppointmentBookingConfig> => {
    const res = await apiGet<AppointmentBookingConfig>("/appointment-booking-config");
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Không tải được cấu hình đặt lịch khám");
  },
  updateConfig: async (
    payload: UpdateAppointmentBookingConfigPayload,
  ): Promise<AppointmentBookingConfig> => {
    const res = await apiPut<AppointmentBookingConfig>("/appointment-booking-config", payload);
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Cập nhật cấu hình đặt lịch khám thất bại");
  },
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const appointmentBookingConfigHooks = {
  useConfig: () =>
    useQuery({
      queryKey: appointmentBookingConfigKeys.detail(),
      queryFn: appointmentBookingConfigService.getConfig,
      staleTime: 60_000,
    }),

  useUpdateConfig: (options?: {
    onSuccess?: (data: AppointmentBookingConfig) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: appointmentBookingConfigService.updateConfig,
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: appointmentBookingConfigKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error: Error) => options?.onError?.(error),
    });
  },
};
