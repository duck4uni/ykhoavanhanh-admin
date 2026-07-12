import { Building2, CheckCircle2, DoorOpen } from "lucide-react";

interface ExamAreaStats {
  total: number;
  activeCount: number;
  activePct: number;
  totalRooms: number;
  noRoomConfigured: number;
}

export function ExamAreaStatsCards({ stats }: { stats: ExamAreaStats }) {
  const cards = [
    { label: "Tổng khu vực khám", value: stats.total, sub: "Khu vực", icon: Building2, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: stats.activeCount, sub: `${stats.activePct}%`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Tổng phòng khám", value: stats.totalRooms, sub: "Phòng", icon: DoorOpen, tone: "bg-warning-light text-warning" },
    { label: "Chưa cấu hình phòng", value: stats.noRoomConfigured, sub: "Khu vực", icon: DoorOpen, tone: "bg-purple-100 text-purple-600" },
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
