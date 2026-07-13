import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import type { MedicalRecord } from "@/api/medicalRecordsApi";
import { FiEye } from "react-icons/fi";
import { MEDICAL_RECORD_PAGE_SIZE } from "../types";

interface MedicalRecordTableProps {
  rows: MedicalRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function MedicalRecordTable({ rows, isLoading, page, totalPages, totalItems, onPageChange }: MedicalRecordTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      {isLoading ? (
        <LoadingSection text="Đang tải hồ sơ bệnh án..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3.5">Mã hồ sơ</th>
                  <th className="px-5 py-3.5">Bệnh nhân</th>
                  <th className="px-5 py-3.5">Bác sĩ</th>
                  <th className="px-5 py-3.5">Chuyên khoa</th>
                  <th className="px-5 py-3.5">Ngày khám</th>
                  <th className="px-5 py-3.5">Chẩn đoán</th>
                  {/* <th className="px-5 py-3.5">Trạng thái</th> */}
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((record) => {
                  return (
                    <tr key={record.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                      <td className="px-5 py-4 font-medium text-primary-600">{record.record_code}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{record.patient?.patient_full_name ?? "—"}</p>
                        {record.patient?.phone_number && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{record.patient.phone_number}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-foreground">{record.doctor?.doctor_name ?? "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{record.specialty?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <p className="text-foreground">{formatDate(record.examined_at)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(record.examined_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-muted-foreground">
                        <p className="truncate">{record.diagnosis ?? "—"}</p>
                      </td>
                      {/* <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td> */}
                      <td className="px-5 py-4 text-center">
                        <Link href={`/medical-records/${record.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-primary-600">
                            <FiEye className="h-3.5 w-3.5" /> Xem chi tiết
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                      Không tìm thấy hồ sơ phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalItems={totalItems}
              pageSize={MEDICAL_RECORD_PAGE_SIZE}
            />
          </div>
        </>
      )}
    </Card>
  );
}
