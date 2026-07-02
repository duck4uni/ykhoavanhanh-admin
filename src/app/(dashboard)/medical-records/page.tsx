"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatCurrency } from "@/lib/utils";
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
} from "react-icons/fi";

const PAGE_SIZE = 10;

// ─── Mock dữ liệu hiển thị (chưa có endpoint backend cho hồ sơ bệnh án) ──────
type RecordStatus = "paid" | "waiting_payment" | "free";

interface MedicalRecordRow {
  code: string;
  patientName: string;
  birthYear: number;
  gender: "Nam" | "Nữ";
  doctorName: string;
  specialtyName: string;
  visitDate: string;
  visitTime: string;
  diagnosis: string;
  cost: number;
  status: RecordStatus;
}

const MOCK_RECORDS: MedicalRecordRow[] = [
  { code: "HS0002458", patientName: "Nguyễn Thị Lan", birthYear: 1988, gender: "Nữ", doctorName: "BS. Trần Văn An", specialtyName: "Tim mạch", visitDate: "10/07/2024", visitTime: "10:45", diagnosis: "Tăng huyết áp độ II, không rõ nguyên nhân", cost: 350000, status: "paid" },
  { code: "HS0002457", patientName: "Lê Minh Tuấn", birthYear: 1992, gender: "Nam", doctorName: "BS. Phạm Thu Hà", specialtyName: "Nội tổng quát", visitDate: "09/07/2024", visitTime: "09:20", diagnosis: "Viêm họng cấp", cost: 200000, status: "waiting_payment" },
  { code: "HS0002456", patientName: "Trần Thị Mai", birthYear: 1975, gender: "Nữ", doctorName: "BS. Lê Quốc Hưng", specialtyName: "Cơ xương khớp", visitDate: "08/07/2024", visitTime: "14:30", diagnosis: "Đau lưng cấp", cost: 300000, status: "paid" },
  { code: "HS0002455", patientName: "Phạm Văn Hòa", birthYear: 1965, gender: "Nam", doctorName: "BS. Nguyễn Thu Trang", specialtyName: "Tiêu hóa", visitDate: "07/07/2024", visitTime: "11:00", diagnosis: "Viêm dạ dày – tá tràng", cost: 250000, status: "waiting_payment" },
  { code: "HS0002454", patientName: "Đặng Thị Hằng", birthYear: 1990, gender: "Nữ", doctorName: "BS. Hoàng Minh Đức", specialtyName: "Sản phụ khoa", visitDate: "06/07/2024", visitTime: "15:15", diagnosis: "Khám thai định kỳ", cost: 0, status: "free" },
];

const STATS = [
  { label: "Tổng hồ sơ", value: "2.458", sub: "Tất cả thời gian", icon: FiFileText, tone: "bg-primary-100 text-primary-600" },
  { label: "Hồ sơ tháng này", value: "186", sub: "So với tháng trước", delta: "12.5%", icon: FiCalendar, tone: "bg-success-light text-success" },
  { label: "Tổng chi phí", value: "1.245.800.000 đ", sub: "Tất cả thời gian", icon: FiCreditCard, tone: "bg-warning-light text-warning" },
  { label: "Lần khám gần nhất", value: "10/07/2024", sub: "10:45 – Hôm nay", icon: FiClock, tone: "bg-purple-100 text-purple-600" },
];

const STATUS_BADGE: Record<RecordStatus, { label: string; className: string }> = {
  paid: { label: "Đã thanh toán", className: "bg-success-light text-success" },
  waiting_payment: { label: "Chờ thanh toán", className: "bg-warning-light text-warning" },
  free: { label: "Miễn phí", className: "bg-primary-100 text-primary-600" },
};

const SPECIALTIES = ["Tất cả chuyên khoa", "Tim mạch", "Nội tổng quát", "Cơ xương khớp", "Tiêu hóa", "Sản phụ khoa"];

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("2024-07-01");
  const [toDate, setToDate] = useState("2024-07-10");
  const [specialty, setSpecialty] = useState("Tất cả chuyên khoa");

  const filtered = useMemo(() => {
    return MOCK_RECORDS.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchQuery = !q || r.patientName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
      const matchSpecialty = specialty === "Tất cả chuyên khoa" || r.specialtyName === specialty;
      return matchQuery && matchSpecialty;
    });
  }, [search, specialty]);

  const total = 186; // tổng theo thiết kế
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setSpecialty("Tất cả chuyên khoa");
    setFromDate("2024-07-01");
    setToDate("2024-07-10");
    setPage(1);
  };

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
          <Button variant="primary" className="gap-2">
            <FiPlus className="h-4 w-4" /> Tạo hồ sơ
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
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
                      <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                        <FiArrowUpRight className="h-3.5 w-3.5" />
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
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
              {paged.map((r) => {
                const badge = STATUS_BADGE[r.status];
                return (
                  <tr key={r.code} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                    <td className="px-5 py-4 font-medium text-primary-600">{r.code}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{r.patientName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.birthYear} • {r.gender}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-foreground">{r.doctorName}</td>
                    <td className="px-5 py-4 text-muted-foreground">{r.specialtyName}</td>
                    <td className="px-5 py-4">
                      <p className="text-foreground">{r.visitDate}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.visitTime}</p>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-muted-foreground">{r.diagnosis}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{formatCurrency(r.cost)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link href={`/medical-records/${r.code}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-primary-600">
                          <FiEye className="h-3.5 w-3.5" /> Xem chi tiết
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
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
            totalPages={Math.ceil(total / PAGE_SIZE)}
            onPageChange={setPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      </Card>
    </div>
  );
}
