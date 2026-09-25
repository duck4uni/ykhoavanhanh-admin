"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Download, RefreshCw, Upload } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import {
  hisServicesHooks,
  type HisServiceSyncFromHisResult,
  type HisServiceSyncRow,
  type HisServiceSyncToHisResultRow,
} from "@/api/hisServicesApi";
import { SyncReviewModal, type SyncReviewColumn } from "../../his-catalogs/_components/SyncReviewModal";

const SYNC_REVIEW_COLUMNS: SyncReviewColumn<HisServiceSyncRow>[] = [
  { key: "service_name", label: "Tên dịch vụ" },
  { key: "price", label: "Giá" },
  { key: "status", label: "Trạng thái" },
];

/**
 * Nút "Đồng bộ" ở header trang danh sách dịch vụ khám — mở dropdown 2 lựa
 * chọn: đồng bộ từ HIS (kéo dữ liệu về theo pattern diff/accept dùng chung
 * với các danh mục HIS khác, xem `his-catalogs/_components/SyncReviewModal`)
 * và đồng bộ lên HIS (đẩy dữ liệu đi, không phá hủy nên không cần xác nhận,
 * nhưng hiện danh sách lỗi nếu có dịch vụ đồng bộ thất bại).
 */
export function HisServiceSyncButton() {
  const [open, setOpen] = useState(false);
  const [reviewResult, setReviewResult] = useState<HisServiceSyncFromHisResult | null>(null);
  const [errorRows, setErrorRows] = useState<HisServiceSyncToHisResultRow[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const syncFromHis = hisServicesHooks.useSyncFromHis({
    onSuccess: (data) => {
      if (data.changes.length > 0) {
        if (data.inserted_count > 0) {
          toast.success(
            `Đã tự thêm ${data.inserted_count} dịch vụ mới. Còn ${data.changes.length} thay đổi cần xác nhận.`
          );
        }
        setReviewResult(data);
      } else if (data.inserted_count > 0 || data.unchanged_count > 0) {
        toast.success(
          `Đồng bộ thành công: ${data.inserted_count} dịch vụ mới, ${data.unchanged_count} không đổi`
        );
      } else {
        toast.success("Không có dữ liệu mới để đồng bộ");
      }
    },
    onError: (err) => toast.error(err.message || "Đồng bộ từ HIS thất bại"),
  });

  const syncApplyFromHis = hisServicesHooks.useSyncApplyFromHis({
    onSuccess: (data) => {
      toast.success(`Đã áp dụng ${data.applied_count} thay đổi`);
      setReviewResult(null);
    },
    onError: (err) => toast.error(err.message || "Áp dụng thay đổi thất bại"),
  });

  const syncToHis = hisServicesHooks.useSyncToHis({
    onSuccess: (data) => {
      if (data.message) {
        data.error > 0 ? toast.error(data.message) : toast.success(data.message);
      } else if (data.total === 0) {
        toast.success("Không có dịch vụ nào cần đồng bộ lên HIS");
      } else {
        toast.success(`Đồng bộ lên HIS: ${data.success}/${data.total} thành công`);
      }
      if (data.error > 0) {
        setErrorRows(data.results.filter((row) => row.status === "error"));
      }
    },
    onError: (err) => toast.error(err.message || "Đồng bộ lên HIS thất bại"),
  });

  const isSyncing = syncFromHis.isPending || syncToHis.isPending;

  function handleSyncFromHisClick() {
    setOpen(false);
    syncFromHis.mutate();
  }

  function handleSyncToHisClick() {
    setOpen(false);
    syncToHis.mutate();
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          Đồng bộ
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={handleSyncFromHisClick}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary"
            >
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <Download className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">Đồng bộ từ HIS</span>
                <span className="block text-xs text-muted-foreground">Lấy dữ liệu dịch vụ khám từ HIS</span>
              </span>
            </button>
            <button
              type="button"
              onClick={handleSyncToHisClick}
              className="flex w-full items-start gap-3 border-t border-slate-100 px-4 py-3 text-left transition-colors hover:bg-surface-secondary"
            >
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-success-light text-success">
                <Upload className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">Đồng bộ lên HIS</span>
                <span className="block text-xs text-muted-foreground">Gửi dữ liệu dịch vụ khám lên HIS</span>
              </span>
            </button>
          </div>
        )}
      </div>

      <SyncReviewModal<HisServiceSyncRow>
        isOpen={!!reviewResult}
        onClose={() => setReviewResult(null)}
        result={reviewResult}
        columns={SYNC_REVIEW_COLUMNS}
        isApplying={syncApplyFromHis.isPending}
        onApply={(changes) => syncApplyFromHis.mutate(changes)}
        title="Xác nhận thay đổi dịch vụ khám từ HIS"
      />

      {errorRows && errorRows.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setErrorRows(null)} />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <AlertCircle className="h-5 w-5 text-error" /> Lỗi đồng bộ lên HIS ({errorRows.length})
              </h2>
              <button onClick={() => setErrorRows(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="divide-y divide-slate-100">
              {errorRows.map((row, idx) => (
                <div key={`${row.service_id}-${idx}`} className="px-6 py-3">
                  <p className="text-sm font-medium text-slate-800">{row.service_name || row.service_id}</p>
                  <p className="mt-0.5 text-xs text-error">{row.error || "Lỗi không xác định"}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setErrorRows(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
