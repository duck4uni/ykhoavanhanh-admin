import { useMemo, useState } from "react";
import { mockPayments } from "@/mock-data/payments";
import type { Payment } from "@/types/payment";
import { PAYMENTS_PAGE_SIZE, patientPhones } from "../helpers";

/** State + dữ liệu cho trang danh sách thanh toán. */
export function usePaymentList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Payment["status"]>("all");
  const [method, setMethod] = useState<"all" | Payment["method"]>("all");
  const [fromDate, setFromDate] = useState("2024-07-01");
  const [toDate, setToDate] = useState("2024-07-31");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockPayments.filter((p) => {
      const phone = patientPhones[p.patientId] ?? "";
      const matchQuery =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        (p.appointmentId ?? "").toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      const matchStatus = status === "all" || p.status === status;
      const matchMethod = method === "all" || p.method === method;
      return matchQuery && matchStatus && matchMethod;
    });
  }, [search, status, method]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAYMENTS_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAYMENTS_PAGE_SIZE, page * PAYMENTS_PAGE_SIZE);

  const totalRevenue = mockPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidPayments = mockPayments.filter((p) => p.status === "paid");
  const pendingPayments = mockPayments.filter((p) => p.status === "pending");
  const refundedPayments = mockPayments.filter((p) => p.status === "refunded");
  const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const refundedAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    page,
    setPage,
    total,
    totalPages,
    paged,
    // filters
    search,
    setSearch,
    status,
    setStatus,
    method,
    setMethod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    // stats
    stats: {
      totalRevenue,
      transactionCount: mockPayments.length,
      paidCount: paidPayments.length,
      paidAmount,
      pendingCount: pendingPayments.length,
      pendingAmount,
      refundedCount: refundedPayments.length,
      refundedAmount,
    },
  };
}

export type PaymentListController = ReturnType<typeof usePaymentList>;
