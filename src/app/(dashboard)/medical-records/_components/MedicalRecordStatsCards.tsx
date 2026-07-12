import { Card } from "@/components/ui/Card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { FiArrowDownRight, FiArrowUpRight, FiCalendar, FiClock, FiFileText } from "react-icons/fi";

interface Stats {
  thisMonthCount: number;
  monthChangePercent: number;
  lastVisitAt?: string | null;
}

export function MedicalRecordStatsCards({ totalItems, stats }: { totalItems: number; stats?: Stats }) {
  const monthUp = (stats?.monthChangePercent ?? 0) >= 0;
  const cards = [
    {
      label: "Tổng hồ sơ",
      value: totalItems.toLocaleString("vi-VN"),
      sub: "Theo kết quả API",
      icon: FiFileText,
      tone: "bg-primary-100 text-primary-600",
      delta: undefined as string | undefined,
      deltaUp: true,
    },
    {
      label: "Hồ sơ tháng này",
      value: stats ? stats.thisMonthCount.toLocaleString("vi-VN") : "—",
      sub: "So với tháng trước",
      icon: FiCalendar,
      tone: "bg-success-light text-success",
      delta: stats ? `${Math.abs(stats.monthChangePercent)}%` : undefined,
      deltaUp: monthUp,
    },
    {
      label: "Lần khám gần nhất",
      value: stats?.lastVisitAt ? formatDate(stats.lastVisitAt) : "—",
      sub: stats?.lastVisitAt ? formatDateTime(stats.lastVisitAt) : "Chưa có dữ liệu",
      icon: FiClock,
      tone: "bg-purple-100 text-purple-600",
      delta: undefined,
      deltaUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-5">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground">
                  {card.value}
                  {card.delta && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${card.deltaUp ? "text-success" : "text-error"}`}>
                      {card.deltaUp ? <FiArrowUpRight className="h-3.5 w-3.5" /> : <FiArrowDownRight className="h-3.5 w-3.5" />}
                      {card.delta}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
