import { Calendar, CheckCircle2, Clock, Users } from "lucide-react";

interface AppointmentStats {
  totalCount: number;
  activeCount: number;
  totalSlots: number;
  totalBooked: number;
}

export function AppointmentStatsCards({ stats }: { stats: AppointmentStats }) {
  const cards = [
    { label: "Tổng lịch khám", value: stats.totalCount, sub: "Lịch", icon: Calendar, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: stats.activeCount, sub: "Lịch", icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Tổng phiếu khám", value: stats.totalSlots, sub: "Phiếu", icon: Clock, tone: "bg-purple-100 text-purple-600" },
    { label: "Đã đặt", value: stats.totalBooked, sub: "Lượt", icon: Users, tone: "bg-warning-light text-warning" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
