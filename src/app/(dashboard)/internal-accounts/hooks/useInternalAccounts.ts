import { useCallback, useMemo, useState } from "react";
import { useUsersList, useDeleteUser } from "@/api/userApi";
import { useUserRolesList } from "@/api/userRolesApi";
import type { User } from "@/types/api-response";
import { toast } from "@/components/ui/Toast";
import { INTERNAL_ACCOUNTS_PAGE_SIZE } from "../helpers";

/** State + dữ liệu cho trang danh sách tài khoản nội bộ. */
export function useInternalAccounts() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useUsersList({
    currentPage,
    pageSize: INTERNAL_ACCOUNTS_PAGE_SIZE,
  });
  const { data: userRolesData } = useUserRolesList({ pageSize: 1000 });

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      toast.success("Xóa tài khoản thành công!");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || "Xóa tài khoản thất bại"),
  });

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);
  const handleDeleteClick = useCallback((id: string, name: string) => setDeleteTarget({ id, name }), []);
  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);
  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), []);
  const handleCreateAccount = useCallback(() => {
    window.location.href = "/internal-accounts/new";
  }, []);

  const userRolesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (userRolesData?.rows) {
      userRolesData.rows.forEach((ur) => {
        const existing = map.get(ur.user_id) || [];
        existing.push(ur.role.description || ur.role.role_name);
        map.set(ur.user_id, existing);
      });
    }
    return map;
  }, [userRolesData]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    userRolesMap.forEach((values) => values.forEach((role) => roles.add(role)));
    return Array.from(roles).sort();
  }, [userRolesMap]);

  const users: User[] = (data?.rows ?? []).map((u) => ({
    id: u.id,
    full_name: u.full_name ?? undefined,
    phone: u.phone ?? undefined,
    email: u.email ?? undefined,
    avatar: u.avatar ?? undefined,
    is_active: u.is_active ?? false,
    is_admin: u.is_admin ?? false,
    createdAt: u.created_at ?? undefined,
    updatedAt: u.updated_at ?? undefined,
  }));

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const roles = userRolesMap.get(user.id) ?? [];
      const matchSearch =
        !q ||
        (user.full_name ?? "").toLowerCase().includes(q) ||
        (user.email ?? "").toLowerCase().includes(q) ||
        (user.phone ?? "").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || roles.includes(roleFilter);
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? user.is_active : !user.is_active);
      const matchDate = !dateFilter || (user.createdAt ? user.createdAt.startsWith(dateFilter) : false);
      return matchSearch && matchRole && matchStatus && matchDate;
    });
  }, [users, search, roleFilter, statusFilter, dateFilter, userRolesMap]);

  const totalItems = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / INTERNAL_ACCOUNTS_PAGE_SIZE));

  const activeCount = users.filter((user) => user.is_active).length;
  const lockedCount = users.filter((user) => !user.is_active).length;
  const noRoleCount = users.filter((user) => !(userRolesMap.get(user.id)?.length)).length;
  const recentCount = users.filter((user) => {
    if (!user.createdAt) return false;
    const created = new Date(user.createdAt).getTime();
    if (Number.isNaN(created)) return false;
    return Date.now() - created <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  function resetFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  }

  return {
    // paging + query state
    currentPage,
    setCurrentPage,
    isLoading,
    isFetching,
    error,
    refetch,
    // filters
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    roleOptions,
    resetFilters,
    // data
    filteredUsers,
    userRolesMap,
    totalItems,
    totalPages,
    handlePageChange,
    // stats
    stats: { totalItems, activeCount, lockedCount, noRoleCount, recentCount },
    // delete
    deleteTarget,
    isDeleting: deleteMutation.isPending,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleCreateAccount,
  };
}

export type InternalAccountsController = ReturnType<typeof useInternalAccounts>;
