import { CalendarCheck, CheckCircle2, UserRound, Users } from "lucide-react";

type Stats = {
  totalDoctors: number;
  activeCount: number;
  withSchedule: number;
  unassignedSpecialty: number;
  activePct: number;
};

export function DoctorStatsCards({ stats }: { stats: Stats }) {
  const items = [
    { label: "Tổng bác sĩ", value: stats.totalDoctors, sub: "Tất cả bác sĩ trong hệ thống", icon: Users, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: stats.activeCount, sub: `${stats.activePct}% tổng số bác sĩ`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Có lịch khám", value: stats.withSchedule, sub: "Đã được tạo lịch khám", icon: CalendarCheck, tone: "bg-purple-100 text-purple-600" },
    { label: "Chưa gán chuyên khoa", value: stats.unassignedSpecialty, sub: "Cần cập nhật thông tin", icon: UserRound, tone: "bg-warning-light text-warning" },
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
