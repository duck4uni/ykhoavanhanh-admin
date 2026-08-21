import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StepBadge } from "./StepBadge";
import { formatFee } from "../types";
import type { ScheduleEditorController } from "../hooks/useNewScheduleForm";

/** Khối 2: Phạm vi khám áp dụng (bảng scopes). */
export function ScopeSection({ ctrl }: { ctrl: ScheduleEditorController }) {
  const { scopes, specialtyName, areaName, roomName, serviceName, servicePriceLevelLabel, openAddScope, openEditScope, removeScope } = ctrl;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <StepBadge n={2} /> Phạm vi khám áp dụng
        </h2>
        <button
          type="button"
          onClick={openAddScope}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm phạm vi khám
        </button>
      </div>

      <div className="p-6">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1.2fr_1.2fr_1.4fr_100px_110px_84px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            <span>Chuyên khoa</span>
            <span>Khu vực / phòng</span>
            <span>Dịch vụ khám</span>
            <span className="text-right">Phí khám</span>
            <span>Trạng thái</span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="divide-y divide-slate-100">
            {scopes.map((scope) => (
              <div key={scope.clientId} className="grid grid-cols-[1.2fr_1.2fr_1.4fr_100px_110px_84px] items-center gap-2 px-3 py-2.5 text-sm">
                <span className="truncate text-slate-800">{specialtyName(scope.specialty_id)}</span>
                <span className="truncate text-slate-700">
                  {areaName(scope.area_id)}
                  {roomName(scope.room_id) ? ` · ${roomName(scope.room_id)}` : ""}
                </span>
                <span className="truncate text-slate-700">
                  {serviceName(scope.service_id)}
                  {scope.price_level_code ? ` · ${servicePriceLevelLabel(scope.service_id, scope.price_level_code)}` : ""}
                </span>
                <span className="text-right font-medium text-slate-800">{formatFee(scope.fee)}</span>
                <span>
                  <Badge variant={scope.status === "ACTIVE" ? "success" : "default"}>
                    {scope.status === "ACTIVE" ? "Hoạt động" : "Tạm tắt"}
                  </Badge>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditScope(scope)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-primary-50"
                    aria-label="Sửa phạm vi"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeScope(scope.clientId)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Xóa phạm vi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </div>
            ))}
            {scopes.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Chưa có phạm vi khám. Bấm &quot;Thêm phạm vi khám&quot; để cấu hình.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
