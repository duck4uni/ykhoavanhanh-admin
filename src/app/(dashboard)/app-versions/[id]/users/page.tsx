"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { appVersionsHooks } from "@/api/appVersionsApi";
import { Button } from "@/components/ui/Button";
import { LoadingSection } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatDateTime } from "@/lib/utils";
import { PlatformBadge } from "../../_components/AppVersionBadges";
import { APP_VERSION_PAGE_SIZE } from "../../types";

/** Danh sách user/thiết bị đang dùng đúng phiên bản (platform + version_name + version_code). */
export default function AppVersionUsersPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_VERSION_PAGE_SIZE);

  const { data, isLoading, isFetching, isError } = appVersionsHooks.useUsers(id, {
    currentPage: page,
    pageSize,
    sortField: "last_active_at",
    sortOrder: "DESC",
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSection text="Đang tải danh sách người dùng..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <p className="text-sm text-muted-foreground">Không tìm thấy bản cập nhật.</p>
          <Button className="mt-4" onClick={() => router.push("/app-versions")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const version = data.app_version;
  const rows = data.rows ?? [];
  const total = data.count ?? 0;
  const totalPages = data.totalPages ?? (Math.ceil(total / pageSize) || 1);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/app-versions")}
          className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-500 shadow-sm transition-colors hover:bg-surface-secondary"
          title="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Người dùng theo phiên bản</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <PlatformBadge value={version.platform} />
            <span>
              {version.version_name} ({version.version_code})
            </span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Danh sách người dùng / thiết bị</h2>
          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-600">
            {total} bản ghi
          </span>
        </div>

        {isFetching && <LoadingSection text="Đang tải..." />}

        {!isFetching && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">Chưa có người dùng nào dùng phiên bản này</p>
          </div>
        )}

        {!isFetching && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5">STT</th>
                  <th className="px-6 py-3.5">Người dùng</th>
                  <th className="px-6 py-3.5">Liên hệ</th>
                  <th className="px-6 py-3.5">Thiết bị</th>
                  <th className="px-6 py-3.5">Hệ điều hành</th>
                  <th className="px-6 py-3.5">Hoạt động gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={row.id} className="text-sm transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {(page - 1) * pageSize + index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.user?.full_name || "—"}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{row.user?.phone || "—"}</p>
                      {row.user?.email && <p className="mt-0.5 text-xs text-slate-400">{row.user.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.device_model || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{row.os_version || "—"}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.last_active_at ? formatDateTime(row.last_active_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
