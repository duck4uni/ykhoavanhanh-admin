"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { notificationsHooks, type NotificationCategory } from "@/api/notificationsApi";
import type { Notification } from "@/api/notificationsApi";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import {
  Bell,
  BellDot,
  CheckCheck,
  Search,
  X,
  MailOpen,
  Mail,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useDeleteConfirmation } from "@/components/ui/useDeleteConfirmation";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";

const PAGE_SIZE = 10;

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  APPOINTMENT: "Lịch hẹn",
  SYSTEM: "Hệ thống",
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  APPOINTMENT: "bg-blue-50 text-blue-600",
  SYSTEM: "bg-slate-100 text-slate-600",
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"ALL" | NotificationCategory>("ALL");
  const [filterRead, setFilterRead] = useState<"ALL" | "READ" | "UNREAD">("ALL");

  const params = useMemo(() => {
    const p: Record<string, unknown> = { currentPage: page, pageSize: PAGE_SIZE };
    if (filterCategory !== "ALL") p.filters = JSON.stringify({ category: filterCategory });
    return p;
  }, [page, filterCategory]);

  const { data, isFetching } = notificationsHooks.useList(params);
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const unreadCount = rows.filter((r) => !r.has_user_read).length;

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      );
    }
    if (filterRead === "READ") result = result.filter((r) => r.has_user_read);
    if (filterRead === "UNREAD") result = result.filter((r) => !r.has_user_read);
    return result;
  }, [rows, search, filterRead]);

  const markAllMutation = notificationsHooks.useMarkAsReadAll({
    onSuccess: () => {
      // toast nếu có toast hook
    },
  });
  const markOneMutation = notificationsHooks.useMarkAsReadById();
  const deleteMutation = notificationsHooks.useDelete();

  const activeFilterCount =
    (filterCategory !== "ALL" ? 1 : 0) + (filterRead !== "ALL" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách thông báo gửi đến người dùng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => markAllMutation.mutate(undefined)}
            disabled={markAllMutation.isPending || unreadCount === 0}
          >
            {markAllMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
          <Link href="/notifications/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Tạo thông báo
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Tổng thông báo</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BellDot className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-xs text-gray-500">Chưa đọc</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rows.length - unreadCount}</p>
              <p className="text-xs text-gray-500">Đã đọc</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm tiêu đề, nội dung..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value as "ALL" | NotificationCategory); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="APPOINTMENT">Lịch hẹn</option>
              <option value="SYSTEM">Hệ thống</option>
            </select>
            <select
              value={filterRead}
              onChange={(e) => { setFilterRead(e.target.value as "ALL" | "READ" | "UNREAD"); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="UNREAD">Chưa đọc</option>
              <option value="READ">Đã đọc</option>
            </select>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterCategory("ALL"); setFilterRead("ALL"); setPage(1); }}
                className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Xóa bộ lọc ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {isFetching && <LoadingSection />}

        {!isFetching && filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">Không có thông báo nào</p>
            <p className="text-xs text-slate-400">Thông báo sẽ hiển thị tại đây khi có dữ liệu</p>
          </div>
        )}

        {!isFetching && filteredRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Tiêu đề</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Loại</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Thời gian gửi</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Trạng thái</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((notif) => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif}
                    markOneMutation={markOneMutation}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Hiển thị {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} trong {total} thông báo
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="contents">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-slate-400 text-sm">…</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-colors",
                        p === page
                          ? "bg-primary text-white shadow-sm"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NotificationRow sub-component ─────────────────────────────────────────────

function NotificationRow({
  notif,
  markOneMutation,
  onDelete,
}: {
  notif: Notification;
  markOneMutation: ReturnType<typeof notificationsHooks.useMarkAsReadById>;
  onDelete: (id: string) => void;
}) {
  const { open, ConfirmDialog } = useDeleteConfirmation({
    title: "Xác nhận xóa",
    description: "Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.",
    onConfirm: () => onDelete(notif.id),
  });

  const handleRowClick = () => {
    if (!notif.has_user_read) {
      markOneMutation.mutate(notif.id);
    }
  };

  return (
    <>
      <tr
        className={cn(
          "hover:bg-slate-50/60 transition-colors group cursor-pointer",
          !notif.has_user_read && "bg-sky-50/30"
        )}
        onClick={handleRowClick}
      >
        <td className="px-6 py-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 w-2 h-2 rounded-full flex-shrink-0",
              notif.has_user_read ? "bg-slate-200" : "bg-primary"
            )} />
            <div className="min-w-0">
              <p className={cn("text-sm truncate max-w-xs", notif.has_user_read ? "text-slate-600" : "font-medium text-slate-800")}>
                {notif.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{notif.content}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium", CATEGORY_COLORS[notif.category])}>
            {CATEGORY_LABELS[notif.category]}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-slate-500">
          {notif.sent_time ? formatDateTime(notif.sent_time) : "—"}
        </td>
        <td className="px-6 py-4 text-center">
          {notif.has_user_read ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <MailOpen className="w-3.5 h-3.5" />
              Đã đọc
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              <Mail className="w-3.5 h-3.5" />
              Chưa đọc
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity justify-end">
            {!notif.has_user_read && (
              <button
                onClick={(e) => { e.stopPropagation(); markOneMutation.mutate(notif.id); }}
                disabled={markOneMutation.isPending && markOneMutation.variables === notif.id}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary-50 transition-colors"
                title="Đánh dấu đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <Link
              href={`/notifications/${notif.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary-50 transition-colors"
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); open(); }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {ConfirmDialog}
        </td>
      </tr>
    </>
  );
}
