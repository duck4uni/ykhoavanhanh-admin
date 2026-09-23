import { useEffect, useMemo, useState } from "react";
import { appointmentBookingPaymentsHooks } from "@/api/appointmentBookingPaymentsApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import { useDebounce } from "@/hooks/useApiHelpers";
import { PAYMENTS_PAGE_SIZE } from "../helpers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PaymentStatusFilter = "" | "PENDING" | "PAID";
export type PaymentGatewayFilter = "" | "MOMO" | "VCB";

/** State + dữ liệu cho trang danh sách thanh toán (nối API thật). */
export function usePaymentList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatusFilter>("");
  const [gateway, setGateway] = useState<PaymentGatewayFilter>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, gateway, fromDate, toDate]);

  // Bẫy BE: nếu `filters` không có mệnh đề payment_status, BE tự mặc định
  // payment_status=='PAID'. Vì vậy luôn gửi tường minh — "Tất cả" phải dùng
  // cú pháp OR (|) chứ không phải bỏ trống điều kiện.
  const searchTerm = debouncedSearch.trim();
  const isBookingIdSearch = UUID_RE.test(searchTerm);

  const filterClauses: string[] = [`payment_status==${status || "PENDING|PAID"}`];
  if (searchTerm && !isBookingIdSearch) {
    filterClauses.push(`transaction_id@=${searchTerm}`);
  }
  const serverFilters = filterClauses.join(",");

  const { data, isLoading } = appointmentBookingPaymentsHooks.useList({
    currentPage: page,
    pageSize: PAYMENTS_PAGE_SIZE,
    filters: serverFilters,
    ...(gateway ? { payment_gateway: gateway } : {}),
    ...(searchTerm && isBookingIdSearch ? { booking_id: searchTerm } : {}),
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
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
    setFromDate("");
    setToDate("");
    setPage(1);
  }

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
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    resetFilters,
    // enrich
    getDescription,
  };
}

export type PaymentListController = ReturnType<typeof usePaymentList>;
