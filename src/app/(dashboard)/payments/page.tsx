"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TablePagination } from "@/components/ui/TablePagination";
import { mockPayments } from "@/mock-data/payments";
import { Payment } from "@/types/payment";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Banknote,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  MoreVertical,
  Landmark,
  ReceiptText,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

const PAGE_SIZE = 10;

const statusLabels: Record<Payment["status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
  expired: "Hết hạn",
};

const methodLabels: Record<Payment["method"], string> = {
  vcb_qr: "QR VCB",
  vcb_transfer: "Chuyển khoản VCB",
  vcb_card: "Thẻ VCB",
  cash: "Tiền mặt",
};

const patientPhones: Record<string, string> = {
  p001: "0901 234 567",
  p002: "0934 567 890",
  p003: "0912 345 678",
  p004: "0987 654 321",
  p005: "0963 852 741",
  p006: "0908 741 852",
  p008: "0911 222 333",
  p010: "0903 444 555",
};

function getStatusBadge(status: Payment["status"]) {
  switch (status) {
    case "paid":
      return "bg-success-light text-success";
    case "pending":
      return "bg-warning-light text-warning";
    case "refunded":
      return "bg-primary-100 text-primary-600";
    case "failed":
      return "bg-error-light text-error";
    default:
      return "bg-surface-secondary text-muted-foreground";
  }
}

function getMethodMeta(method: Payment["method"]) {
  if (method === "cash") {
    return { icon: Banknote, className: "bg-success-light text-success" };
  }
  if (method === "vcb_transfer" || method === "vcb_card") {
    return { icon: Landmark, className: "bg-primary-100 text-primary-600" };
  }
  return { icon: ReceiptText, className: "bg-success-light text-success" };
}

function getReconcileMeta(payment: Payment) {
  if (payment.status === "paid" || payment.status === "refunded") {
    return { label: "Đã đối soát", className: "bg-success-light text-success" };
  }
  return { label: "Chưa đối soát", className: "bg-surface-secondary text-muted-foreground" };
}

export default function PaymentsPage() {
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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = mockPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidPayments = mockPayments.filter((p) => p.status === "paid");
  const pendingPayments = mockPayments.filter((p) => p.status === "pending");
  const refundedPayments = mockPayments.filter((p) => p.status === "refunded");
  const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const refundedAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    {
      label: "Tổng doanh thu",
      value: formatCurrency(totalRevenue),
      sub: `${mockPayments.length} giao dịch`,
      icon: ReceiptText,
      tone: "bg-primary-100 text-primary-600",
    },
    {
      label: "Đã thanh toán",
      value: `${paidPayments.length} giao dịch`,
      sub: formatCurrency(paidAmount),
      icon: CheckCircle2,
      tone: "bg-success-light text-success",
    },
    {
      label: "Chờ thanh toán",
      value: `${pendingPayments.length} giao dịch`,
      sub: formatCurrency(pendingAmount),
      icon: Clock,
      tone: "bg-warning-light text-warning",
    },
    {
      label: "Đã hoàn tiền",
      value: `${refundedPayments.length} giao dịch`,
      sub: formatCurrency(refundedAmount),
      icon: RotateCcw,
      tone: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thanh toán</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý giao dịch thanh toán, đối soát và hoàn tiền
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary">
            <RefreshCw className="h-4 w-4" /> Đối soát VCB
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary">
            <Download className="h-4 w-4" /> Xuất Excel
          </button> */}
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tạo thanh toán
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{s.value}</p>
                  <p className={`mt-0.5 text-xs font-medium ${s.tone.includes("success") ? "text-success" : s.tone.includes("warning") ? "text-warning" : s.tone.includes("purple") ? "text-purple-600" : "text-muted-foreground"}`}>
                    {s.sub}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã TT, bệnh nhân, SĐT, mã phiếu khám..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "all" | Payment["status"]);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 xl:w-40"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="refunded">Đã hoàn tiền</option>
            <option value="failed">Thất bại</option>
            <option value="expired">Hết hạn</option>
          </select>

          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value as "all" | Payment["method"]);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 xl:w-40"
          >
            <option value="all">Phương thức: Tất cả</option>
            <option value="vcb_qr">QR VCB</option>
            <option value="vcb_transfer">Chuyển khoản VCB</option>
            <option value="vcb_card">Thẻ VCB</option>
            <option value="cash">Tiền mặt</option>
          </select>

          <div className="relative xl:w-40">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          <div className="relative xl:w-40">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50">
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc nâng cao
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3.5">Mã thanh toán</th>
                <th className="px-5 py-3.5">Mã phiếu khám</th>
                <th className="px-5 py-3.5">Bệnh nhân</th>
                <th className="px-5 py-3.5">Mô tả</th>
                <th className="px-5 py-3.5">Số tiền</th>
                <th className="px-5 py-3.5">Phương thức</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Đối soát</th>
                <th className="px-5 py-3.5">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Không tìm thấy giao dịch phù hợp.
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const methodMeta = getMethodMeta(p.method);
                  const MethodIcon = methodMeta.icon;
                  const reconcile = getReconcileMeta(p);
                  return (
                    <tr key={p.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-mono font-semibold text-primary-600">{p.code}</td>
                      <td className="px-5 py-4 font-mono text-slate-600">{p.appointmentId ?? "—"}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{p.patientName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{patientPhones[p.patientId] ?? "—"}</p>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">{p.description}</td>
                      <td className="px-5 py-4 font-bold text-foreground">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${methodMeta.className}`}>
                            <MethodIcon className="h-3.5 w-3.5" />
                          </span>
                          {methodLabels[p.method]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(p.status)}`}>
                          {statusLabels[p.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${reconcile.className}`}>
                          {reconcile.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDateTime(p.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/payments/${p.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary"
                          title="Chi tiết"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      </div>
    </div>
  );
}
