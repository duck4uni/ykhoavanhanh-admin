/**
 * usePermission Hook
 * Kiểm tra và quản lý quyền của user
 *
 * NGUỒN QUYỀN: `GET /users/me/permissions` — backend hợp quyền từ mọi vai trò
 * được gán rồi trả về `permission_codes`. FE KHÔNG còn tự suy ra quyền từ các
 * cờ boolean của role (`accountant`/`customer_service`/`marketing`/
 * `receptionist`) hay từ tên vai trò nữa: hai heuristic cũ ("đủ 4 cờ ⇒ admin"
 * và `role_name.includes("admin")`) đã bị xoá vì cấp sai toàn quyền (ví dụ một
 * vai trò tên "Phó admin" trước đây được full admin).
 *
 * CHỈ `is_admin` (super admin) BỎ QUA kiểm tra quyền — khớp đúng backend
 * (`src/middlewares/permissionAuth.ts`). `admin.all` chỉ là MỘT mã quyền
 * thường: nó khớp đúng chính nó, không mở thêm chức năng nào khác.
 */

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useMyPermissions } from "@/api/permissionsApi";
import type { Permission, RoleType } from "@/types/permissions";
import { DEFAULT_ROLE_PERMISSIONS } from "@/types/permissions";

/**
 * Tiền tố `code` của backend (`module`) ↔ RoleType của FE.
 *
 * KHÔNG map `admin` → `"admin"`: module `admin` chỉ là nhóm mã quyền thường, nên
 * một tài khoản có `admin.all` (hay bất kỳ `admin.*`) KHÔNG được coi là quản trị
 * viên và không mở các nhóm menu khai báo `roles: [..., "admin"]`. Chỉ cờ
 * `is_admin` mới là super admin.
 */
const MODULE_TO_ROLE_TYPE: Record<string, RoleType> = {
  accountant: "accountant",
  cskh: "cskh",
  marketing: "marketing",
  receptionist: "receptionist",
};

/**
 * Role types suy từ các cờ boolean của vai trò được gán.
 * Giữ lại để các mục sidebar dùng `roles:` tiếp tục hoạt động — nhưng KHÔNG còn
 * sinh ra `"admin"`: hai heuristic cũ sinh ra nó đã bị xoá.
 *
 * Cấu trúc đã flatten từ authApi (camelCase, không có `.role`):
 * `{ id, roleId, roleName, description, receptionist, membership, marketing,
 *    accountant, customerService }`
 */
function getRoleTypesFromFlags(userRoles: any[]): RoleType[] {
  if (!userRoles || !Array.isArray(userRoles)) return [];

  const roleTypes: RoleType[] = [];

  for (const ur of userRoles) {
    if (ur.accountant === true) roleTypes.push("accountant");
    if (ur.customerService === true) roleTypes.push("cskh");
    if (ur.marketing === true) roleTypes.push("marketing");
    if (ur.receptionist === true) roleTypes.push("receptionist");
  }

  return roleTypes;
}

/** Chỉ còn dùng cho `checkPermission` (non-hook, chưa có call site). */
function getPermissionsFromRoleTypes(roleTypes: RoleType[]): Permission[] {
  const permissions: Permission[] = [];

  for (const roleType of roleTypes) {
    permissions.push(...(DEFAULT_ROLE_PERMISSIONS[roleType] || []));
  }

  return [...new Set(permissions)];
}

/** Role types suy từ module (tiền tố) của các quyền thực tế đang có. */
function getRoleTypesFromPermissions(permissions: Permission[]): RoleType[] {
  const roleTypes: RoleType[] = [];

  for (const code of permissions) {
    const roleType = MODULE_TO_ROLE_TYPE[code.split(".")[0]];
    if (roleType) roleTypes.push(roleType);
  }

  return roleTypes;
}

/**
 * Hook chính để kiểm tra quyền
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, error, refetch } = useMyPermissions();

  // is_admin từ server là nguồn chuẩn; CHỈ trong lúc chờ response mới tạm tin
  // `is_admin` đã lưu ở authStore để super admin không bị "nháy" mất menu.
  // is_admin = true nay CHỈ có nghĩa "super admin duy nhất" — khớp với bypass
  // của backend. Nhân viên nội bộ mới có is_admin = false và bị giới hạn thật
  // bằng quyền của vai trò.
  //
  // Khi request LỖI thì không dùng giá trị đã lưu nữa: nó có thể là `true` đã cũ
  // của tài khoản vừa bị thu hồi quyền admin. Lỗi → UI báo lỗi + cho thử lại
  // (xem AppSidebar), chứ không cấp quyền theo dữ liệu không xác nhận được.
  const isSuperAdmin = isError ? false : (data?.is_admin ?? user?.is_admin) === true;

  const userPermissions = useMemo<Permission[]>(() => {
    return data?.permission_codes ?? [];
  }, [data?.permission_codes]);

  const userRoleTypes = useMemo(() => {
    // Cờ boolean (axis cũ) ∪ module của quyền thật (axis mới). Phần union giúp
    // sidebar không bị lệch khi super admin chỉnh quyền của vai trò qua
    // `PUT /roles/{id}/permissions` mà không sửa các cờ boolean.
    return [
      ...new Set([
        ...getRoleTypesFromFlags(user?.userRoles || []),
        ...getRoleTypesFromPermissions(userPermissions),
      ]),
    ];
  }, [user?.userRoles, userPermissions]);

  /**
   * Kiểm tra user có một quyền cụ thể không
   */
  const hasPermission = (permission: Permission): boolean => {
    // Chỉ is_admin = true (super admin) mới bỏ qua kiểm tra quyền.
    if (isSuperAdmin) return true;
    return userPermissions.includes(permission);
  };

  /**
   * Kiểm tra user có tất cả các quyền được yêu cầu không
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.every((p) => userPermissions.includes(p));
  };

  /**
   * Kiểm tra user có ít nhất một trong các quyền được yêu cầu không
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.some((p) => userPermissions.includes(p));
  };

  /**
   * Kiểm tra user có một role cụ thể không
   * Mọi hàm kiểm tra (quyền và role) đều chỉ short-circuit theo `isSuperAdmin`.
   */
  const hasRole = (roleType: RoleType): boolean => {
    if (isSuperAdmin) return true;
    return userRoleTypes.includes(roleType);
  };

  /**
   * Kiểm tra user có ít nhất một trong các roles được yêu cầu không
   */
  const hasAnyRole = (roleTypes: RoleType[]): boolean => {
    if (isSuperAdmin) return true;
    return roleTypes.some((r) => userRoleTypes.includes(r));
  };

  /**
   * Kiểm tra user có tất cả các roles được yêu cầu không
   */
  const hasAllRoles = (roleTypes: RoleType[]): boolean => {
    if (isSuperAdmin) return true;
    return roleTypes.every((r) => userRoleTypes.includes(r));
  };

  return {
    // Danh sách
    roleTypes: userRoleTypes,
    permissions: userPermissions,
    // Kiểm tra quyền
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    // Kiểm tra role
    hasRole,
    hasAnyRole,
    hasAllRoles,
    // Tiện ích — `isAdmin` nay ĐÚNG BẰNG `isSuperAdmin`: `userRoleTypes` không
    // còn nguồn nào sinh ra `"admin"` (cờ boolean chỉ sinh 4 role nghiệp vụ, và
    // module `admin` đã bị bỏ khỏi MODULE_TO_ROLE_TYPE). Giữ tên cũ cho call site.
    isAdmin: isSuperAdmin,
    isAccountant: userRoleTypes.includes("accountant"),
    isCSKH: userRoleTypes.includes("cskh"),
    isMarketing: userRoleTypes.includes("marketing"),
    isReceptionist: userRoleTypes.includes("receptionist"),
    // Cờ super admin
    isSuperAdmin,
    /**
     * Đang tải quyền từ server. Trong lúc này mọi hàm kiểm tra đều trả false
     * (không cấp quyền lạc quan), nên UI phải render trạng thái loading thay vì
     * "không có quyền" — xem PermissionGuard / AppSidebar.
     */
    isLoadingPermissions: isLoading,
    /** Không lấy được quyền (vd backend chưa deploy endpoint) → UI nên báo lỗi. */
    permissionsError: isError ? (error as Error) : null,
    /** Thử lại `GET /users/me/permissions` — dùng cho nút "Thử lại" khi lỗi. */
    refetchPermissions: refetch,
  };
}

/**
 * Kiểm tra quyền không cần hook (dùng trong non-react context)
 *
 * CHƯA CÓ call site. Vẫn suy quyền ở client từ các cờ boolean nên KHÔNG dùng
 * cho quyết định phân quyền mới — dùng `usePermission()` (nguồn từ server).
 * Hai heuristic sai ("đủ 4 cờ ⇒ admin", `role_name` chứa "admin") đã bị xoá ở
 * đây luôn để không còn chỗ nào cấp sai toàn quyền. `admin.all` cũng không còn
 * là wildcard ở đây — nó chỉ khớp đúng chính nó.
 */
export function checkPermission(
  userRoles: any[] | undefined,
  permission: Permission
): boolean {
  const roleTypes = getRoleTypesFromFlags(userRoles || []);
  const permissions = getPermissionsFromRoleTypes(roleTypes);

  return permissions.includes(permission);
}

/**
 * Kiểm tra role không cần hook
 * CHƯA CÓ call site — xem ghi chú ở `checkPermission`.
 */
export function checkRole(
  userRoles: any[] | undefined,
  roleType: RoleType
): boolean {
  return getRoleTypesFromFlags(userRoles || []).includes(roleType);
}
