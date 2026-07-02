"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Spinner";
import { useDashboardStats, useTicketRatios } from "@/api/dashboardApi";
import {
  FiDollarSign,
  FiCalendar,
  FiActivity,
  FiClock,
  FiXCircle,
  FiUsers,
  FiStar,
  FiCheckCircle,
  FiInfo,
  FiArrowUpRight,
  FiArrowDownRight,
  FiAlertTriangle,
  FiCreditCard,
  FiUser,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

const RANGE_OPTIONS = [
  { key: "today", label: "Hôm nay" },
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
] as const;

// ─── Mock series (không có endpoint tương ứng ở backend) ─────────────────────
const revenueByDay = [
  { date: "12/05", value: 62_000_000 },
  { date: "13/05", value: 78_000_000 },
  { date: "14/05", value: 118_000_000 },
  { date: "15/05", value: 92_000_000 },
  { date: "16/05", value: 110_000_000 },
  { date: "17/05", value: 104_000_000 },
  { date: "18/05", value: 126_450_000 },
];

const recentAppointments = [
  { time: "18/05/2025 14:30", patient: "Nguyễn Văn An", doctor: "BS. Trần Minh Đức", specialty: "Tim mạch", status: "confirmed" },
  { time: "18/05/2025 15:00", patient: "Trần Thị Bích Ngọc", doctor: "BS. Lê Hoàng Nam", specialty: "Nội tổng quát", status: "pending" },
  { time: "18/05/2025 15:30", patient: "Phạm Quốc Huy", doctor: "BS. Nguyễn Thu Hà", specialty: "Nhi khoa", status: "confirmed" },
  { time: "18/05/2025 16:00", patient: "Lê Thị Kim Oanh", doctor: "BS. Phạm Văn Tú", specialty: "Sản phụ khoa", status: "waiting_payment" },
  { time: "18/05/2025 16:30", patient: "Đỗ Minh Khang", doctor: "BS. Võ Thị Mai", specialty: "Tai mũi họng", status: "confirmed" },
];

const systemActivities = [
  {
    icon: FiAlertTriangle,
    tone: "text-error bg-error-light",
    title: "Cảnh báo: Hết hạn giấy phép hành nghề",
    desc: "BS. Nguyễn Văn A - Số giấy phép 12345 sẽ hết hạn sau 7 ngày",
    time: "14:45",
  },
  {
    icon: FiInfo,
    tone: "text-primary-600 bg-primary-100",
    title: "Sao lưu dữ liệu thành công",
    desc: "Dữ liệu hệ thống đã được sao lưu an toàn",
    time: "14:30",
  },
  {
    icon: FiCreditCard,
    tone: "text-warning bg-warning-light",
    title: "Kết nối thanh toán chậm",
    desc: "Cổng thanh toán VNPay đang phản hồi chậm",
    time: "14:15",
  },
  {
    icon: FiCheckCircle,
    tone: "text-success bg-success-light",
    title: "Cập nhật hệ thống thành công",
    desc: "Phiên bản 2.3.1 đã được cập nhật",
    time: "13:50",
  },
];

// Màu cho donut theo trạng thái phiếu
const DONUT_COLORS = ["#1A6BBF", "#F5B942", "#E5484D", "#B39DDB"];

// ─── Small components ────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  delta?: { value: string; up: boolean };
  footer?: React.ReactNode;
}

function KpiCard({ title, value, icon: Icon, iconBg, delta, footer }: KpiCardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="truncate">{title}</span>
            <FiInfo className="h-3.5 w-3.5 flex-shrink-0 text-text-disabled" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {delta && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${delta.up ? "text-success" : "text-error"}`}>
              {delta.up ? <FiArrowUpRight className="h-3.5 w-3.5" /> : <FiArrowDownRight className="h-3.5 w-3.5" />}
              {delta.value} so với hôm qua
            </p>
          )}
        </div>
      </div>
      {footer && (
        <div className="mt-4 rounded-lg bg-surface-secondary px-3 py-2 text-center text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Đã xác nhận", className: "bg-success-light text-success" },
  pending: { label: "Chờ xác nhận", className: "bg-warning-light text-warning" },
  waiting_payment: { label: "Chờ thanh toán", className: "bg-primary-100 text-primary-600" },
  cancelled: { label: "Đã hủy", className: "bg-error-light text-error" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function RangeToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-surface-secondary p-1">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.key
              ? "bg-white text-primary-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
      <button
        type="button"
        className="rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground"
        aria-label="Chọn ngày"
      >
        <FiCalendar className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange] = useState<string>("today");
  const [revenueRange, setRevenueRange] = useState<string>("7d");
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: ratios, isLoading: ratiosLoading } = useTicketRatios();

  const confirmationRatio =
    stats && stats.totalTickets > 0
      ? ((stats.paidTickets / stats.totalTickets) * 100).toFixed(1)
      : "0";

  const paidRatio =
    stats && stats.totalTickets > 0
      ? ((stats.paidTickets / stats.totalTickets) * 100).toFixed(1)
      : "0";

  // Số phiếu chờ xác nhận lấy từ ticket-ratios nếu có
  const pendingRatio = useMemo(() => {
    if (!ratios) return null;
    return ratios.find((r) =>
      /chờ|pending|wait/i.test(r.ticketStatus)
    );
  }, [ratios]);

  const donutData = useMemo(() => {
    if (ratios && ratios.length > 0) {
      return ratios.map((r) => ({ name: r.ticketStatus, value: r.totalCount, percent: r.ratioPercent }));
    }
    return [];
  }, [ratios]);

  const totalTicketsForDonut = donutData.reduce((sum, d) => sum + d.value, 0);

  if (statsLoading || ratiosLoading) {
    return (
      <div className="p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner text="Đang tải thống kê..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bảng điều khiển</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng quan hoạt động đặt khám, thanh toán và vận hành hệ thống Bệnh viện Vạn Hạnh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeToggle value={range} onChange={setRange} />
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm"
          >
            <span className="text-muted-foreground">Chi nhánh:</span>
            <span className="font-medium">Tất cả</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng doanh thu"
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          icon={FiDollarSign}
          iconBg="bg-success"
          delta={{ value: "12,5%", up: true }}
          footer={`Hôm qua: ${stats ? formatCurrency(stats.totalRevenue * 0.89) : "—"}`}
        />
        <KpiCard
          title="Tổng phiếu khám"
          value={stats ? formatNumber(stats.totalTickets) : "—"}
          icon={FiCalendar}
          iconBg="bg-primary-600"
          delta={{ value: "8,3%", up: true }}
          footer={`Hôm qua: ${stats ? formatNumber(Math.round(stats.totalTickets * 0.92)) : "—"}`}
        />
        <KpiCard
          title="Phiếu đã thanh toán"
          value={stats ? formatNumber(stats.paidTickets) : "—"}
          icon={FiActivity}
          iconBg="bg-secondary-500"
          delta={{ value: "9,7%", up: true }}
          footer={`Tỷ lệ: ${paidRatio}%`}
        />
        <KpiCard
          title="Phiếu chờ xác nhận"
          value={pendingRatio ? formatNumber(pendingRatio.totalCount) : "—"}
          icon={FiClock}
          iconBg="bg-accent-500"
          delta={{ value: "4,5%", up: false }}
          footer={pendingRatio ? `Tỷ lệ: ${pendingRatio.ratioPercent}%` : "Tỷ lệ: —"}
        />
        <KpiCard
          title="Phiếu đã hủy"
          value={stats ? formatNumber(stats.cancelledTickets) : "—"}
          icon={FiXCircle}
          iconBg="bg-error"
          delta={{ value: "14,3%", up: false }}
        />
        <KpiCard
          title="Tổng bác sĩ"
          value={stats ? formatNumber(stats.totalDoctors) : "—"}
          icon={FiUsers}
          iconBg="bg-purple-500"
          delta={{ value: "5 bác sĩ mới", up: true }}
        />
        <KpiCard
          title="Đánh giá trung bình"
          value={stats ? `${stats.avgRating.toFixed(1)}/5` : "—"}
          icon={FiStar}
          iconBg="bg-accent-400"
          footer={
            <span className="flex items-center justify-center gap-1 text-accent-600">
              {"★★★★★"} <span className="text-muted-foreground">{stats ? formatNumber(stats.totalReviews) : 0} đánh giá</span>
            </span>
          }
        />
        <KpiCard
          title="Tỷ lệ xác nhận"
          value={`${confirmationRatio}%`}
          icon={FiCheckCircle}
          iconBg="bg-success"
          delta={{ value: "3,6%", up: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue bar chart */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Doanh thu theo ngày</h2>
            <select
              value={revenueRange}
              onChange={(e) => setRevenueRange(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
            >
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByDay} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#627D98" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#627D98" }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Doanh thu"]}
                cursor={{ fill: "rgba(11,92,173,0.06)" }}
              />
              <Bar dataKey="value" name="Doanh thu (đồng)" radius={[6, 6, 0, 0]}>
                {revenueByDay.map((entry, index) => (
                  <Cell
                    key={entry.date}
                    fill={index === revenueByDay.length - 1 ? "#0B5CAD" : "#B3D1EF"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary-300" /> Doanh thu (đồng)
          </p>
        </Card>

        {/* Ticket status donut */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tỷ lệ trạng thái phiếu khám</h2>
            <span className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-muted-foreground">
              7 ngày
            </span>
          </div>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative h-[220px] w-[220px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${formatNumber(Number(v))} phiếu`, n as string]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{formatNumber(totalTicketsForDonut)}</span>
                  <span className="text-xs text-muted-foreground">Tổng phiếu</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {donutData.map((d, index) => (
                  <div key={d.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {d.percent}% <span className="text-muted-foreground">({formatNumber(d.value)})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu</p>
          )}
        </Card>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent appointments */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lịch hẹn mới nhất</h2>
            <button className="text-sm font-medium text-primary-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Thời gian</th>
                  <th className="pb-2 pr-3 font-medium">Bệnh nhân</th>
                  <th className="pb-2 pr-3 font-medium">Bác sĩ</th>
                  <th className="pb-2 pr-3 font-medium">Chuyên khoa</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-muted-foreground">{a.time}</td>
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <FiUser className="h-3.5 w-3.5 text-text-disabled" />
                        {a.patient}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-foreground">{a.doctor}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{a.specialty}</td>
                    <td className="py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* System activity */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Hoạt động hệ thống</h2>
            <button className="text-sm font-medium text-primary-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-1">
            {systemActivities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-secondary">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${act.tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{act.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{act.desc}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">{act.time}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
