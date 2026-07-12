import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { DONUT_COLORS, formatNumber } from "../types";
import type { DashboardController } from "../hooks/useDashboardData";

/** Donut tỷ lệ trạng thái phiếu khám + chú thích. */
export function TicketRatioDonut({ ctrl }: { ctrl: DashboardController }) {
  const { donutData, totalTicketsForDonut } = ctrl;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Tỷ lệ trạng thái phiếu khám</h2>
      </div>
      {donutData.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:justify-start">
          <div className="relative h-[220px] w-[220px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} stroke="none">
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
          <div className="w-full max-w-sm space-y-3 lg:flex-none">
            {donutData.map((d, index) => (
              <div key={d.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
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
  );
}
