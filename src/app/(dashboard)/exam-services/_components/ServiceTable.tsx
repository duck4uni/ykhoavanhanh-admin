import { Eye, Pencil, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime, getExtraPriceLevels, getSpecialtyName } from "../list-helpers";
import type { ExamServiceListController } from "../hooks/useExamServiceList";

/** Bảng dịch vụ khám + phân trang. */
export function ServiceTable({ ctrl }: { ctrl: ExamServiceListController }) {
  const { isLoading, filteredServices, currentPage, setCurrentPage, pageSize, setPageSize, total, totalPages, openEdit, openConfirmDelete, toggleServiceStatus, togglingId } = ctrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải dịch vụ khám..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">STT</th>
                  <th className="px-5 py-3.5">Mã dịch vụ</th>
                  <th className="px-5 py-3.5">Tên dịch vụ</th>
                  <th className="px-5 py-3.5">Chuyên khoa</th>
                  <th className="px-5 py-3.5">Loại DV</th>
                  <th className="px-5 py-3.5">Giá</th>
                  <th className="px-5 py-3.5">Loại BH</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Cập nhật lúc</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy dịch vụ phù hợp.</td></tr>
                ) : filteredServices.map((service, index) => (
                  <tr key={service.id} className="text-sm transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-primary-600">{service.serviceid}</td>
                    <td className="max-w-sm px-5 py-4 font-semibold text-slate-800">{service.servicename}</td>
                    <td className="px-5 py-4 text-slate-700">{getSpecialtyName(service)}</td>
                    <td className="px-5 py-4 text-slate-700">{service.servicetype}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{formatCurrency(Number(service.price) || 0)}</div>
                      {getExtraPriceLevels(service).length > 0 && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {getExtraPriceLevels(service).map((level) => `${level.label}: ${formatCurrency(level.price)}`).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{service.insurancetype && service.insurancetype !== "—" ? service.insurancetype : "—"}</td>
                    <td className="px-5 py-4"><StatusSwitch checked={service.status === "ACTIVE"} loading={togglingId === service.id} onChange={() => toggleServiceStatus(service)} /></td>
                    <td className="px-5 py-4 text-slate-600">{formatDateTime(service.updatetime || service.updated_at || "")}</td>
                    <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(service)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Xem"><Eye className="h-4 w-4" /></button><button onClick={() => openEdit(service)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-primary hover:bg-primary-50" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => openConfirmDelete(service.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={total} pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        </>
      )}
    </div>
  );
}
