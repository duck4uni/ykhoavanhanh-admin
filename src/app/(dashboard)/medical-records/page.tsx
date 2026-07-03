"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  medicalRecordsHooks,
  useMedicalRecordStats,
  type MedicalRecord,
} from "@/api/medicalRecordsApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import {
  FiFileText,
  FiCalendar,
  FiCreditCard,
  FiClock,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiEye,
  FiArrowUpRight,
  FiArrowDownRight,
} from "react-icons/fi";

const PAGE_SIZE = 10;

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  PAID: { label: "Đã thanh toán", className: "bg-success-light text-success" },
  UNPAID: { label: "Chờ thanh toán", className: "bg-warning-light text-warning" },
  PARTIAL: { label: "Thanh toán 1 phần", className: "bg-primary-100 text-primary-600" },
};

function toNumber(v: string | number | null): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const { data, isLoading } = medicalRecordsHooks.useList({
    page,
    pageSize: PAGE_SIZE,
    sortField: "examined_at",
    sortOrder: "DESC",
    ...(paymentStatus ? { payment_status: paymentStatus } : {}),
  });

  const { data: stats } = useMedicalRecordStats();
  const { data: specialtiesData } = specialtiesHooks.useList();
  const specialties = specialtiesData?.rows ?? [];

  const serverRows = useMemo(() => data?.rows ?? [], [data]);
  const totalItems = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Lọc client-side: từ khóa, khoảng ngày, chuyên khoa (API list chưa hỗ trợ)
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return serverRows.filter((r) => {
      const matchQuery =
        !q ||
        (r.patient?.patient_full_name ?? "").toLowerCase().includes(q) ||
        (r.record_code ?? "").toLowerCase().includes(q);
      const day = r.examined_at?.slice(0, 10) ?? "";
      const matchFrom = !fromDate || day >= fromDate;
      const matchTo = !toDate || day <= toDate;
      const matchSpecialty = !specialtyId || r.specialty_id === specialtyId;
      return matchQuery && matchFrom && matchTo && matchSpecialty;
    });
  }, [serverRows, search, fromDate, toDate, specialtyId]);

  const resetFilters = () => {
    setSearch("");
    setSpecialtyId("");
    setPaymentStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const monthUp = (stats?.monthChangePercent ?? 0) >= 0;

  const statCards = [
    {
      label: "Tổng hồ sơ",
      value: stats ? stats.totalRecords.toLocaleString("vi-VN") : "—",
      sub: "Tất cả thời gian",
      icon: FiFileText,
      tone: "bg-primary-100 text-primary-600",
      delta: undefined as string | undefined,
      deltaUp: true,
    },
    {
      label: "Hồ sơ tháng này",
      value: stats ? stats.thisMonthCount.toLocaleString("vi-VN") : "—",
      sub: "So với tháng trước",
      icon: FiCalendar,
      tone: "bg-success-light text-success",
      delta: stats ? `${Math.abs(stats.monthChangePercent)}%` : undefined,
      deltaUp: monthUp,
    },
    {
      label: "Tổng chi phí",
      value: stats ? formatCurrency(stats.totalCost) : "—",
      sub: "Tất cả thời gian",
      icon: FiCreditCard,
      tone: "bg-warning-light text-warning",
      delta: undefined,
      deltaUp: true,
    },
    {
      label: "Lần khám gần nhất",
      value: stats?.lastVisitAt ? formatDate(stats.lastVisitAt) : "—",
      sub: stats?.lastVisitAt ? formatDateTime(stats.lastVisitAt) : "Chưa có dữ liệu",
      icon: FiClock,
      tone: "bg-purple-100 text-purple-600",
      delta: undefined,
      deltaUp: true,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hồ sơ bệnh án</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lịch sử khám bệnh của bệnh nhân</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FiDownload className="h-4 w-4" /> Xuất Excel
          </Button>
          <Link href="/medical-records/new">
            <Button variant="primary" className="gap-2">
              <FiPlus className="h-4 w-4" /> Tạo hồ sơ
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground">
                    {s.value}
                    {s.delta && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${s.deltaUp ? "text-success" : "text-error"}`}>
                        {s.deltaUp ? <FiArrowUpRight className="h-3.5 w-3.5" /> : <FiArrowDownRight className="h-3.5 w-3.5" />}
                        {s.delta}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bệnh nhân / mã hồ sơ"
                className="h-11 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Chuyên khoa</label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="">Tất cả chuyên khoa</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Thanh toán</label>
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="">Tất cả</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="UNPAID">Chờ thanh toán</option>
              <option value="PARTIAL">Thanh toán 1 phần</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" className="h-11 gap-2 rounded-xl" onClick={() => setPage(1)}>
              <FiFilter className="h-4 w-4" /> Lọc
            </Button>
            <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={resetFilters}>
              <FiRefreshCw className="h-4 w-4" /> Đặt lại
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
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
                    <th className="px-5 py-3.5">Chi phí</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: MedicalRecord) => {
                    const badge = PAYMENT_BADGE[r.payment_status] ?? {
                      label: r.payment_status || "—",
                      className: "bg-surface-secondary text-muted-foreground",
                    };
                    return (
                      <tr key={r.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                        <td className="px-5 py-4 font-medium text-primary-600">{r.record_code}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">{r.patient?.patient_full_name ?? "—"}</p>
                          {r.patient?.phone_number && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{r.patient.phone_number}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-foreground">{r.doctor?.doctor_name ?? "—"}</td>
                        <td className="px-5 py-4 text-muted-foreground">{r.specialty?.name ?? "—"}</td>
                        <td className="px-5 py-4">
                          <p className="text-foreground">{formatDate(r.examined_at)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(r.examined_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="max-w-xs px-5 py-4 text-muted-foreground">
                          <p className="truncate">{r.diagnosis ?? "—"}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-foreground">{formatCurrency(toNumber(r.total_amount))}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Link href={`/medical-records/${r.id}`}>
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
                      <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
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
                onPageChange={setPage}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
