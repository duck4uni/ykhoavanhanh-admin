import { CalendarDays, CheckCircle2, ClipboardList, ShieldPlus } from "lucide-react";

type Stats = {
  total: number;
  activeCount: number;
  insuranceCount: number;
  updatedThisMonth: number;
  activePct: string;
  insurancePct: number;
};

export function ServiceStatsCards({ stats }: { stats: Stats }) {
  const items = [
    { label: "Tổng dịch vụ", value: stats.total, sub: "Tất cả dịch vụ", icon: ClipboardList, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: stats.activeCount, sub: `${stats.activePct}% tổng dịch vụ`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Hỗ trợ BHYT", value: stats.insuranceCount, sub: `${stats.insurancePct}% trang hiện tại`, icon: ShieldPlus, tone: "bg-purple-100 text-purple-600" },
    { label: "Cập nhật tháng này", value: stats.updatedThisMonth, sub: "Dịch vụ được cập nhật", icon: CalendarDays, tone: "bg-warning-light text-warning" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
