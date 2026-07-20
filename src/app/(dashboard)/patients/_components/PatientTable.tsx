import Link from "next/link";
import { FiEye, FiChevronDown, FiGrid, FiDownload } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import { getBirthday, getFullName, getGender, getSource, getSyncStatus } from "../helpers";
import type { PatientListController } from "../hooks/usePatientList";

/** Bảng danh sách bệnh nhân + phân trang. */
export function PatientTable({ ctrl }: { ctrl: PatientListController }) {
  const { isLoading, filtered, total, totalPages, currentPage, setPage, pageSize, setPageSize } = ctrl;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Danh sách bệnh nhân</h2>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface-secondary" aria-label="Bố cục">
            <FiGrid className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface-secondary" aria-label="Tải xuống">
            <FiDownload className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSection text="Đang tải danh sách bệnh nhân..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3.5">Mã BN</th>
                  <th className="px-5 py-3.5">Họ tên</th>
                  <th className="px-5 py-3.5">Ngày sinh</th>
                  <th className="px-5 py-3.5">Giới tính</th>
                  <th className="px-5 py-3.5">Điện thoại</th>
                  <th className="px-5 py-3.5">BHYT</th>
                  <th className="px-5 py-3.5">Nguồn</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Cập nhật lần cuối</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                      Không tìm thấy bệnh nhân phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const src = getSource(p);
                    const sync = getSyncStatus(p);
                    const g = getGender(p);
                    return (
                      <tr key={p.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                        <td className="px-5 py-4 font-mono font-medium text-primary-600">{p.his_patient_id ?? "—"}</td>
                        <td className="px-5 py-4 font-semibold text-foreground">{getFullName(p)}</td>
                        <td className="px-5 py-4 text-muted-foreground">{getBirthday(p)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 ${g === "Nam" ? "text-primary-600" : g === "Nữ" ? "text-rose-500" : "text-muted-foreground"}`}>
                            {g !== "—" && <span aria-hidden>{g === "Nam" ? "♂" : "♀"}</span>}
                            {g}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{p.phone_number ?? "—"}</td>
                        <td className="px-5 py-4 text-muted-foreground">{p.insurance_number ?? "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${src.className}`}>
                            {src.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${sync.className}`}>
                            {sync.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {p.updated_at ? formatDateTime(p.updated_at) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/patients/${p.id}`}>
                              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-primary-600">
                                <FiEye className="h-3.5 w-3.5" /> Chi tiết
                              </Button>
                            </Link>
                            <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-surface-secondary" aria-label="Thêm thao tác">
                              <FiChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}
    </Card>
  );
}
