import { useState } from "react";
import Link from "next/link";
import { FiEye, FiGrid, FiDownload } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import { useSyncPatientsToHis } from "@/api/patientApi";
import { getBirthday, getFullName, getGender, getSyncStatus } from "../helpers";
import type { PatientListController } from "../hooks/usePatientList";
import { PatientRowMenu } from "./PatientRowMenu";

/** Bảng danh sách bệnh nhân + phân trang. */
export function PatientTable({ ctrl }: { ctrl: PatientListController }) {
  const { isLoading, filtered, total, totalPages, currentPage, setPage, pageSize, setPageSize } = ctrl;
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const syncToHis = useSyncPatientsToHis({
    onSuccess: (data) => {
      setSyncingId(null);
      const row = data.results[0];
      if (row?.status === "error") {
        toast.error(row.error || "Đồng bộ HIS thất bại");
      } else if (row?.status === "skipped") {
        toast.info("Bệnh nhân này đã được đồng bộ lên HIS trước đó");
      } else {
        toast.success("Đồng bộ HIS thành công");
      }
    },
    onError: (err) => {
      setSyncingId(null);
      toast.error(err.message || "Đồng bộ HIS thất bại");
    },
  });

  function handleSyncOne(patientId: string) {
    setSyncingId(patientId);
    syncToHis.mutate([patientId]);
  }

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
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Cập nhật lần cuối</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                      Không tìm thấy bệnh nhân phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
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
                            <PatientRowMenu
                              onSyncToHis={() => handleSyncOne(p.id)}
                              isSyncing={syncingId === p.id}
                            />
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
