"use client";

import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type {
  HisCatalogApplyChangeInput,
  HisCatalogApplyResult,
  HisCatalogSyncResult,
} from "@/api/hisCatalogApi";
import { SyncReviewModal, type SyncReviewColumn } from "./SyncReviewModal";

/** Hình dạng `hooks.useSync`/`useSyncApply` mà `createHisCatalogApi` trả về cho 1 danh mục. */
export interface CatalogSyncHooks<T, TSyncParams> {
  useSync: () => UseMutationResult<HisCatalogSyncResult<T>, Error, TSyncParams | void>;
  useSyncApply: () => UseMutationResult<
    HisCatalogApplyResult<T>,
    Error,
    HisCatalogApplyChangeInput<T>[]
  >;
}

interface CatalogSyncButtonProps<T, TSyncParams extends Record<string, unknown>> {
  hooks: CatalogSyncHooks<T, TSyncParams>;
  /** Query params gửi kèm `POST <endpoint>/sync` (vd `{idbv, city}`). */
  syncParams?: TSyncParams;
  columns: SyncReviewColumn<T>[];
  disabled?: boolean;
  /** Hiện qua `title` khi hover nút lúc `disabled` (vd "Chọn tỉnh/thành trước"). */
  disabledReason?: string;
  modalTitle?: string;
  label?: string;
}

/**
 * Nút "Đồng bộ từ HIS" dùng chung cho mọi danh mục theo pattern diff/accept:
 * bấm → `POST .../sync` (bản ghi mới tự thêm ngay, báo toast) → nếu có
 * `changes` cần xác nhận thì mở `SyncReviewModal` → chọn dòng → `POST
 * .../sync-apply`.
 */
export function CatalogSyncButton<T, TSyncParams extends Record<string, unknown> = Record<string, never>>({
  hooks,
  syncParams,
  columns,
  disabled,
  disabledReason,
  modalTitle = "Xác nhận thay đổi từ HIS",
  label = "Đồng bộ từ HIS",
}: CatalogSyncButtonProps<T, TSyncParams>) {
  const [reviewResult, setReviewResult] = useState<HisCatalogSyncResult<T> | null>(null);

  const sync = hooks.useSync();
  const syncApply = hooks.useSyncApply();

  function handleSyncClick() {
    sync.mutate(syncParams as TSyncParams | void, {
      onSuccess: (data) => {
        if (data.changes.length > 0) {
          if (data.inserted_count > 0) {
            toast.success(
              `Đã tự thêm ${data.inserted_count} bản ghi mới. Còn ${data.changes.length} thay đổi cần xác nhận.`
            );
          }
          setReviewResult(data);
        } else if (data.inserted_count > 0 || data.unchanged_count > 0) {
          toast.success(
            `Đồng bộ thành công: ${data.inserted_count} bản ghi mới, ${data.unchanged_count} không đổi`
          );
        } else {
          toast.success("Không có dữ liệu mới để đồng bộ");
        }
      },
      onError: (err) => toast.error(err.message || "Đồng bộ từ HIS thất bại"),
    });
  }

  function handleApply(changes: HisCatalogApplyChangeInput<T>[]) {
    syncApply.mutate(changes, {
      onSuccess: (data) => {
        toast.success(`Đã áp dụng ${data.applied_count} thay đổi`);
        setReviewResult(null);
      },
      onError: (err) => toast.error(err.message || "Áp dụng thay đổi thất bại"),
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleSyncClick}
        disabled={disabled || sync.isPending}
        isLoading={sync.isPending}
        loadingText="Đang đồng bộ..."
        title={disabled ? disabledReason : undefined}
      >
        <RefreshCw className="h-4 w-4" />
        {label}
      </Button>

      <SyncReviewModal<T>
        isOpen={!!reviewResult}
        onClose={() => setReviewResult(null)}
        result={reviewResult}
        columns={columns}
        isApplying={syncApply.isPending}
        onApply={handleApply}
        title={modalTitle}
      />
    </>
  );
}
