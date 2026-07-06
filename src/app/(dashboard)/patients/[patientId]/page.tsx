"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingSection } from "@/components/ui/Spinner";
import { useGetPatientById } from "@/api/patientApi";
import { medicalRecordsHooks } from "@/api/medicalRecordsApi";
import { appointmentReviewsHooks } from "@/api/appointmentReviewsApi";
import { appointmentBookingsHooks } from "@/api/appointmentBookingsApi";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Grid2X2,
  History,
  IdCard,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";

function getFullName(p: {
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_full_name?: string | null;
}): string {
  return (
    p.patient_full_name ||
    [p.patient_first_name, p.patient_last_name].filter(Boolean).join(" ") ||
    "—"
  );
}

function getGender(sex: string | null): string {
  if (!sex) return "—";
  return sex.toLowerCase() === "nam"
    ? "Nam"
    : sex.toLowerCase() === "nữ" || sex.toLowerCase() === "nu"
      ? "Nữ"
      : sex;
}

function getAge(birthday: string | null, birthYear: string | null): string {
  const year = birthday
    ? new Date(birthday).getFullYear()
    : birthYear
      ? Number(birthYear)
      : null;
  if (!year || Number.isNaN(year)) return "—";
  return `${new Date().getFullYear() - year} tuổi`;
}

function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const labels: Record<string, string> = {
    HIS_SYNCED: "Đã đồng bộ HIS",
    CONFIRMED: "Đã xác nhận",
    PAID: "Đã thanh toán",
    CANCELED: "Đã hủy",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    COMPLETED: "Hoàn tất",
    UNPAID: "Chưa thanh toán",
    PARTIAL: "Thanh toán một phần",
  };
  return labels[status] ?? status;
}

function EmptyTab({ text }: { text: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-700">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

const tabs = [
  { key: "overview", label: "Tổng quan", icon: Grid2X2 },
  { key: "appointments", label: "Lịch sử đặt khám", icon: CalendarDays },
  { key: "records", label: "Hồ sơ bệnh án", icon: FileText },
  { key: "payments", label: "Thanh toán", icon: CreditCard },
  { key: "reviews", label: "Đánh giá", icon: Star },
  { key: "family", label: "Người thân", icon: UsersRound },
  { key: "logs", label: "Nhật ký cập nhật", icon: History },
] as const;

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: patient, isLoading } = useGetPatientById(patientId);
  const appointmentBookingParams = useMemo(
    () => ({
      patient_id: patient?.id ?? patientId,
      page: 1,
      pageSize: 10,
      sortField: "appointment_time",
      sortOrder: "DESC" as const,
    }),
    [patient?.id, patientId],
  );
  const { data: bookingsData, isLoading: bookingsLoading } =
    appointmentBookingsHooks.useList(
      appointmentBookingParams,
      { enabled: Boolean(patient?.id ?? patientId) },
    );
  const { data: recordsData, isLoading: recordsLoading } =
    medicalRecordsHooks.useList(
      {
        patient_id: patientId,
        page: 1,
        pageSize: 5,
        sortField: "examined_at",
        sortOrder: "DESC",
      },
      { enabled: Boolean(patientId) },
    );
  const { data: reviewsData } = appointmentReviewsHooks.useList(
    {
      patient_id: patientId,
      page: 1,
      pageSize: 1,
      sortField: "created_at",
      sortOrder: "DESC",
    },
    { enabled: Boolean(patientId) },
  );

  const bookings = useMemo(() => bookingsData?.rows ?? [], [bookingsData]);
  const records = useMemo(() => recordsData?.rows ?? [], [recordsData]);
  const totalPaid = records.reduce(
    (sum, r) => sum + toNumber(r.paid_amount || r.total_amount),
    0,
  );
  const latestBooking = bookings[0];
  const latestReview = reviewsData?.rows?.[0];

  if (isLoading)
    return <LoadingSection text="Đang tải thông tin bệnh nhân..." />;

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Không tìm thấy bệnh nhân.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  const fullName = getFullName(patient);
  const patientCode = patient.his_patient_id ?? patient.id;
  const address =
    patient.address_full ??
    [
      patient.address_detail,
      patient.address_street,
      patient.ward_name,
      patient.district_name,
      patient.province_name,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{fullName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Hồ sơ chính
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>
                Mã bệnh nhân: <b>{patientCode}</b>
              </span>
              <span>•</span>
              <span>{getGender(patient.sex)}</span>
              <span>•</span>
              <span>
                {patient.birthday
                  ? `${formatDate(patient.birthday)} (${getAge(patient.birthday, patient.birth_year)})`
                  : getAge(patient.birthday, patient.birth_year)}
              </span>
              <span>•</span>
              <span>{patient.phone_number ?? "—"}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-lg bg-success-light px-2.5 py-1 text-success">
                Đã đồng bộ HIS
              </span>
              <span className="rounded-lg bg-primary-100 px-2.5 py-1 text-primary-600">
                {patient.insurance_number ? "Có BHYT" : "Chưa có BHYT"}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                Nguồn: Mobile App
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                {bookingsData?.count ?? 0} lượt đặt khám
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                Lần cập nhật:{" "}
                {patient.his_updated_at
                  ? formatDateTime(patient.his_updated_at)
                  : "—"}
              </span>
            </div>
          </div>
        </div>
        <Link href={`/medical-records/new?patientId=${patientId}`}>
          <Button variant="primary" className="h-11 gap-2 rounded-xl px-5">
            <FileText className="h-4 w-4" /> Tạo hồ sơ bệnh án
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white px-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex min-w-max items-center gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex h-14 items-center gap-2 border-b-2 text-sm font-medium transition-colors ${active ? "border-primary-600 text-primary-600" : "border-transparent text-slate-600 hover:text-primary-600"}`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Main */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Thông tin cá nhân
            </h2>
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
                <InfoRow
                  label="Dân tộc"
                  value={patient.ethnic_name ?? patient.ethnic_code}
                />
                <InfoRow
                  label="Nghề nghiệp"
                  value={patient.profession_name ?? patient.profession_id}
                />
              </SectionCard>

              <div className="space-y-4">
                <SectionCard title="Thông tin liên hệ" icon={Phone}>
                  <InfoRow label="Điện thoại" value={patient.phone_number} />
                  <InfoRow label="Email" value="—" />
                  <InfoRow label="Địa chỉ" value={address || "—"} />
                </SectionCard>
                <SectionCard title="Thông tin BHYT" icon={ShieldCheck}>
                  <InfoRow
                    label="Có BHYT"
                    value={patient.insurance_number ? "Có" : "Không"}
                  />
                  <InfoRow
                    label="Số thẻ BHYT"
                    value={patient.insurance_number}
                  />
                  <InfoRow
                    label="Nơi đăng ký KCB BĐ"
                    value="Bệnh viện Vạn Hạnh"
                  />
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
                  value={
                    patient.country_name ??
                    patient.national_code ??
                    patient.country_code
                  }
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
              <h2 className="text-lg font-semibold text-slate-900">
                Lịch sử đặt khám gần nhất
              </h2>
              <Link
                href="/medical-records"
                className="text-sm font-medium text-primary-600 hover:underline"
              >
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
                      <th className="px-4 py-3">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {formatDate(r.examined_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {r.doctor?.doctor_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.specialty?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.room?.room_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.service?.service_name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
                            Đã khám
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {formatCurrency(
                            toNumber(r.paid_amount || r.total_amount),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chưa có lịch sử khám.
              </p>
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
                <p className="text-sm text-muted-foreground">
                  Mã bệnh nhân: {patientCode}
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">
                  Tổng lượt đặt khám
                </span>
                <b>{bookingsData?.count ?? 0}</b>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Lần khám gần nhất</span>
                <b>
                  {latestBooking?.appointment_time ? formatDate(latestBooking.appointment_time) : "—"}
                </b>
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
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Thông tin khác
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quốc tịch</span>
                <span className="font-medium">
                  {patient.country_name ?? patient.national_code ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BHYT hết hạn</span>
                <span className="font-medium">
                  {patient.insurance_expired_date_text ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cập nhật lúc</span>
                <span className="font-medium text-right">
                  {patient.his_updated_at
                    ? formatDateTime(patient.his_updated_at)
                    : "—"}
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
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          {activeTab === "appointments" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Lịch sử đặt khám
                  </h2>
                  {/* <p className="text-sm text-muted-foreground">
                    Dữ liệu từ /appointment-bookings theo patient_id {appointmentBookingParams.patient_id}.
                  </p> */}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {bookingsData?.count ?? 0} lượt
                </span>
              </div>
              {bookingsLoading ? (
                <LoadingSection text="Đang tải lịch sử đặt khám..." />
              ) : bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                        <th className="px-4 py-3">Thời gian hẹn</th>
                        <th className="px-4 py-3">Mã đặt khám</th>
                        <th className="px-4 py-3">Mã BN HIS</th>
                        <th className="px-4 py-3">Phòng</th>
                        <th className="px-4 py-3">Bác sĩ</th>
                        <th className="px-4 py-3">Dịch vụ</th>
                        <th className="px-4 py-3">Nguồn</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {booking.appointment_time
                              ? formatDateTime(booking.appointment_time)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {booking.his_booking_id ?? booking.request_booking_id ?? booking.id}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {booking.his_patient_id ?? booking.patient?.his_patient_id ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {booking.room_id ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {booking.doctor_id ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {booking.service_id ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {booking.source ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                              {formatStatus(booking.local_status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyTab text="Chưa có lịch sử đặt khám." />
              )}
            </>
          )}

          {activeTab === "records" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Hồ sơ bệnh án
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {recordsData?.count ?? 0} hồ sơ
                </span>
              </div>
              {recordsLoading ? (
                <LoadingSection text="Đang tải hồ sơ bệnh án..." />
              ) : records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                        <th className="px-4 py-3">Mã hồ sơ</th>
                        <th className="px-4 py-3">Ngày khám</th>
                        <th className="px-4 py-3">Bác sĩ</th>
                        <th className="px-4 py-3">Chẩn đoán</th>
                        <th className="px-4 py-3">Thanh toán</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {record.record_code}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatDate(record.examined_at)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {record.doctor?.doctor_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {record.diagnosis ?? record.conclusion ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {formatCurrency(toNumber(record.paid_amount || record.total_amount))}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
                              {formatStatus(record.record_status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyTab text="Chưa có hồ sơ bệnh án." />
              )}
            </>
          )}

          {activeTab === "payments" && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Thanh toán
              </h2>
              {recordsLoading ? (
                <LoadingSection text="Đang tải dữ liệu thanh toán..." />
              ) : records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                        <th className="px-4 py-3">Mã hồ sơ</th>
                        <th className="px-4 py-3">Ngày khám</th>
                        <th className="px-4 py-3">Tổng tiền</th>
                        <th className="px-4 py-3">Đã thanh toán</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {record.record_code}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatDate(record.examined_at)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {formatCurrency(toNumber(record.total_amount))}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {formatCurrency(toNumber(record.paid_amount))}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {formatStatus(record.payment_status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyTab text="Chưa có dữ liệu thanh toán." />
              )}
            </>
          )}

          {activeTab === "reviews" && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Đánh giá
              </h2>
              {latestReview ? (
                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-bold text-warning">
                      {latestReview.overall_rating} ★
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {formatStatus(latestReview.status)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(latestReview.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {latestReview.comment || "Chưa có nội dung đánh giá."}
                  </p>
                  {latestReview.admin_reply && (
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <b>Phản hồi:</b> {latestReview.admin_reply}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyTab text="Chưa có đánh giá." />
              )}
            </>
          )}

          {activeTab === "family" && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Người thân
              </h2>
              <EmptyTab text="Chưa có dữ liệu người thân." />
            </>
          )}

          {activeTab === "logs" && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Nhật ký cập nhật
              </h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-800">Cập nhật HIS gần nhất</p>
                  <p className="mt-1 text-muted-foreground">
                    {patient.his_updated_at ? formatDateTime(patient.his_updated_at) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-800">Đồng bộ vào hệ thống</p>
                  <p className="mt-1 text-muted-foreground">
                    {patient.synced_at ? formatDateTime(patient.synced_at) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-800">Cập nhật hồ sơ</p>
                  <p className="mt-1 text-muted-foreground">
                    {patient.updated_at ? formatDateTime(patient.updated_at) : "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
