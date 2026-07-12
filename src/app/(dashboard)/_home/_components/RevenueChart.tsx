import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Spinner";
import { formatChartDate, formatCurrency, formatRevenueTick } from "../types";
import type { DashboardController } from "../hooks/useDashboardData";

/** Biểu đồ cột doanh thu theo ngày. */
export function RevenueChart({ ctrl }: { ctrl: DashboardController }) {
  const { filter, revenueLoading, revenueChartData } = ctrl;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Doanh thu theo ngày</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dữ liệu từ {formatChartDate(filter.fromDate ?? "")} đến {formatChartDate(filter.toDate ?? "")}
          </p>
        </div>
      </div>
      {revenueLoading ? (
        <div className="flex h-[280px] items-center justify-center">
          <LoadingSpinner text="Đang tải doanh thu..." />
        </div>
      ) : revenueChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueChartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#627D98" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#627D98" }}
              tickFormatter={(v) => formatRevenueTick(Number(v))}
              domain={[0, (dataMax: number) => Math.max(dataMax, 1_000_000)]}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), "Doanh thu"]}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { date?: string } | undefined;
                return row?.date ? `Ngày ${formatChartDate(row.date)}` : "Doanh thu";
              }}
              cursor={{ fill: "rgba(11,92,173,0.06)" }}
            />
            <Bar dataKey="revenue" name="Doanh thu (đồng)" maxBarSize={72} radius={[6, 6, 0, 0]}>
              {revenueChartData.map((entry, index) => (
                <Cell key={entry.date} fill={index === revenueChartData.length - 1 ? "#0B5CAD" : "#B3D1EF"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu doanh thu.</p>
      )}
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary-300" /> Doanh thu đã thanh toán (VNĐ)
      </p>
    </Card>
  );
}
