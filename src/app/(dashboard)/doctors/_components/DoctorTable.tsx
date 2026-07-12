import { Pencil, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { DoctorAvatar } from "./DoctorAvatar";
import { DOCTORS_PAGE_SIZE, formatUpdatedAt, getClinicName, getDoctorStatus, getScheduleCount } from "../list-helpers";
import type { DoctorListController } from "../hooks/useDoctorList";

/** Bảng bác sĩ + phân trang. */
export function DoctorTable({ ctrl }: { ctrl: DoctorListController }) {
  const { isLoading, filtered, page, setPage, totalPages, totalCount, getDoctorSpecialtyName, router, openConfirmDelete } = ctrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải danh sách bác sĩ..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">STT</th>
                  <th className="px-5 py-3.5">Ảnh</th>
                  <th className="px-5 py-3.5">Mã BS</th>
                  <th className="px-5 py-3.5">Bác sĩ</th>
                  <th className="px-5 py-3.5">Chuyên khoa</th>
                  <th className="px-5 py-3.5">Phòng khám</th>
                  <th className="px-5 py-3.5">Số lịch</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Cập nhật lúc</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy bác sĩ phù hợp.</td></tr>
                ) : (
                  filtered.map((doctor, index) => {
                    const status = getDoctorStatus(doctor);
                    return (
                      <tr key={doctor.id} className="text-sm transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(page - 1) * DOCTORS_PAGE_SIZE + index + 1}</span></td>
                        <td className="px-5 py-4"><DoctorAvatar doctor={doctor} /></td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{doctor.doctorid}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{doctor.doctorname}</td>
                        <td className="px-5 py-4 text-slate-700">{getDoctorSpecialtyName(doctor)}</td>
                        <td className="px-5 py-4 text-slate-700">{getClinicName(doctor)}</td>
                        <td className="px-5 py-4 font-semibold text-primary-600">{getScheduleCount(doctor)}</td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status.label}</span></td>
                        <td className="px-5 py-4 text-slate-600">{formatUpdatedAt(doctor.updatetime)}</td>
                        <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => router.push(`/doctors/${doctor.id}/edit`)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-primary transition-colors hover:bg-primary-50" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => openConfirmDelete(doctor.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition-colors hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button></div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalCount} pageSize={DOCTORS_PAGE_SIZE} />
          </div>
        </>
      )}
    </div>
  );
}
