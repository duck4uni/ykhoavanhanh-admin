import { CheckCircle2, ClipboardList, Stethoscope, X } from "lucide-react";

interface SpecialtyStats {
  total: number;
  activeCount: number;
  inactiveCount: number;
  withRoomInstruction: number;
  withBookingNote: number;
  activePct: number;
}

export function SpecialtyStatsCards({ stats }: { stats: SpecialtyStats }) {
  const cards = [
    { label: "Tổng chuyên khoa", value: stats.total, sub: "Chuyên khoa", icon: Stethoscope, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: stats.activeCount, sub: `${stats.activePct}%`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Có hướng dẫn phòng", value: stats.withRoomInstruction, sub: "Chuyên khoa", icon: ClipboardList, tone: "bg-warning-light text-warning" },
    { label: "Có ghi chú đặt khám", value: stats.withBookingNote, sub: "Chuyên khoa", icon: ClipboardList, tone: "bg-purple-100 text-purple-600" },
    { label: "Tạm ngưng", value: stats.inactiveCount, sub: "Chuyên khoa", icon: X, tone: "bg-slate-100 text-slate-500" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
