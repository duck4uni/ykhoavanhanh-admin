"use client";

import { LoadingSpinner } from "@/components/ui/Spinner";
import { useUsersPage } from "./hooks/useUsersPage";
import { UsersTable } from "./_components/UsersTable";
import { DeleteConfirmation } from "./_components/DeleteConfirmation";
import { ErrorState } from "./_components/StateViews";

export default function UsersPage() {
  const ctrl = useUsersPage();

  if (ctrl.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Đang tải danh sách người dùng..." />
      </div>
    );
  }

  if (ctrl.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Người dùng admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý tài khoản nội bộ</p>
          </div>
        </div>
        <ErrorState error={ctrl.error} onRetry={ctrl.refetch} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Người dùng admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý tài khoản nội bộ
              {ctrl.totalItems > 0 && ` • ${ctrl.totalItems} người dùng`}
            </p>
          </div>
        </div>

        <UsersTable ctrl={ctrl} />
      </div>

      {ctrl.deleteTarget && (
        <DeleteConfirmation
          userName={ctrl.deleteTarget.name}
          onConfirm={ctrl.handleDeleteConfirm}
          onCancel={ctrl.handleDeleteCancel}
          isDeleting={ctrl.isDeleting}
        />
      )}
    </>
  );
}
