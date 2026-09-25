"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type {
  HisCatalogApplyChangeInput,
  HisCatalogSyncResult,
} from "@/api/hisCatalogApi";

/** Cấu hình 1 cột hiển thị trong bảng diff của modal. */
export interface SyncReviewColumn<T> {
  key: keyof T;
  label: string;
  /** Tuỳ biến cách hiển thị giá trị (mặc định: hiển thị nguyên văn / "—" nếu rỗng). */
  format?: (value: unknown, row: T | Partial<T>) => ReactNode;
}

interface SyncReviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  /** Kết quả trả về từ `POST <endpoint>/sync`. `null` khi chưa có gì để hiển thị. */
  result: HisCatalogSyncResult<T> | null;
  columns: SyncReviewColumn<T>[];
  isApplying?: boolean;
  onApply: (changes: HisCatalogApplyChangeInput<T>[]) => void;
  title?: string;
}

function formatCell<T>(column: SyncReviewColumn<T>, value: unknown, row: T | Partial<T>): ReactNode {
  if (column.format) return column.format(value, row);
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">—</span>;
  }
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

/**
 * Modal dùng chung cho mọi danh mục HIS: hiển thị kết quả `POST .../sync`
 * (bản ghi mới đã tự thêm, bản ghi có thay đổi cần xác nhận, bản ghi không
 * đổi) và cho phép chọn các thay đổi để gọi `POST .../sync-apply`.
 */
export function SyncReviewModal<T>({
  isOpen,
  onClose,
  result,
  columns,
  isApplying,
  onApply,
  title = "Xác nhận thay đổi từ HIS",
}: SyncReviewModalProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (result) {
      setSelectedIds(new Set(result.changes.map((c) => c.id)));
    }
  }, [result]);

  if (!result) return null;

  const { inserted_count, changes, unchanged_count } = result;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.size === changes.length ? new Set() : new Set(changes.map((c) => c.id))
    );
  }

  function handleApply() {
    const selected = changes
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({ id: c.id, incoming: c.incoming }));
    onApply(selected);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isApplying}>
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={selectedIds.size === 0 || isApplying}
            isLoading={isApplying}
            loadingText="Đang áp dụng..."
          >
            Áp dụng ({selectedIds.size}) đã chọn
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {inserted_count > 0 && (
          <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
            {inserted_count} bản ghi mới đã tự thêm
          </span>
        )}
        {changes.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
            {changes.length} thay đổi cần xác nhận
          </span>
        )}
        {unchanged_count > 0 && (
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
            {unchanged_count} không đổi
          </span>
        )}
      </div>

      {changes.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Không có thay đổi nào cần xác nhận.
        </p>
      ) : (
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === changes.length && changes.length > 0}
                    onChange={toggleAll}
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="px-3 py-2">Mã / Tên</th>
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-3 py-2">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {changes.map((change) => {
                const checked = selectedIds.has(change.id);
                return (
                  <tr key={change.id} className={cn(!checked && "opacity-50")}>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(change.id)}
                        aria-label={`Chọn ${change.label ?? change.code ?? change.id}`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top font-medium text-gray-900">
                      {change.label || change.code || change.id}
                      {change.code && change.label && (
                        <div className="text-xs font-normal text-gray-400">{change.code}</div>
                      )}
                    </td>
                    {columns.map((col) => {
                      const changed = change.diff_fields.includes(String(col.key));
                      return (
                        <td key={String(col.key)} className="px-3 py-2 align-top">
                          {changed ? (
                            <div className="space-y-0.5">
                              <div className="text-gray-400 line-through">
                                {formatCell(col, change.current[col.key], change.current)}
                              </div>
                              <div className="font-medium text-primary-700">
                                {formatCell(col, change.incoming[col.key], change.incoming)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600">
                              {formatCell(col, change.incoming[col.key], change.incoming)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
