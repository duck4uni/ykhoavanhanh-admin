import { Archive, Clock, FileText, Globe } from "lucide-react";

interface NewsStats {
  totalPosts: number;
  draft: number;
  published: number;
  featured: number;
}

export function NewsStatsCards({ stats }: { stats: NewsStats }) {
  const cards = [
    { label: "Tổng bài viết", value: stats.totalPosts, icon: FileText, tone: "bg-primary-50 text-primary" },
    { label: "Đã xuất bản", value: stats.published, icon: Globe, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Bản nháp", value: stats.draft, icon: Clock, tone: "bg-amber-50 text-amber-600" },
    { label: "Nổi bật", value: stats.featured, icon: Archive, tone: "bg-slate-50 text-slate-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
