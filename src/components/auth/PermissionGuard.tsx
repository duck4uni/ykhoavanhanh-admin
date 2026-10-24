"use client";

/**
 * PermissionGuard Component
 * Bảo vệ các thành phần UI dựa trên quyền
 */

import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import type { Permission, RoleType } from "@/types/permissions";
import { AlertTriangle } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  /**
   * Yêu cầu một trong các quyền này (OR).
   * Chỉ `is_admin` (super admin) mới bỏ qua được kiểm tra này.
   */
  permission?: Permission | Permission[];
  /**
   * Chỉ super admin (`is_admin`) được vào — không mã quyền nào mở được.
   * Dùng cho các route backend gate bằng `verifyAdmin`.
   */
  superAdminOnly?: boolean;
  /**
   * Yêu cầu tất cả các quyền này (AND)
   */
  requireAllPermissions?: Permission[];
  /**
   * Yêu cầu một trong các role (OR)
   */
  role?: RoleType | RoleType[];
  /**
   * Yêu cầu tất cả các role (AND)
   */
  requireAllRoles?: RoleType[];
  /**
   * Component hiển thị khi không có quyền
   */
  fallback?: ReactNode;
  /**
   * Ẩn hoàn toàn thay vì hiển thị fallback
   */
  hidden?: boolean;
  /**
   * Hiển thị cảnh báo khi không có quyền (thay vì ẩn)
   */
  showWarning?: boolean;
  /**
   * Nội dung hiển thị trong lúc đang tải quyền từ server.
   * Mặc định: không render gì — tuyệt đối KHÔNG hiện "không có quyền" khi chưa
   * biết user có quyền gì (tránh nháy cảnh báo rồi mới hiện nội dung).
   */
  loadingFallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  superAdminOnly = false,
  requireAllPermissions,
  role,
  requireAllRoles,
  fallback = null,
  hidden = false,
  showWarning = false,
  loadingFallback = null,
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasAllPermissions,
    hasRole,
    hasAllRoles,
    isSuperAdmin,
    isLoadingPermissions,
  } = usePermission();

  // Chưa biết quyền → chưa kết luận gì. Render loadingFallback thay vì fallback
  // / cảnh báo "không có quyền".
  if (isLoadingPermissions) {
    return <>{loadingFallback}</>;
  }

  // Chuyển đổi single value thành array
  const permissions = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : undefined;

  const roles = role
    ? Array.isArray(role)
      ? role
      : [role]
    : undefined;

  // Kiểm tra quyền
  let hasAccess = true;

  // Chỉ super admin (backend gate `verifyAdmin`)
  if (superAdminOnly) {
    hasAccess = hasAccess && isSuperAdmin;
  }

  // Kiểm tra quyền đơn lẻ (OR)
  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && hasPermission(permissions[0]);
    if (permissions.length > 1) {
      // Nếu có nhiều quyền, kiểm tra OR
      hasAccess = permissions.some((p) => hasPermission(p));
    }
  }

  // Kiểm tra tất cả quyền (AND)
  if (requireAllPermissions && requireAllPermissions.length > 0) {
    hasAccess = hasAccess && hasAllPermissions(requireAllPermissions);
  }

  // Kiểm tra role (OR)
  if (roles && roles.length > 0) {
    hasAccess = hasAccess && roles.some((r) => hasRole(r));
  }

  // Kiểm tra tất cả role (AND)
  if (requireAllRoles && requireAllRoles.length > 0) {
    hasAccess = hasAccess && hasAllRoles(requireAllRoles);
  }

  // Nếu hidden=true, ẩn hoàn toàn
  if (hidden && !hasAccess) {
    return null;
  }

  // Nếu không có quyền
  if (!hasAccess) {
    // Hiển thị cảnh báo
    if (showWarning) {
      return (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Bạn không có quyền thực hiện chức năng này</span>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component hiển thị khi không có quyền
 */
export function AccessDenied({
  message = "Bạn không có quyền truy cập trang này",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
      <p className="text-gray-500 mb-6">{message}</p>
    </div>
  );
}
