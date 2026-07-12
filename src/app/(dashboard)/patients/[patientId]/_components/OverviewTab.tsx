import Link from "next/link";
import { IdCard, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingSection } from "@/components/ui/Spinner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import { InfoRow, SectionCard } from "./primitives";
import { getAddress, getAge, getFullName, getGender, getPatientCode } from "../types";
import type { BookingRow, RecordRow, ReviewRow } from "../hooks/usePatientDetail";

type OverviewTabProps = {
  patient: Patient;
  records: RecordRow[];
  recordsLoading: boolean;
  bookingsCount: number;
  latestBooking?: BookingRow;
  totalPaid: number;
  latestReview?: ReviewRow;
};

export function OverviewTab({
  patient,
  records,
  recordsLoading,
  bookingsCount,
  latestBooking,
  totalPaid,
  latestReview,
}: OverviewTabProps) {
  const fullName = getFullName(patient);
  const patientCode = getPatientCode(patient);
  const address = getAddress(patient);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {/* Main */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Thông tin cá nhân</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Thông tin định danh" icon={IdCard}>
              <InfoRow label="Mã bệnh nhân" value={patientCode} />
              <InfoRow label="Họ tên" value={fullName} />
              <InfoRow
                label="Ngày sinh"
                value={
                  patient.birthday
                    ? `${formatDate(patient.birthday)} (${getAge(patient.birthday, patient.birth_year)})`
                    : "—"
                }
              />
              <InfoRow label="Giới tính" value={getGender(patient.sex)} />
              <InfoRow label="Số CCCD" value={patient.identity_number} />
              <InfoRow label="Mã BHYT" value={patient.insurance_number} />
              <InfoRow label="Dân tộc" value={patient.ethnic_name ?? patient.ethnic_code} />
              <InfoRow label="Nghề nghiệp" value={patient.profession_name ?? patient.profession_id} />
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Thông tin liên hệ" icon={Phone}>
                <InfoRow label="Điện thoại" value={patient.phone_number} />
                <InfoRow label="Email" value="—" />
                <InfoRow label="Địa chỉ" value={address || "—"} />
              </SectionCard>
              <SectionCard title="Thông tin BHYT" icon={ShieldCheck}>
                <InfoRow label="Có BHYT" value={patient.insurance_number ? "Có" : "Không"} />
                <InfoRow label="Số thẻ BHYT" value={patient.insurance_number} />
                <InfoRow label="Nơi đăng ký KCB BĐ" value="Bệnh viện Vạn Hạnh" />
                <InfoRow
                  label="Giá trị sử dụng"
                  value={
                    patient.insurance_expired_date_text
                      ? `Đến ${patient.insurance_expired_date_text}`
                      : "—"
                  }
                />
              </SectionCard>
            </div>

            <SectionCard title="Thông tin hành chính" icon={UserRound}>
              <InfoRow
                label="Quốc tịch"
                value={patient.country_name ?? patient.national_code ?? patient.country_code}
              />
              <InfoRow label="Tình trạng hôn nhân" value="—" />
              <InfoRow label="Nhóm máu" value="—" />
              <InfoRow label="Chiều cao" value="—" />
              <InfoRow label="Cân nặng" value="—" />
              <InfoRow label="Ghi chú" value="—" />
            </SectionCard>
          </div>
        </div>

        {/* Recent records */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Lịch sử đặt khám gần nhất</h2>
            <Link href="/medical-records" className="text-sm font-medium text-primary-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          {recordsLoading ? (
            <LoadingSection text="Đang tải lịch sử..." />
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-3">Ngày khám</th>
                    <th className="px-4 py-3">Bác sĩ</th>
                    <th className="px-4 py-3">Chuyên khoa</th>
                    <th className="px-4 py-3">Phòng khám</th>
                    <th className="px-4 py-3">Dịch vụ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-800">{formatDate(r.examined_at)}</td>
                      <td className="px-4 py-3 text-slate-700">{r.doctor?.doctor_name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.specialty?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.room?.room_name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.service?.service_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
                          Đã khám
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có lịch sử khám.</p>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4 border-b border-slate-100 p-5">
            <Avatar name={fullName} size="lg" className="h-14 w-14" />
            <div>
              <p className="text-lg font-bold text-slate-900">{fullName}</p>
              <p className="text-sm text-muted-foreground">Mã bệnh nhân: {patientCode}</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">Tổng lượt đặt khám</span>
              <b>{bookingsCount}</b>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">Lần khám gần nhất</span>
              <b>{latestBooking?.appointment_time ? formatDate(latestBooking.appointment_time) : "—"}</b>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">Tổng thanh toán</span>
              <b>{formatCurrency(totalPaid)}</b>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">Đánh giá gần nhất</span>
              <b>{latestReview ? `${latestReview.overall_rating} ★` : "—"}</b>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Thông tin khác</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quốc tịch</span>
              <span className="font-medium">{patient.country_name ?? patient.national_code ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BHYT hết hạn</span>
              <span className="font-medium">{patient.insurance_expired_date_text ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cập nhật lúc</span>
              <span className="font-medium text-right">
                {patient.his_updated_at ? formatDateTime(patient.his_updated_at) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nguồn hồ sơ</span>
              <span className="font-medium">Mobile App</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái</span>
              <span className="font-medium text-success">● Hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
