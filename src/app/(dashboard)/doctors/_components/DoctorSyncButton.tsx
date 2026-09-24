"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Download, RefreshCw, Upload } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { doctorsHooks, type DoctorSyncToHisResultRow } from "@/api/doctorsApi";

/**
 * Nút "Đồng bộ" ở header trang danh sách bác sĩ — mở dropdown 2 lựa chọn:
 * đồng bộ từ HIS (kéo dữ liệu về, có xác nhận vì có thể ghi đè chỉnh sửa thủ
 * công) và đồng bộ lên HIS (đẩy dữ liệu đi, không phá hủy nên không cần xác
 * nhận, nhưng hiện danh sách lỗi nếu có bác sĩ đồng bộ thất bại).
 */
export function DoctorSyncButton() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorRows, setErrorRows] = useState<DoctorSyncToHisResultRow[] | null>(null);
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

  const syncFromHis = doctorsHooks.useSyncFromHis({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message || "Đồng bộ từ HIS thất bại"),
  });

  const syncToHis = doctorsHooks.useSyncToHis({
    onSuccess: (data) => {
      if (data.message) {
        data.error > 0 ? toast.error(data.message) : toast.success(data.message);
      } else if (data.total === 0) {
        toast.success("Không có bác sĩ nào cần đồng bộ lên HIS");
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
    setConfirmOpen(true);
  }

  function handleConfirmSyncFromHis() {
    setConfirmOpen(false);
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
                <span className="block text-xs text-muted-foreground">Lấy dữ liệu bác sĩ từ HIS</span>
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
                <span className="block text-xs text-muted-foreground">Gửi dữ liệu bác sĩ lên HIS</span>
              </span>
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="warning"
        title="Đồng bộ dữ liệu từ HIS"
        description="Dữ liệu bác sĩ sẽ được lấy lại từ HIS và có thể ghi đè các chỉnh sửa thủ công trước đó. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Đồng bộ"
        isLoading={syncFromHis.isPending}
        onConfirm={handleConfirmSyncFromHis}
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
                <div key={`${row.doctor_id}-${idx}`} className="px-6 py-3">
                  <p className="text-sm font-medium text-slate-800">{row.doctor_name || row.doctor_id}</p>
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
