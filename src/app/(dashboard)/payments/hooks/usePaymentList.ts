import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  appointmentBookingPaymentsHooks,
  appointmentBookingPaymentsService,
  type AppointmentBookingPaymentListParams,
  type ReconcileStatusFilter,
} from "@/api/appointmentBookingPaymentsApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import { useDebounce } from "@/hooks/useApiHelpers";
import { downloadBlob } from "@/lib/download";
import { PAYMENTS_PAGE_SIZE } from "../helpers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PaymentStatusFilter = "" | "PENDING" | "PAID";
export type PaymentGatewayFilter = "" | "MOMO" | "VCB";
export type PaymentReconcileFilter = "" | ReconcileStatusFilter;

/** State + dữ liệu cho trang danh sách thanh toán (nối API thật). */
export function usePaymentList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatusFilter>("");
  const [gateway, setGateway] = useState<PaymentGatewayFilter>("");
  const [reconcile, setReconcile] = useState<PaymentReconcileFilter>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, gateway, reconcile, fromDate, toDate]);

  // Bẫy BE: nếu `filters` không có mệnh đề payment_status, BE tự mặc định
  // payment_status=='PAID'. Vì vậy luôn gửi tường minh — "Tất cả" phải dùng
  // cú pháp OR (|) chứ không phải bỏ trống điều kiện.
  const searchTerm = debouncedSearch.trim();
  const isBookingIdSearch = UUID_RE.test(searchTerm);

  // "Đã đối soát"/"Chưa đối soát" đã tự hàm ý payment_status ở BE (PAID/PENDING).
  // Gửi kèm mệnh đề payment_status của riêng mình sẽ AND thêm vào đó, nên chọn
  // "Đã thanh toán" + "Chưa đối soát" cho ra danh sách rỗng mà không rõ lý do —
  // nhường quyền quyết định cho nhãn đối soát.
  const reconcileImpliesStatus = reconcile === "RECONCILED" || reconcile === "UNRECONCILED";
  const effectiveStatus = reconcileImpliesStatus ? "" : status;

  const filterClauses: string[] = [`payment_status==${effectiveStatus || "PENDING|PAID"}`];
  if (searchTerm && !isBookingIdSearch) {
    filterClauses.push(`transaction_id@=${searchTerm}`);
  }
  const serverFilters = filterClauses.join(",");

  // Dùng CHUNG cho danh sách và xuất Excel: file xuất ra phải đúng tập dòng
  // đang hiển thị với bộ lọc hiện tại, nên chỉ được khác nhau ở phân trang
  // (export bỏ currentPage/pageSize vì BE xuất toàn bộ dòng khớp bộ lọc).
  const filterParams: AppointmentBookingPaymentListParams = useMemo(
    () => ({
      filters: serverFilters,
      ...(gateway ? { payment_gateway: gateway } : {}),
      ...(searchTerm && isBookingIdSearch ? { booking_id: searchTerm } : {}),
      ...(reconcile ? { reconcile_status: reconcile } : {}),
      ...(fromDate ? { from_date: fromDate } : {}),
      ...(toDate ? { to_date: toDate } : {}),
    }),
    [serverFilters, gateway, searchTerm, isBookingIdSearch, reconcile, fromDate, toDate],
  );

  const { data, isLoading } = appointmentBookingPaymentsHooks.useList({
    currentPage: page,
    pageSize: PAYMENTS_PAGE_SIZE,
    ...filterParams,
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Lookup map bác sĩ / khu vực khám / dịch vụ để dựng cột "Mô tả" — payment
  // chỉ trả FK id thô (booking.doctor_id/exam_area_id/service_id), không có
  // tên sẵn.
  const { data: doctors } = doctorsHooks.useList();
  const doctorNameById = useMemo(() => {
    const map = new Map<string, string>();
    (doctors ?? []).forEach((d) => map.set(d.id, d.doctorname));
    return map;
  }, [doctors]);

  const { data: areasData } = examAreasHooks.useList();
  const areaNameById = useMemo(() => {
    const map = new Map<string, string>();
    (areasData?.rows ?? []).forEach((a) => map.set(a.id, a.name));
    return map;
  }, [areasData]);

  const { data: servicesData } = hisServicesHooks.usePaginatedList({ pageSize: 100, filters: "status==ACTIVE" });
  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    (servicesData?.rows ?? []).forEach((s) => map.set(s.id, s.servicename));
    return map;
  }, [servicesData]);

  function getDescription(booking: { doctor_id?: string | null; exam_area_id?: string | null; service_id?: string | null } | null | undefined): string {
    if (!booking) return "—";
    const parts = [
      booking.doctor_id ? doctorNameById.get(booking.doctor_id) : undefined,
      booking.exam_area_id ? areaNameById.get(booking.exam_area_id) : undefined,
      booking.service_id ? serviceNameById.get(booking.service_id) : undefined,
    ].filter((v): v is string => Boolean(v));
    return parts.length > 0 ? parts.join(" · ") : "—";
  }

  function resetFilters() {
    setSearch("");
    setStatus("");
    setGateway("");
    setReconcile("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  /**
   * Xuất Excel TOÀN BỘ dòng khớp bộ lọc hiện tại (không chỉ trang đang xem) —
   * dùng `filterParams` y như danh sách. Không đưa vào react-query: đây là một
   * hành động tải file, không phải server state cần cache/invalidate.
   */
  const exportExcel = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { blob, filename, totalRows } = await appointmentBookingPaymentsService.exportList(filterParams);
      downloadBlob(blob, filename ?? `thanh-toan-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(
        totalRows === null
          ? "Đã xuất danh sách thanh toán"
          : `Đã xuất ${totalRows.toLocaleString("vi-VN")} giao dịch`,
      );
    } catch (error) {
      // ApiError đã mang message tiếng Việt của BE (sai định dạng ngày, trạng
      // thái đối soát không hợp lệ, hoặc vượt giới hạn 20.000 dòng/lần xuất).
      toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại");
    } finally {
      setIsExporting(false);
    }
  }, [filterParams, isExporting]);

  return {
    rows,
    isLoading,
    page,
    setPage,
    total,
    totalPages,
    // filters
    search,
    setSearch,
    status,
    setStatus,
    gateway,
    setGateway,
    reconcile,
    setReconcile,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    resetFilters,
    // export
    exportExcel,
    isExporting,
    // enrich
    getDescription,
  };
}

export type PaymentListController = ReturnType<typeof usePaymentList>;
