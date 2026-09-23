"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { appointmentBookingPaymentsHooks } from "@/api/appointmentBookingPaymentsApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getReconcileMeta, statusLabels } from "../helpers";
import {
  User, FileText, Receipt, ArrowLeft,
  CheckCircle, Clock, Landmark, Smartphone,
} from "lucide-react";

export default function PaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const router = useRouter();

  // Không có GET-by-id cho payments — dùng filters=id==<id>&pageSize=1 trên
  // endpoint danh sách (xem docs/api/appointmentBookingPayment.md mục 3.9).
  const { data, isLoading } = appointmentBookingPaymentsHooks.useList({
    filters: `id==${paymentId},payment_status==PENDING|PAID`,
    pageSize: 1,
  });
  const payment = data?.rows?.[0];

  const { data: doctors } = doctorsHooks.useList();
  const { data: areasData } = examAreasHooks.useList();
  const { data: servicesData } = hisServicesHooks.usePaginatedList({ pageSize: 100, filters: "status==ACTIVE" });

  const doctorName = useMemo(
    () => doctors?.find((d) => d.id === payment?.booking?.doctor_id)?.doctorname,
    [doctors, payment],
  );
  const areaName = useMemo(
    () => areasData?.rows?.find((a) => a.id === payment?.booking?.exam_area_id)?.name,
    [areasData, payment],
  );
  const serviceName = useMemo(
    () => servicesData?.rows?.find((s) => s.id === payment?.booking?.service_id)?.servicename,
    [servicesData, payment],
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Đang tải giao dịch...</div>
    );
  }

  if (!payment) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">Không tìm thấy giao dịch.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const isPaid = payment.payment_status === "PAID";
  const reconcile = getReconcileMeta(payment);
  const GatewayIcon = payment.payment_gateway === "VCB" ? Landmark : Smartphone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="font-mono text-2xl font-bold text-gray-900">{payment.transaction_id ?? payment.id}</h1>
          <p className="mt-0.5 text-sm text-gray-500">Chi tiết giao dịch thanh toán</p>
        </div>
        <Badge variant={isPaid ? "success" : "warning"} className="px-3 py-1 text-sm">
          {isPaid ? <CheckCircle className="mr-1.5 inline h-4 w-4" /> : <Clock className="mr-1.5 inline h-4 w-4" />}
          {statusLabels[payment.payment_status]}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main info */}
        <div className="col-span-2 space-y-6">
          {/* Payment info */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary-600" />Thông tin giao dịch</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                {payment.transaction_id && (
                  <div>
                    <dt className="text-sm text-gray-500">Mã GD ngân hàng</dt>
                    <dd className="mt-1 font-mono text-gray-800">{payment.transaction_id}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Mã lịch hẹn</dt>
                  <dd className="mt-1 font-mono text-primary-600">{payment.booking_id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Số tiền</dt>
                  <dd className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(Number(payment.amount))}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Cổng thanh toán</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <GatewayIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{payment.payment_gateway === "VCB" ? "VietcomBank" : "MoMo"}</span>
                    {payment.payment_method && (
                      <span className="text-xs text-gray-400">({payment.payment_method})</span>
                    )}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm text-gray-500">Mô tả dịch vụ</dt>
                  <dd className="mt-1 font-medium">
                    {[doctorName, areaName, serviceName].filter(Boolean).join(" · ") || "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Patient info */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary-600" />Bệnh nhân</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Tên bệnh nhân</dt>
                  <dd className="mt-1 font-medium">{payment.patient?.patient_full_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Số điện thoại</dt>
                  <dd className="mt-1 font-medium">{payment.patient?.phone_number ?? "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Đối soát / Hoàn tiền</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${reconcile.className}`}>
                {reconcile.label}
              </span>
              {payment.refund && (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Số tiền hoàn</dt>
                    <dd className="font-medium">{formatCurrency(Number(payment.refund.refund_amount))}</dd>
                  </div>
                  {payment.refund.refund_gateway && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Cổng hoàn tiền</dt>
                      <dd className="font-medium">{payment.refund.refund_gateway}</dd>
                    </div>
                  )}
                  {payment.refund.processed_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Thời gian xử lý</dt>
                      <dd className="text-xs">{formatDateTime(payment.refund.processed_at)}</dd>
                    </div>
                  )}
                </dl>
              )}
              {/* Trạng thái chỉ hiển thị, không thao tác được ở đây — endpoint
                  trigger hoàn tiền VCB không yêu cầu Bearer auth nên không an
                  toàn để expose thao tác qua trang admin này. */}
              <Button variant="ghost" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Xuất biên lai
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Thông tin hệ thống</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã</span>
                <span className="font-mono text-xs">{payment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tạo lúc</span>
                <span className="text-xs">{formatDateTime(payment.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cập nhật</span>
                <span className="text-xs">{formatDateTime(payment.updated_at)}</span>
              </div>
              {payment.payment_time && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Thời điểm thanh toán</span>
                  <span className="text-xs">{formatDateTime(payment.payment_time)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
