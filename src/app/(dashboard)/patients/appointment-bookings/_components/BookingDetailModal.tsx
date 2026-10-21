"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Bell, CalendarDays, CreditCard, FileText, RefreshCw, RotateCcw, Stethoscope, User, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import type { AppointmentBooking } from "@/api/appointmentBookingsApi";
import { appointmentBookingPaymentsHooks } from "@/api/appointmentBookingPaymentsApi";
import { appointmentBookingRefundsHooks } from "@/api/appointmentBookingRefundsApi";
import {
  formatBookingStatus,
  formatExamType,
  formatHisSyncStatus,
  getBookingDateTimeText,
  getBookingPrice,
  getBookingStatusBadge,
  getCancelActionState,
  getHisSyncActionState,
  getHisSyncStatusBadge,
  isCancelledBooking,
} from "../types";

interface BookingDetailModalProps {
  booking: AppointmentBooking | null;
  onClose: () => void;
  onSyncToHis: (booking: AppointmentBooking) => void;
  isSyncing: boolean;
  /** Chỉ bật tại màn hình Kế toán khi tài khoản có quyền hủy/hoàn tiền. */
  canCancelRefund: boolean;
  onCancelRefund: (booking: AppointmentBooking) => void;
  /** Đang có thao tác (đồng bộ / hộp thoại hủy-hoàn tiền) → không cho đóng panel. */
  locked?: boolean;
}

const EMPTY = "—";

function text(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  const str = String(value).trim();
  return str === "" ? EMPTY : str;
}

function money(value: string | number | null | undefined): string {
  const amount = getBookingPrice(value);
  return amount === null ? EMPTY : `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

function dateTime(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const out = formatDateTime(value);
  return out && !out.includes("Invalid") ? out : EMPTY;
}

/** Tên dịch vụ đôi khi có dấu "." thừa ở đầu — chỉ làm sạch khi hiển thị. */
function cleanServiceName(name: string | null | undefined): string {
  return text(name?.replace(/^[.\s]+/, ""));
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return EMPTY;
  const digits = phone.replace(/\s+/g, "");
  return /^\d{10}$/.test(digits) ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : phone;
}

function Section({
  icon,
  title,
  badge,
  aside,
  children,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="text-primary-600">{icon}</span>
          {title}
          {badge}
        </h3>
        {aside}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">{children}</dl>;
}

function Row({ label, children, mono, wide }: { label: string; children: ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="flex-shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words text-right text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{children}</dd>
    </div>
  );
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

function ReminderRow({ label, hint, sentAt }: { label: string; hint: string; sentAt: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {sentAt ? (
        <div className="text-right">
          <Badge className="bg-success-light text-success">Đã gửi</Badge>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{dateTime(sentAt)}</p>
        </div>
      ) : (
        <Badge className="bg-warning-light text-warning">Chưa gửi</Badge>
      )}
    </div>
  );
}

/** Panel chi tiết lịch khám mở từ bên phải; danh sách phía sau giữ nguyên filter/phân trang. */
export function BookingDetailModal({
  booking,
  onClose,
  onSyncToHis,
  isSyncing,
  canCancelRefund,
  onCancelRefund,
  locked = false,
}: BookingDetailModalProps) {
  const open = booking !== null;
  const cancelled = isCancelledBooking(booking?.status);

  // Điều kiện hoàn tiền của lịch đã hủy — cùng query key với hộp thoại hoàn tiền nên dùng chung cache.
  const needRefundInfo = open && cancelled && canCancelRefund;
  const paymentQuery = appointmentBookingPaymentsHooks.useList(
    { booking_id: booking?.id, currentPage: 1, pageSize: 1 },
    { staleTime: 0, enabled: needRefundInfo },
  );
  const refundQuery = appointmentBookingRefundsHooks.useList(
    { booking_id: booking?.id, currentPage: 1, pageSize: 1, sortField: "requested_at", sortOrder: "DESC" },
    { enabled: needRefundInfo },
  );

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !locked) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, locked, onClose]);

  if (!booking) return null;

  const status = booking.status ?? booking.local_status;
  const snapshot = booking.pricing_snapshot ?? null;
  const payable = booking.price ?? snapshot?.amount_payable ?? null;
  const syncAction = getHisSyncActionState(booking);
  const cancelAction = getCancelActionState(booking);
  const patientId = booking.patient_id ?? booking.patient?.id ?? null;
  const syncError = booking.last_his_sync_error || booking.his_error_message;

  const payment = paymentQuery.data?.rows?.[0] ?? null;
  const latestRefund = refundQuery.data?.rows?.[0] ?? null;
  const refundInfoLoading = needRefundInfo && (paymentQuery.isLoading || refundQuery.isLoading);
  const canRefund =
    needRefundInfo &&
    !refundInfoLoading &&
    payment?.payment_gateway === "VCB" &&
    (!latestRefund || latestRefund.refund_status === "FAILED");

  const showSync = !cancelled && booking.his_sync_status !== "SYNCED";
  const showCancel = canCancelRefund && !cancelled && cancelAction.enabled;
  const showRefund = canCancelRefund && cancelled && canRefund;

  function handleClose() {
    if (!locked) onClose();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={handleClose} />
      <aside
        role="dialog"
        aria-label="Chi tiết lịch khám"
        className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col bg-slate-50 shadow-2xl sm:w-[580px]"
      >
        <header className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Chi tiết lịch khám</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  title="Sao chép mã lịch khám"
                  onClick={() => navigator.clipboard?.writeText(booking.id)}
                  className="font-mono hover:text-primary-600"
                >
                  #{booking.id.slice(0, 8)}…
                </button>
                <Badge className={getBookingStatusBadge(status)}>{formatBookingStatus(status)}</Badge>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={locked}
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Section icon={<CalendarDays className="h-4 w-4" />} title="Thông tin lịch hẹn">
            <Grid>
              <Row label="Ngày khám">{getBookingDateTimeText({ appointment_date: booking.appointment_date })}</Row>
              <Row label="Đối tượng khám">{formatExamType(booking.exam_type)}</Row>
              <Row label="Giờ khám">{text(booking.appointment_time?.slice(0, 5))}</Row>
              <Row label="Trạng thái">
                <Badge className={getBookingStatusBadge(status)}>{formatBookingStatus(status)}</Badge>
              </Row>
              <Row label="Số thứ tự">{text(booking.queue_number)}</Row>
              <Row label="Số tiền thanh toán">
                <span className="font-semibold">{money(payable)}</span>
              </Row>
            </Grid>
          </Section>

          <Section
            icon={<User className="h-4 w-4" />}
            title="Thông tin bệnh nhân"
            aside={
              patientId ? (
                <Link
                  href={`/patients/${patientId}`}
                  className="rounded-md border border-primary-100 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-100"
                >
                  Xem hồ sơ
                </Link>
              ) : null
            }
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
                {(booking.patient?.patient_full_name ?? "?")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{text(booking.patient?.patient_full_name)}</p>
                <p className="mt-0.5 text-sm text-primary-600">{formatPhone(booking.patient?.phone_number)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Mã BN HIS</p>
                <p className="font-mono text-sm text-slate-800">
                  {text(booking.his_patient_id ?? booking.patient?.his_patient_id)}
                </p>
              </div>
            </div>
          </Section>

          <Section icon={<Stethoscope className="h-4 w-4" />} title="Thông tin khám">
            <Grid>
              <Row label="Khu khám">{text(booking.exam_area?.name)}</Row>
              <Row label="Phòng khám">{text(booking.room?.room_name ?? booking.room?.room_id)}</Row>
              <Row label="Chuyên khoa">{text(booking.specialty?.name)}</Row>
              <Row label="Dịch vụ">{cleanServiceName(booking.service?.service_name)}</Row>
              <Row label="Bác sĩ">{text(booking.doctor?.doctor_name)}</Row>
              <Row label="Mã dịch vụ">{text(booking.service?.service_id)}</Row>
            </Grid>
          </Section>

          <Section
            icon={<CreditCard className="h-4 w-4" />}
            title="Thông tin giá"
            aside={
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                Lần khám thứ hai
                <Badge className={snapshot?.is_second_visit ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500"}>
                  {snapshot?.is_second_visit ? "Có" : "Không"}
                </Badge>
              </span>
            }
          >
            <dl className="space-y-2.5">
              <Row label="Giá dịch vụ (DV)">{money(snapshot?.dv_price)}</Row>
              <Row label="Giá BHYT">{money(snapshot?.bhyt_price)}</Row>
              <Row label="Số tiền thanh toán">
                <span className="text-base font-semibold text-slate-900">{money(payable)}</span>
              </Row>
              <Row label="Công thức tính">{text(snapshot?.formula)}</Row>
            </dl>
          </Section>

          <Section
            icon={<RefreshCw className="h-4 w-4" />}
            title="Đồng bộ HIS"
            badge={<Badge className={getHisSyncStatusBadge(booking.his_sync_status)}>{formatHisSyncStatus(booking.his_sync_status)}</Badge>}
          >
            <Grid>
              <Row label="HIS Booking ID" mono>{text(booking.his_booking_id)}</Row>
              <Row label="Trạng thái">{formatHisSyncStatus(booking.his_sync_status)}</Row>
              <Row label="Mã vào viện" mono>{text(booking.his_mavaovien)}</Row>
              <Row label="Đồng bộ lúc">{dateTime(booking.synced_to_his_at)}</Row>
              <Row label="STT HIS">{text(booking.his_stt)}</Row>
              <Row label="Lần thử gần nhất">{dateTime(booking.last_his_sync_attempt_at)}</Row>
            </Grid>
            {syncError && (
              <div className="mt-3 rounded-lg bg-error-light px-3 py-2.5 text-sm text-error">
                <p className="font-medium">Đồng bộ HIS thất bại</p>
                <p className="mt-0.5 line-clamp-3 break-words text-xs" title={syncError}>
                  {syncError}
                </p>
              </div>
            )}
          </Section>

          <Section icon={<Bell className="h-4 w-4" />} title="Nhắc lịch">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ReminderRow label="Nhắc lần 1" hint="24 giờ trước" sentAt={booking.reminder_1_sent_at} />
              <ReminderRow label="Nhắc lần 2" hint="2 giờ trước" sentAt={booking.reminder_2_sent_at} />
            </div>
          </Section>

          {booking.note && (
            <Section icon={<FileText className="h-4 w-4" />} title="Ghi chú">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{booking.note}</p>
            </Section>
          )}

          <Section icon={<FileText className="h-4 w-4" />} title="Thông tin hệ thống">
            <Grid>
              <Row label="Ngày tạo">{dateTime(booking.created_at)}</Row>
              <Row label="Ngày cập nhật">{dateTime(booking.updated_at)}</Row>
              <Row label="Người tạo" mono>{text(booking.created_by)}</Row>
              <Row label="Người cập nhật" mono>{text(booking.updated_by)}</Row>
              <Row label="Booking group ID" mono wide>{text(booking.booking_group_id)}</Row>
            </Grid>
          </Section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <Button variant="outline" onClick={handleClose} disabled={locked}>
            Đóng
          </Button>
          {showSync && (
            <Button
              variant="primary"
              disabled={!syncAction.enabled || isSyncing}
              isLoading={isSyncing}
              title={syncAction.reason}
              onClick={() => onSyncToHis(booking)}
            >
              <RefreshCw className="h-4 w-4" />
              Đồng bộ HIS
            </Button>
          )}
          {showCancel && (
            <Button variant="danger" className="border-destructive/30" onClick={() => onCancelRefund(booking)}>
              <XCircle className="h-4 w-4" />
              Hủy & hoàn tiền
            </Button>
          )}
          {showRefund && (
            <Button variant="danger" className="border-destructive/30" onClick={() => onCancelRefund(booking)}>
              <RotateCcw className="h-4 w-4" />
              {latestRefund?.refund_status === "FAILED" ? "Thử hoàn tiền lại" : "Hoàn tiền"}
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}
