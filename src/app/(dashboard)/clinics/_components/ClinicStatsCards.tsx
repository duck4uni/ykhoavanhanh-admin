import { Building2, CheckCircle2, FileText, Info } from "lucide-react";

interface ClinicStats {
  totalRooms: number;
  activeRooms: number;
  withServiceCode: number;
  withoutDescription: number;
  activePct: string;
  withServiceCodePct: string;
  noDescPct: string;
}

export function ClinicStatsCards({ stats }: { stats: ClinicStats }) {
  const cards = [
    { label: "Tổng phòng khám", value: stats.totalRooms, sub: "Tất cả phòng khám", icon: Building2, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: stats.activeRooms, sub: `${stats.activePct}% tổng số`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Đã gán dịch vụ", value: stats.withServiceCode, sub: `${stats.withServiceCodePct}% tổng số`, icon: FileText, tone: "bg-purple-100 text-purple-600" },
    { label: "Chưa có mô tả", value: stats.withoutDescription, sub: `${stats.noDescPct}% tổng số`, icon: Info, tone: "bg-warning-light text-warning" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          >
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
