/**
 * Permissions System
 * Định nghĩa các quyền cho hệ thống bệnh viện Vạn Hạnh
 */

// Các quyền cụ thể
export type Permission =
  // Admin permissions
  | "admin.all"                    // Toàn quyền hệ thống
  | "admin.sync_exam"              // Đồng bộ phiếu khám thủ công
  | "admin.edit_mabn"              // Chỉnh sửa MABN
  | "admin.manage_doctor"          // Quản lý Bác sĩ
  | "admin.manage_exam_room"       // Quản lý Phòng khám
  | "admin.declare_specialty"      // Khai báo chuyên khoa
  | "admin.declare_service_price"  // Khai báo giá dịch vụ
  | "admin.cancel_exam"            // Hoàn hủy phiếu khám
  | "admin.report_reconciliation"   // Báo cáo đối soát

  // Accountant permissions
  | "accountant.cancel_exam"       // Hoàn hủy phiếu khám
  | "accountant.refund"            // Trả tiền Bệnh nhân
  | "accountant.report_bank"       // Báo cáo đối soát ngân hàng
  | "accountant.report_his"        // Báo cáo đối soát His

  // CSKH permissions
  | "cskh.schedule_reminder"       // Lên lịch nhắc hẹn tái khám
  | "cskh.message_template"        // Quản lý mẫu tin nhắn
  | "cskh.survey"                  // Quản lý khảo sát đánh giá
  | "cskh.report_survey"           // Lấy báo cáo đánh giá
  | "cskh.chat"                    // Chat tư vấn
  | "cskh.answer_question"         // Trả lời câu hỏi thắc mắc

  // Marketing permissions
  | "marketing.promotion"          // Lên chương trình khuyến mãi
  | "marketing.advertisement"      // Quảng cáo
  | "marketing.sell_package"       // Bán dịch vụ gói khám

  // Receptionist permissions
  | "receptionist.create_schedule" // Lập lịch khám
  | "receptionist.edit_schedule"   // Chỉnh sửa lịch khám
  | "receptionist.manage_leave"    // Quản lý lịch nghỉ phép BS

  // Common permissions
  | "user.manage"                  // Quản lý tài khoản nội bộ
  | "user.assign_role";           // Gán vai trò cho user

// Các vai trò trong hệ thống
export type RoleType =
  | "admin"          // Admin - Toàn quyền
  | "accountant"     // Kế toán
  | "cskh"           // Chăm sóc khách hàng
  | "marketing"      // Marketing
  | "receptionist";  // Tiếp tân

// Cấu trúc vai trò
export interface Role {
  id: string;
  role_name: string;
  description: string;
  role_type: RoleType;
  permissions: Permission[];
}

// Map từ role_type sang permissions mặc định
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  admin: [
    "admin.all",
    "admin.sync_exam",
    "admin.edit_mabn",
    "admin.manage_doctor",
    "admin.manage_exam_room",
    "admin.declare_specialty",
    "admin.declare_service_price",
    "admin.cancel_exam",
    "admin.report_reconciliation",
    "accountant.cancel_exam",
    "accountant.refund",
    "accountant.report_bank",
    "accountant.report_his",
    "cskh.schedule_reminder",
    "cskh.message_template",
    "cskh.survey",
    "cskh.report_survey",
    "cskh.chat",
    "cskh.answer_question",
    "marketing.promotion",
    "marketing.advertisement",
    "marketing.sell_package",
    "receptionist.create_schedule",
    "receptionist.edit_schedule",
    "receptionist.manage_leave",
    "user.manage",
    "user.assign_role",
  ],
  accountant: [
    "accountant.cancel_exam",
    "accountant.refund",
    "accountant.report_bank",
    "accountant.report_his",
  ],
  cskh: [
    "cskh.schedule_reminder",
    "cskh.message_template",
    "cskh.survey",
    "cskh.report_survey",
    "cskh.chat",
    "cskh.answer_question",
  ],
  marketing: [
    "marketing.promotion",
    "marketing.advertisement",
    "marketing.sell_package",
  ],
  receptionist: [
    "receptionist.create_schedule",
    "receptionist.edit_schedule",
    "receptionist.manage_leave",
  ],
};

/**
 * Mã quyền ĐÃ được backend thực sự kiểm tra bằng `requirePermission(...)`.
 * Mọi mã khác trong `Permission` hiện chỉ ảnh hưởng menu/UI của FE — API tương
 * ứng vẫn nằm dưới `verifyAdmin` nên nhân viên gọi vào sẽ bị 403.
 *
 * PHẢI cập nhật danh sách này mỗi khi một route backend được chuyển sang
 * `requirePermission` (nguồn: các call site `requirePermission` trong backend).
 */
export const BACKEND_ENFORCED_PERMISSIONS: readonly Permission[] = [
  "accountant.report_bank", // GET /appointment-booking-payments, /appointment-booking-refunds
  "accountant.refund", // POST /payment/vcb/refund; + bắt buộc khi huỷ phiếu ĐÃ thanh toán
  "accountant.cancel_exam", // DELETE /appointments/{id}, PATCH /appointments/{id}/cancel
];

/** `true` nếu mã quyền đã có route backend kiểm tra. */
export function isBackendEnforced(code: Permission | string): boolean {
  return (BACKEND_ENFORCED_PERMISSIONS as readonly string[]).includes(code);
}

/**
 * Mã quyền KHÔNG được cấp qua UI phân quyền.
 *
 * `admin.all` với backend chỉ là mã quyền thường (không bỏ qua kiểm tra gì —
 * chỉ cờ `is_admin` mới làm super admin), nên để nó trong bộ chọn sẽ khiến người
 * dùng hiểu sai "cấp mã này = thành admin tổng". Vai trò nào đang giữ sẵn mã này
 * vẫn được giữ nguyên khi lưu (xem UI /roles).
 */
export const NON_GRANTABLE_PERMISSIONS: readonly Permission[] = ["admin.all"];

/** `true` nếu mã quyền không được phép cấp mới qua UI. */
export function isNonGrantable(code: Permission | string): boolean {
  return (NON_GRANTABLE_PERMISSIONS as readonly string[]).includes(code);
}

// Mô tả vai trò bằng tiếng Việt
export const ROLE_LABELS: Record<RoleType, string> = {
  admin: "Quản trị viên",
  accountant: "Kế toán",
  cskh: "Chăm sóc khách hàng",
  marketing: "Marketing",
  receptionist: "Tiếp tân",
};

// Mô tả quyền bằng tiếng Việt
export const PERMISSION_LABELS: Record<Permission, string> = {
  // Admin
  "admin.all": "Toàn quyền hệ thống",
  "admin.sync_exam": "Đồng bộ phiếu khám thủ công",
  "admin.edit_mabn": "Chỉnh sửa MABN",
  "admin.manage_doctor": "Quản lý Bác sĩ",
  "admin.manage_exam_room": "Quản lý Phòng khám",
  "admin.declare_specialty": "Khai báo chuyên khoa",
  "admin.declare_service_price": "Khai báo giá dịch vụ",
  "admin.cancel_exam": "Hoàn hủy phiếu khám",
  "admin.report_reconciliation": "Báo cáo đối soát",
  // Accountant
  "accountant.cancel_exam": "Hoàn hủy phiếu khám",
  "accountant.refund": "Trả tiền Bệnh nhân",
  "accountant.report_bank": "Báo cáo đối soát ngân hàng",
  "accountant.report_his": "Báo cáo đối soát HIS",
  // CSKH
  "cskh.schedule_reminder": "Lên lịch nhắc hẹn tái khám",
  "cskh.message_template": "Quản lý mẫu tin nhắn",
  "cskh.survey": "Quản lý khảo sát đánh giá",
  "cskh.report_survey": "Lấy báo cáo đánh giá",
  "cskh.chat": "Chat tư vấn",
  "cskh.answer_question": "Trả lời câu hỏi thắc mắc",
  // Marketing
  "marketing.promotion": "Lên chương trình khuyến mãi",
  "marketing.advertisement": "Quảng cáo",
  "marketing.sell_package": "Bán dịch vụ gói khám",
  // Receptionist
  "receptionist.create_schedule": "Lập lịch khám",
  "receptionist.edit_schedule": "Chỉnh sửa lịch khám",
  "receptionist.manage_leave": "Quản lý lịch nghỉ phép BS",
  // Common
  "user.manage": "Quản lý tài khoản nội bộ",
  "user.assign_role": "Gán vai trò cho user",
};
