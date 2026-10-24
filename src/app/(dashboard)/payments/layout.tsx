"use client";

import { PermissionGuard, AccessDenied } from "@/components/auth/PermissionGuard";
import { LoadingSpinner } from "@/components/ui/Spinner";

/**
 * Backend chặn cả danh sách và xuất Excel bằng
 * `requirePermission('accountant.report_bank')` → chỉ kế toán và super admin.
 *
 * Guard đặt ở layout (không phải từng page) để phủ luôn trang chi tiết
 * `/payments/[paymentId]` — trang đó đọc CÙNG endpoint danh sách
 * (`filters=id==<id>&pageSize=1`), nên nếu chỉ chặn trang danh sách thì mở link
 * chi tiết vẫn vào được và nhận 403 không rõ lý do.
 *
 * Đây là lớp UX cho khớp backend, KHÔNG phải lớp bảo mật: sidebar ẩn menu theo
 * role, nhưng gõ thẳng URL thì vẫn vào được. Lớp bảo mật vẫn là backend.
 */
export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      permission="accountant.report_bank"
      loadingFallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner text="Đang kiểm tra quyền..." />
        </div>
      }
      fallback={
        <AccessDenied message="Báo cáo đối soát ngân hàng chỉ dành cho kế toán và quản trị viên. Vui lòng liên hệ quản trị viên nếu bạn cần truy cập." />
      }
    >
      {children}
    </PermissionGuard>
  );
}
