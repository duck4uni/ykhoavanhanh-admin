"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useAppVersionList } from "./hooks/useAppVersionList";
import { AppVersionFilters } from "./_components/AppVersionFilters";
import { AppVersionTable } from "./_components/AppVersionTable";

export default function AppVersionsPage() {
  const router = useRouter();
  const list = useAppVersionList();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý bản cập nhật</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấu hình phiên bản ứng dụng di động theo nền tảng, chính sách cập nhật (tùy chọn/bắt buộc) và nội dung nhắc cập nhật.
          </p>
        </div>
        <button
          onClick={() => router.push("/app-versions/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm bản cập nhật
        </button>
      </div>

      <AppVersionFilters
        search={list.search}
        onSearchChange={list.setSearch}
        platform={list.platformFilter}
        onPlatformChange={list.setPlatformFilter}
        status={list.statusFilter}
        onStatusChange={list.setStatusFilter}
        enabled={list.enabledFilter}
        onEnabledChange={list.setEnabledFilter}
        onReset={list.resetFilters}
      />

      <AppVersionTable
        rows={list.rows}
        isFetching={list.isFetching}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        total={list.total}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        onViewUsers={(item) => router.push(`/app-versions/${item.id}/users`)}
        onEdit={(item) => router.push(`/app-versions/${item.id}/edit`)}
        onDelete={list.openConfirmDelete}
        onToggleEnabled={list.toggleEnabled}
        isDeleting={list.isDeleting}
        isToggling={list.isToggling}
      />

      <ConfirmDialog
        open={list.confirmOpen}
        onOpenChange={list.setConfirmOpen}
        variant="delete"
        title="Xóa bản cập nhật"
        description="Bạn có chắc muốn xóa bản cập nhật này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={list.isDeleting}
        onConfirm={list.handleConfirmDelete}
      />
    </div>
  );
}
