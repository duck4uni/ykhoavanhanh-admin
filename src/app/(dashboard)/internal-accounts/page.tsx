"use client";

import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/Spinner";
import { useInternalAccounts } from "./hooks/useInternalAccounts";
import { AccountStatsCards } from "./_components/AccountStatsCards";
import { AccountFilters } from "./_components/AccountFilters";
import { AccountTable } from "./_components/AccountTable";
import { DeleteAccountModal } from "./_components/DeleteAccountModal";

export default function InternalAccountsPage() {
  const ctrl = useInternalAccounts();

  if (ctrl.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner text="Đang tải danh sách..." />
      </div>
    );
  }

  if (ctrl.error) {
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
            <p className="mb-4 text-sm text-muted-foreground">{ctrl.error.message}</p>
            <Button variant="outline" onClick={() => ctrl.refetch()}>
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
            onClick={ctrl.handleCreateAccount}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Thêm tài khoản
          </button>
        </div>

        <AccountStatsCards stats={ctrl.stats} />
        <AccountFilters ctrl={ctrl} />
        <AccountTable ctrl={ctrl} />
      </div>

      {ctrl.deleteTarget && (
        <DeleteAccountModal
          name={ctrl.deleteTarget.name}
          isDeleting={ctrl.isDeleting}
          onConfirm={ctrl.handleDeleteConfirm}
          onCancel={ctrl.handleDeleteCancel}
        />
      )}
    </>
  );
}
