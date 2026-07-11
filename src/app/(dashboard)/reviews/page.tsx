"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { appointmentReviewsHooks, type AppointmentReview } from "@/api/appointmentReviewsApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useApiHelpers";
import {
  Star,
  MessageSquare,
  Clock,
  Frown,
  Reply,
  Search,
  RotateCcw,
  Download,
  FileBarChart,
  MoreVertical,
  UserRound,
} from "lucide-react";

const PAGE_SIZE = 10;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts[0]?.[0] ?? "";
  return (parts.length === 1 ? first : `${last}${first}`).toUpperCase().slice(0, 2);
}

/** Che số điện thoại: 0901234567 → 09xx xxx 567 */
function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 2)}xx xxx ${digits.slice(-3)}`;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`size-4 ${
              s <= value ? "text-accent-400 fill-accent-400" : "text-slate-200 fill-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="ml-1 text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentReview["status"] }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
        Hiển thị
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full bg-error-light px-2.5 py-1 text-xs font-medium text-error">
        Từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-warning-light px-2.5 py-1 text-xs font-medium text-warning">
      Chờ duyệt
    </span>
  );
}

function ReplyCell({ review }: { review: AppointmentReview }) {
  if (review.admin_reply) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <Reply className="size-3.5" /> Đã phản hồi
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {review.admin_replied_at ? formatDate(review.admin_replied_at) : "—"}
        </p>
      </div>
    );
  }
  if (review.status === "PENDING") {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
          <Clock className="size-3.5" /> Cần xử lý
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">—</p>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">Chưa phản hồi</span>;
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  sub: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

function StatCard({ label, value, sub, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Bộ lọc phía server theo nội dung nhận xét: filters=comment@=<giá trị>
  const serverFilters = debouncedSearch.trim()
    ? `comment@=${debouncedSearch.trim()}`
    : undefined;

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce) thay đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = appointmentReviewsHooks.useList({
    page,
    pageSize: PAGE_SIZE,
    sortField: "created_at",
    sortOrder: "DESC",
    filters: serverFilters,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(doctorFilter ? { doctor_id: doctorFilter } : {}),
    ...(areaFilter ? { exam_area_id: areaFilter } : {}),
    ...(ratingFilter ? { min_rating: Number(ratingFilter), max_rating: Number(ratingFilter) } : {}),
  });

  const { data: doctors } = doctorsHooks.useList();
  const doctorList = doctors ?? [];
  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];

  const serverRows = useMemo(() => data?.rows ?? [], [data]);

  // Tìm kiếm theo nội dung nhận xét đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
  const rows = useMemo(() => {
    return serverRows.filter((r) => {
      const created = r.created_at?.slice(0, 10) ?? "";
      const matchFrom = !fromDate || created >= fromDate;
      const matchTo = !toDate || created <= toDate;
      return matchFrom && matchTo;
    });
  }, [serverRows, fromDate, toDate]);

  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.count ?? 0;

  // Stats từ trang hiện tại (API chưa có endpoint tổng hợp riêng)
  const avgRating =
    serverRows.length > 0
      ? (serverRows.reduce((s, r) => s + r.overall_rating, 0) / serverRows.length).toFixed(1)
      : "0";
  const pendingCount = serverRows.filter((r) => r.status === "PENDING").length;
  const lowRatingCount = serverRows.filter((r) => r.overall_rating <= 2).length;
  const repliedCount = serverRows.filter((r) => r.admin_reply).length;

  function resetFilters() {
    setSearch("");
    setRatingFilter("");
    setStatusFilter("");
    setDoctorFilter("");
    setAreaFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  const selectCls =
    "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";
  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đánh giá</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý đánh giá lịch khám, phản hồi bệnh nhân và kiểm duyệt hiển thị.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <Download className="h-4 w-4" /> Xuất Excel
          </button> */}
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <FileBarChart className="h-4 w-4" /> Báo cáo đánh giá
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Tổng đánh giá"
          value={totalItems}
          sub="đánh giá"
          icon={MessageSquare}
          tone="bg-primary-100 text-primary-600"
        />
        <StatCard
          label="Điểm trung bình"
          value={`${avgRating} / 5`}
          sub={<StarRating value={Math.round(Number(avgRating))} />}
          icon={Star}
          tone="bg-accent-light text-accent-600"
        />
        <StatCard
          label="Chờ duyệt"
          value={pendingCount}
          sub="đánh giá"
          icon={Clock}
          tone="bg-warning-light text-warning"
        />
        <StatCard
          label="Đánh giá thấp (1-2 sao)"
          value={lowRatingCount}
          sub="cần xử lý"
          icon={Frown}
          tone="bg-error-light text-error"
        />
        <StatCard
          label="Đã phản hồi"
          value={repliedCount}
          sub="đánh giá"
          icon={Reply}
          tone="bg-success-light text-success"
        />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung nhận xét..."
              className={`${inputCls} pl-10`}
            />
          </div>

          <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Số sao: Tất cả</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} sao</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Trạng thái: Tất cả</option>
            <option value="APPROVED">Hiển thị</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>

          <select value={doctorFilter} onChange={(e) => { setDoctorFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Bác sĩ: Tất cả</option>
            {doctorList.map((d) => (
              <option key={d.id} value={d.id}>{d.doctorname}</option>
            ))}
          </select>

          <select value={areaFilter} onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Khu khám: Tất cả</option>
            {examAreas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${selectCls} xl:w-40`} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${selectCls} xl:w-40`} />

          <button
            onClick={resetFilters}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
          >
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải đánh giá..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3.5">Bệnh nhân</th>
                    <th className="px-6 py-3.5">Bác sĩ</th>
                    <th className="px-6 py-3.5">Khu khám</th>
                    <th className="px-6 py-3.5">Đánh giá</th>
                    <th className="px-6 py-3.5">Nhận xét</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5">Phản hồi</th>
                    <th className="px-6 py-3.5">Ngày</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        Không tìm thấy đánh giá phù hợp.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const name = r.is_anonymous ? "Ẩn danh" : r.patient?.patient_full_name ?? "—";
                      return (
                        <tr key={r.id} className="text-sm transition-colors hover:bg-slate-50/60">
                          {/* Bệnh nhân */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">
                                {r.is_anonymous ? <UserRound className="h-4 w-4" /> : initials(name)}
                              </div>
                              <div className="min-w-0">
                                {r.is_anonymous ? (
                                  <>
                                    <p className="font-semibold text-slate-800">Ẩn danh</p>
                                    <p className="text-xs text-muted-foreground">Không công khai thông tin</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-semibold text-slate-800">{name}</p>
                                    <p className="text-xs text-muted-foreground">SĐT: {maskPhone(r.patient?.phone_number)}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Bác sĩ */}
                          <td className="px-6 py-4 text-slate-700">{r.doctor?.doctor_name ?? "—"}</td>
                          {/* Khu khám */}
                          <td className="px-6 py-4 text-slate-600">{r.exam_area?.name ?? "—"}</td>
                          {/* Đánh giá */}
                          <td className="px-6 py-4"><StarRating value={r.overall_rating} /></td>
                          {/* Nhận xét */}
                          <td className="px-6 py-4">
                            <p className="max-w-[220px] truncate text-slate-600">{r.comment ?? "—"}</p>
                          </td>
                          {/* Trạng thái */}
                          <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                          {/* Phản hồi */}
                          <td className="px-6 py-4"><ReplyCell review={r} /></td>
                          {/* Ngày */}
                          <td className="px-6 py-4 text-slate-600">{formatDate(r.created_at)}</td>
                          {/* Thao tác */}
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/reviews/${r.id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              aria-label="Chi tiết"
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
      </div>
    </div>
  );
}
