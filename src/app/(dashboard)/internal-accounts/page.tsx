"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TablePagination } from "@/components/ui/TablePagination";
import { Spinner, LoadingSpinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useUsersList, useDeleteUser } from "@/api/userApi";
import { useUserRolesList } from "@/api/userRolesApi";
import type { User } from "@/types/api-response";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Pencil,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Lock,
  UserRound,
  Mail,
  CalendarDays,
} from "lucide-react";

const PAGE_SIZE = 10;

function getRoleTone(role: string): string {
  const lower = role.toLowerCase();
  if (lower.includes("tiếp") || lower.includes("reception")) return "bg-primary-100 text-primary-600";
  if (lower.includes("admin")) return "bg-purple-100 text-purple-600";
  if (lower.includes("kế") || lower.includes("account")) return "bg-warning-light text-warning";
  if (lower.includes("cskh") || lower.includes("customer")) return "bg-success-light text-success";
  return "bg-slate-100 text-slate-600";
}

function getInitials(name?: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1]?.[0] ?? "?";
  const prev = parts.length > 1 ? parts[parts.length - 2]?.[0] ?? "" : "";
  return `${prev}${last}`.toUpperCase();
}

export default function InternalAccountsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const params = { currentPage, pageSize: PAGE_SIZE };

  const { data, isLoading, isFetching, error, refetch } = useUsersList(params);
  const { data: userRolesData } = useUserRolesList({ pageSize: 1000 });

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      toast.success("Xóa tài khoản thành công!");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || "Xóa tài khoản thất bại");
    },
  });

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }, [deleteTarget, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

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

  const apiUsers = data?.rows ?? [];
  const users: User[] = apiUsers.map((u) => ({
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
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const activeCount = users.filter((user) => user.is_active).length;
  const lockedCount = users.filter((user) => !user.is_active).length;
  const noRoleCount = users.filter((user) => !(userRolesMap.get(user.id)?.length)).length;
  const recentCount = users.filter((user) => {
    if (!user.createdAt) return false;
    const created = new Date(user.createdAt).getTime();
    if (Number.isNaN(created)) return false;
    return Date.now() - created <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const stats = [
    { label: "Tổng tài khoản", value: totalItems, sub: "Tất cả tài khoản trong hệ thống", icon: Users, tone: "bg-primary-100 text-primary-600" },
    { label: "Hoạt động", value: activeCount, sub: "Tài khoản đang sử dụng", icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Tạm khóa", value: lockedCount, sub: "Tài khoản bị tạm khóa", icon: Lock, tone: "bg-warning-light text-warning" },
    { label: "Chưa có vai trò", value: noRoleCount, sub: "Cần phân quyền", icon: UserRound, tone: "bg-purple-100 text-purple-600" },
    { label: "Mới trong 30 ngày", value: recentCount, sub: "Tài khoản mới tạo", icon: Mail, tone: "bg-primary-100 text-primary-600" },
  ];

  function resetFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner text="Đang tải danh sách..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tài khoản nội bộ</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý tài khoản nhân viên</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Đã xảy ra lỗi</h3>
            <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw data-icon="inline-start" className="size-4" />
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tài khoản nội bộ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý tài khoản nhân viên và vai trò trong hệ thống
            </p>
          </div>
          <button
            onClick={handleCreateAccount}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Thêm tài khoản
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] xl:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên, email, SĐT..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Vai trò</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
                <option value="all">Tất cả vai trò</option>
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Tạm khóa</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Ngày tạo</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
              </div>
            </div>

            <button onClick={() => setCurrentPage(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
              <Filter className="h-4 w-4" /> Lọc
            </button>
            <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
              <RefreshCw className="h-4 w-4" /> Đặt lại
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          {isFetching && !isLoading && <div className="absolute right-4 top-4"><Spinner size="sm" /></div>}
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Chưa có tài khoản</h3>
              <p className="mb-4 text-sm text-muted-foreground">Bắt đầu bằng cách thêm tài khoản nhân viên đầu tiên.</p>
              <Button variant="primary" onClick={handleCreateAccount}>
                <Plus data-icon="inline-start" className="size-4" /> Thêm tài khoản
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3.5">STT</th>
                      <th className="px-5 py-3.5">Nhân viên</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Điện thoại</th>
                      <th className="px-5 py-3.5">Vai trò</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5">Ngày tạo</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user, index) => {
                      const roles = userRolesMap.get(user.id) ?? [];
                      return (
                        <tr key={user.id} className="text-sm transition-colors hover:bg-slate-50/60">
                          <td className="px-5 py-4"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(currentPage - 1) * PAGE_SIZE + index + 1}</span></td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={user.avatar} name={getInitials(user.full_name)} size="sm" />
                              <span className="font-semibold text-slate-800">{user.full_name || "-"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{user.email || "-"}</td>
                          <td className="px-5 py-4 text-slate-600">{user.phone || "-"}</td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {roles.length ? roles.map((role) => <span key={role} className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleTone(role)}`}>{role}</span>) : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Chưa có vai trò</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{user.is_active ? "Hoạt động" : "Tạm khóa"}</span></td>
                          <td className="px-5 py-4 text-slate-600">{user.createdAt ? formatDate(user.createdAt) : "-"}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/internal-accounts/${user.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary" title="Xem chi tiết"><Eye className="h-4 w-4" /></Link>
                              <Link href={`/internal-accounts/${user.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></Link>
                              <button onClick={() => handleDeleteClick(user.id, user.full_name ?? "Tài khoản")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 px-5 py-4">
                <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} totalItems={totalItems} pageSize={PAGE_SIZE} />
              </div>
            </>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Xác nhận xóa</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteTarget.name}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>Hủy</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} isLoading={deleteMutation.isPending}>{deleteMutation.isPending ? "Đang xóa..." : "Xóa"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
