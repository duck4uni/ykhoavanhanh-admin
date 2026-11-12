"use client";

import { PermissionGuard, AccessDenied } from "@/components/auth/PermissionGuard";
import { LoadingSpinner } from "@/components/ui/Spinner";

/**
 * Backend để /internal-accounts, /users, /user-roles dưới `verifyAdmin`
 * (cờ `is_admin`) và KHÔNG hỏi mã quyền nào — kể cả `user.manage` /
 * `user.assign_role`. Vì vậy chặn theo quyền ở FE là sai: nhân viên được cấp mã
 * đó vẫn vào được trang rồi nhận 403 ở mọi request. Gate đúng là super admin.
 */
export default function InternalAccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGuard
      superAdminOnly
      loadingFallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner text="Đang kiểm tra quyền..." />
        </div>
      }
      fallback={
        <AccessDenied message="Quản lý tài khoản nội bộ chỉ dành cho tài khoản quản trị cấp cao (admin tổng). Vui lòng liên hệ quản trị viên nếu bạn cần thay đổi." />
      }
    >
      {children}
    </PermissionGuard>
  );
}
