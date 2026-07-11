import { Pencil } from "lucide-react";
import type { ExamArea } from "@/api/examAreasApi";
import { StatusBadge } from "./StatusBadge";

interface ExamAreaDetailModalProps {
  area: ExamArea | null;
  onClose: () => void;
  onEdit: (area: ExamArea) => void;
}

export function ExamAreaDetailModal({ area, onClose, onEdit }: ExamAreaDetailModalProps) {
  if (!area) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Chi tiết khu vực khám</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-primary-600">{area.code}</span>
            <StatusBadge status={area.status} />
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Tên khu vực</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">{area.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Tên viết tắt</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{area.short_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Số điện thoại</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{area.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Chi nhánh</dt>
              <dd className="mt-0.5 text-sm text-slate-700">Bệnh viện Vạn Hạnh</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Địa chỉ</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{area.address || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Mô tả</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{area.description || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={() => onEdit(area)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" /> Chỉnh sửa
          </button>
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
