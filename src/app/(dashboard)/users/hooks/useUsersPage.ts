import { useCallback, useMemo, useState } from "react";
import { useUsersList, useDeleteUser, mapApiUserToUser } from "@/api/userApi";
import { useUserRolesList } from "@/api/userRolesApi";
import type { User } from "@/types/api-response";
import { toast } from "@/components/ui/Toast";

export const USERS_PAGE_SIZE = 10;

/** State + dữ liệu cho trang danh sách người dùng admin. */
export function useUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useUsersList({
    currentPage,
    pageSize: USERS_PAGE_SIZE,
  });

  // `GET /users` không trả kèm vai trò → lấy bảng gán vai trò rồi map theo
  // user_id để cột "Quyền" hiện tên vai trò thật thay vì cờ is_admin.
  const { data: userRolesData } = useUserRolesList({ pageSize: 100 });

  const roleNamesByUserId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ur of userRolesData?.rows ?? []) {
      const name = (ur.role?.description || ur.role?.role_name || "").trim();
      if (!name) continue;
      const list = map.get(ur.user_id) ?? [];
      if (!list.includes(name)) list.push(name);
      map.set(ur.user_id, list);
    }
    return map;
  }, [userRolesData?.rows]);

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      toast.success("Xóa người dùng thành công");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || "Xóa người dùng thất bại"),
  });

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);
  const handleDeleteClick = useCallback((id: string, name: string) => setDeleteTarget({ id, name }), []);
  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);
  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), []);
  const handleCreateUser = useCallback(() => {
    window.location.href = "/users/new";
  }, []);

  const users: User[] = (data?.rows ?? []).map(mapApiUserToUser);
  const totalItems = data?.count ?? 0;
  const totalPages = Math.ceil(totalItems / USERS_PAGE_SIZE);

  return {
    currentPage,
    users,
    roleNamesByUserId,
    totalItems,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,
    deleteTarget,
    isDeleting: deleteMutation.isPending,
    handlePageChange,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleCreateUser,
  };
}

export type UsersPageController = ReturnType<typeof useUsersPage>;
