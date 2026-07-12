import { useCallback, useState } from "react";
import { useUsersList, useDeleteUser, mapApiUserToUser } from "@/api/userApi";
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
