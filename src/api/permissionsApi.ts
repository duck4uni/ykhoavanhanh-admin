/**
 * Permissions API - Permission Catalog & Role/User Permissions (RBAC)
 * Base path: /api/v1.0/permissions, /api/v1.0/roles/{id}/permissions,
 *            /api/v1.0/users/me/permissions
 *
 * `/permissions` và `/roles/{id}/permissions` chỉ dành cho super admin (BE gate
 * `is_admin`), còn `/users/me/permissions` chỉ cần token hợp lệ.
 */

import type { Permission } from "@/types/permissions";
import { apiGet, apiPut } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleKeys } from "./rolesApi";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ApiPermission {
  id: string;
  code: Permission;
  name: string;
  /** Tiền tố của `code` — admin | accountant | cskh | marketing | receptionist | user */
  module: string;
}

export interface RolePermissions {
  role_id: string;
  permission_codes: Permission[];
}

export interface MyPermissions {
  is_active: boolean;
  /** `true` = super admin duy nhất của hệ thống (bỏ qua mọi kiểm tra quyền). */
  is_admin: boolean;
  permission_codes: Permission[];
}

export interface UpdateRolePermissionsPayload {
  permission_codes: Permission[];
}

// ─── Query Keys ────────────────────────────────────────────────────────────────

const permissionsBase = ["permissions"] as const;

export const permissionKeys = {
  all: permissionsBase,
  catalog: () => [...permissionsBase, "catalog"] as const,
  byRole: (roleId: string) => [...permissionsBase, "byRole", roleId] as const,
  mine: () => [...permissionsBase, "mine"] as const,
};

// ─── Service Functions ─────────────────────────────────────────────────────

async function fetchPermissionsCatalog(): Promise<ApiPermission[]> {
  const res = await apiGet<ApiPermission[]>("/permissions");
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy danh mục quyền");
}

async function fetchRolePermissions(roleId: string): Promise<RolePermissions> {
  const res = await apiGet<RolePermissions>(`/roles/${roleId}/permissions`);
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy quyền của vai trò");
}

async function updateRolePermissions(
  roleId: string,
  payload: UpdateRolePermissionsPayload
): Promise<RolePermissions> {
  const res = await apiPut<RolePermissions>(`/roles/${roleId}/permissions`, payload);
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Cập nhật quyền của vai trò thất bại");
}

async function fetchMyPermissions(): Promise<MyPermissions> {
  const res = await apiGet<MyPermissions>("/users/me/permissions");
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy quyền của tài khoản");
}

// ─── Hooks ─────────────────────────────────────────────────────────────

/** Danh mục quyền — gần như tĩnh (seed cố định), cache lâu. */
export function usePermissionsList() {
  return useQuery({
    queryKey: permissionKeys.catalog(),
    queryFn: fetchPermissionsCatalog,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });
}

export function useRolePermissions(roleId: string | null | undefined) {
  return useQuery({
    queryKey: permissionKeys.byRole(roleId ?? ""),
    queryFn: () => fetchRolePermissions(roleId!),
    enabled: Boolean(roleId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateRolePermissions(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: string;
      payload: UpdateRolePermissionsPayload;
    }) => updateRolePermissions(roleId, payload),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.byRole(roleId) });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error),
  });
}

/**
 * Quyền hiệu lực của chính tài khoản đang đăng nhập — nguồn duy nhất cho `usePermission`.
 * Chỉ gọi khi đã đăng nhập để không bắn 401 ở trang login/forgot-password.
 */
export function useMyPermissions() {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  return useQuery({
    queryKey: permissionKeys.mine(),
    queryFn: fetchMyPermissions,
    enabled: isSignedIn,
    staleTime: 1000 * 60 * 5,
  });
}
