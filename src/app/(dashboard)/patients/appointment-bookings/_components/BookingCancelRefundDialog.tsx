"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AppointmentBooking } from "@/api/appointmentBookingsApi";
import { appointmentBookingPaymentsHooks } from "@/api/appointmentBookingPaymentsApi";
import {
  appointmentBookingRefundsHooks,
  isRefundPendingError,
  type CancelAppointmentData,
  type CancelRefundInfo,
  type GroupCancelRequired,
} from "@/api/appointmentBookingRefundsApi";
import {
  REFUND_STATUS_LABELS,
  getBookingDateTimeText,
  getBookingPrice,
  getCancelActionState,
  getRefundStatusBadge,
  isCancelledBooking,
} from "../types";

interface BookingCancelRefundDialogProps {
  booking: AppointmentBooking;
  onClose: () => void;
}

type Phase =
  | { type: "confirm" }
  | { type: "group"; info: GroupCancelRequired }
  | { type: "result"; message: string; data: CancelAppointmentData };

type Notice = { tone: "warning" | "error" | "success"; text: string };

const NOTICE_CLASS: Record<Notice["tone"], string> = {
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  success: "bg-success-light text-success",
};

const MISSING_VCB_TRANSACTION_ID_MESSAGE = "Payment chưa có mã giao dịch VCB, cần đối soát thủ công";

function toAmount(value: string | number | null | undefined): number | null {
  return getBookingPrice(value);
}

function RefundBadge({ refund }: { refund: Pick<CancelRefundInfo, "refund_status"> | null }) {
  if (!refund) return <span className="text-xs text-muted-foreground">Không có hoàn tiền</span>;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRefundStatusBadge(refund.refund_status)}`}>
      {REFUND_STATUS_LABELS[refund.refund_status] ?? refund.refund_status}
    </span>
  );
}

/**
 * Hủy lịch + hoàn tiền (VCB) cho admin.
 * - Lịch chưa hủy: `DELETE /appointments/{id}` — BE tự hoàn tiền trong cùng request, FE không gọi thêm refund.
 * - Lịch đã hủy: dựa vào dòng refund mới nhất (`GET /appointment-booking-refunds`) để cho phép hoàn lại
 *   (`POST /payment/vcb/refund`) — chỉ khi chưa có refund hoặc refund FAILED.
 * Hoàn tiền luôn toàn phần, không có ô nhập số tiền.
 */
export function BookingCancelRefundDialog({ booking, onClose }: BookingCancelRefundDialogProps) {
  const [phase, setPhase] = useState<Phase>({ type: "confirm" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [remark, setRemark] = useState("");

  const cancelled = isCancelledBooking(booking.status);
  const cancelState = getCancelActionState(booking);

  const paymentQuery = appointmentBookingPaymentsHooks.useList(
    { booking_id: booking.id, currentPage: 1, pageSize: 1 },
    { staleTime: 0 },
  );
  const refundQuery = appointmentBookingRefundsHooks.useList({
    booking_id: booking.id,
    currentPage: 1,
    pageSize: 1,
    sortField: "requested_at",
    sortOrder: "DESC",
  });

  // Payment mặc định chỉ trả dòng PAID → có dòng nghĩa là booking đã thanh toán.
  const payment = paymentQuery.data?.rows?.[0] ?? null;
  const latestRefund = refundQuery.data?.rows?.[0] ?? null;
  const loadingInfo = paymentQuery.isLoading || refundQuery.isLoading;

  const amount = toAmount(payment?.amount) ?? toAmount(booking.price ?? booking.service?.price);
  const amountText = amount !== null ? formatCurrency(amount) : "toàn bộ số tiền đã thanh toán";
  const isPaid = payment?.payment_status === "PAID" || booking.status === "PAID" || booking.status === "CONFIRMED";
  const gateway = payment?.payment_gateway ?? null;

  const cancelMutation = appointmentBookingRefundsHooks.useCancel({
    onSuccess: (result) => {
      if (result.kind === "requires_group_cancel") {
        setPhase({ type: "group", info: result.info });
        return;
      }
      setPhase({ type: "result", message: result.message, data: result.data });
      const status = result.data.refund?.refund_status ?? result.data.cancelled_bookings?.find((c) => c.refund)?.refund?.refund_status;
      if (status === "FAILED" || status === "PENDING") toast.warning(result.message);
      else toast.success(result.message || "Hủy lịch khám thành công");
    },
    onError: (error) => {
      const text = error.message || "Hủy lịch khám thất bại";
      setNotice({ tone: "error", text });
      toast.error(text);
    },
  });

  const refundMutation = appointmentBookingRefundsHooks.useRefund({
    onSuccess: () => {
      setNotice({ tone: "success", text: "Hoàn tiền thành công" });
      toast.success("Hoàn tiền thành công");
    },
    onError: (error) => {
      const text = error.message || "Hoàn tiền thất bại";
      if (isRefundPendingError(error)) {
        // VCB chưa phản hồi: dòng refund đã ở PENDING, tuyệt đối không bấm gọi lại.
        setNotice({ tone: "warning", text: `${text}. Vui lòng không thử lại, hệ thống sẽ cập nhật khi VCB phản hồi.` });
        toast.warning(text);
      } else {
        setNotice({ tone: "error", text });
        toast.error(text);
      }
    },
  });

  const busy = cancelMutation.isPending || refundMutation.isPending;

  // Nút hoàn tiền (lịch đã hủy): không có refund + đã thanh toán → bật; PENDING/SUCCESS → tắt; FAILED → thử lại.
  let refundDisabledReason: string | null = null;
  if (cancelled) {
    if (!payment) refundDisabledReason = "Lịch khám chưa có giao dịch thanh toán để hoàn tiền";
    else if (gateway !== "VCB") refundDisabledReason = "Chỉ hỗ trợ hoàn tiền cho giao dịch VCB";
    else if (!payment.transaction_id) refundDisabledReason = `${MISSING_VCB_TRANSACTION_ID_MESSAGE}. Không thể hoàn qua VCB.`;
    else if (latestRefund?.refund_status === "PENDING") refundDisabledReason = "Yêu cầu hoàn tiền đang được xử lý";
    else if (latestRefund?.refund_status === "SUCCESS") refundDisabledReason = "Đã hoàn tiền thành công";
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  function renderResultRow(label: string, refund: CancelRefundInfo | null, key: string) {
    return (
      <div key={key} className="rounded-xl border border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{label}</p>
            {refund && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Số tiền hoàn: {toAmount(refund.refund_amount) !== null ? formatCurrency(toAmount(refund.refund_amount) as number) : "—"}
              </p>
            )}
          </div>
          <RefundBadge refund={refund} />
        </div>
        {refund?.refund_status === "FAILED" && refund.failure_reason && (
          <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-xs text-error">
            Lý do: {refund.failure_reason}
            {refund.failure_code && <span className="ml-1 opacity-70">({refund.failure_code})</span>}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {phase.type === "result" ? "Kết quả hủy lịch" : cancelled ? "Hoàn tiền lịch khám" : "Hủy lịch & hoàn tiền"}
          </h2>
          <button onClick={handleClose} disabled={busy} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">×</button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {phase.type === "confirm" && (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Bệnh nhân</dt>
                <dd className="font-medium text-slate-800">{booking.patient?.patient_full_name ?? "—"}</dd>
                <dt className="text-muted-foreground">Thời gian hẹn</dt>
                <dd className="font-medium text-slate-800">{getBookingDateTimeText(booking)}</dd>
                <dt className="text-muted-foreground">Số tiền hoàn</dt>
                <dd className="font-semibold text-slate-800">
                  {loadingInfo ? "Đang tải..." : isPaid || payment ? amountText : "Không có (chưa thanh toán)"}
                </dd>
                {latestRefund && (
                  <>
                    <dt className="text-muted-foreground">Hoàn tiền gần nhất</dt>
                    <dd><RefundBadge refund={latestRefund} /></dd>
                    {latestRefund.processed_at && (
                      <>
                        <dt className="text-muted-foreground">Xử lý lúc</dt>
                        <dd className="text-slate-700">{formatDateTime(latestRefund.processed_at)}</dd>
                      </>
                    )}
                  </>
                )}
              </dl>

              {!cancelled && (
                <p className="text-sm text-slate-600">
                  {isPaid || payment
                    ? `Lịch khám sẽ bị hủy và hoàn ${amountText} về phương thức thanh toán ban đầu (hoàn toàn phần). Hành động này không thể hoàn tác.`
                    : "Lịch khám sẽ bị hủy. Lịch chưa thanh toán nên không phát sinh hoàn tiền. Hành động này không thể hoàn tác."}
                </p>
              )}
              {!cancelled && gateway === "MOMO" && (
                <p className="rounded-xl bg-warning-light px-4 py-3 text-sm text-warning">
                  Giao dịch thanh toán qua MoMo hiện chưa hỗ trợ hoàn tiền — hệ thống có thể từ chối hủy lịch này.
                </p>
              )}
              {!cancelled && !cancelState.enabled && (
                <p className="rounded-xl bg-warning-light px-4 py-3 text-sm text-warning">{cancelState.reason}</p>
              )}

              {cancelled && refundDisabledReason && (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{refundDisabledReason}</p>
              )}
              {cancelled && !refundDisabledReason && (
                <>
                  <p className="text-sm text-slate-600">
                    {latestRefund?.refund_status === "FAILED"
                      ? `Lần hoàn tiền trước thất bại. Thử hoàn lại ${amountText} (toàn phần).`
                      : `Lịch khám đã hủy nhưng chưa có yêu cầu hoàn tiền. Hoàn ${amountText} (toàn phần).`}
                  </p>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú (tùy chọn)</label>
                    <input
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      disabled={busy}
                      maxLength={200}
                      placeholder="Lý do hoàn tiền"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}

              {cancelled && latestRefund?.refund_status === "FAILED" && (
                <p className="rounded-xl bg-error-light px-4 py-3 text-sm text-error">
                  {REFUND_STATUS_LABELS.FAILED}. Có thể thử lại hoặc xử lý thủ công.
                </p>
              )}
              {cancelled && latestRefund?.refund_status === "PENDING" && (
                <p className="rounded-xl bg-warning-light px-4 py-3 text-sm text-warning">
                  {REFUND_STATUS_LABELS.PENDING}. Vui lòng không gửi lại yêu cầu.
                </p>
              )}
            </>
          )}

          {phase.type === "group" && (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-warning-light px-4 py-3 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Công khám này là mốc tính giá giảm cho các công sau. Cần hủy toàn bộ nhóm công khám dưới đây
                  (và hoàn tiền từng công đã thanh toán), sau đó đăng ký lại.
                </p>
              </div>
              <div className="space-y-2">
                {phase.info.bookings.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {member.appointment_date ? member.appointment_date.slice(0, 10) : "—"}
                        {member.is_target && <span className="ml-2 text-xs text-primary-600">(công đang chọn)</span>}
                        {member.is_second_visit && <span className="ml-2 text-xs text-muted-foreground">(công sau)</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {toAmount(member.price) !== null ? formatCurrency(toAmount(member.price) as number) : "—"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{member.status ?? "—"}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {phase.type === "result" && (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                <p>{phase.message || "Hủy lịch khám thành công"}</p>
              </div>
              <div className="space-y-2">
                {phase.data.cancelled_bookings
                  ? phase.data.cancelled_bookings.map((item) =>
                      renderResultRow(
                        `${item.appointment.appointment_date?.slice(0, 10) ?? "Công khám"} · ${item.appointment.id.slice(0, 8)}`,
                        item.refund,
                        item.appointment.id,
                      ),
                    )
                  : renderResultRow("Lịch khám đã hủy", phase.data.refund, booking.id)}
              </div>
            </>
          )}

          {notice && (
            <p className={`rounded-xl px-4 py-3 text-sm ${NOTICE_CLASS[notice.tone]}`}>{notice.text}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            {phase.type === "result" ? "Đóng" : "Không"}
          </Button>

          {phase.type === "confirm" && !cancelled && (
            <Button
              variant="danger"
              disabled={busy || loadingInfo || !cancelState.enabled}
              isLoading={cancelMutation.isPending}
              onClick={() => {
                setNotice(null);
                cancelMutation.mutate({ id: booking.id });
              }}
            >
              Xác nhận hủy lịch
            </Button>
          )}

          {phase.type === "confirm" && cancelled && (
            <Button
              variant="danger"
              disabled={busy || loadingInfo || refundDisabledReason !== null}
              isLoading={refundMutation.isPending}
              onClick={() => {
                setNotice(null);
                refundMutation.mutate({ bookingId: booking.id, remark });
              }}
            >
              {latestRefund?.refund_status === "FAILED" ? "Thử hoàn tiền lại" : "Xác nhận hoàn tiền"}
            </Button>
          )}

          {phase.type === "group" && (
            <Button
              variant="danger"
              disabled={busy}
              isLoading={cancelMutation.isPending}
              onClick={() => {
                setNotice(null);
                cancelMutation.mutate({ id: booking.id, cancelGroup: true });
              }}
            >
              Hủy cả nhóm & hoàn tiền
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
