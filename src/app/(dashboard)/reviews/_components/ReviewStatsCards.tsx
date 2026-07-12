import { Clock, Frown, MessageSquare, Reply, Star } from "lucide-react";
import { StarRating } from "./ReviewBadges";

interface ReviewStats {
  avgRating: string;
  pendingCount: number;
  lowRatingCount: number;
  repliedCount: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

function StatCard({ label, value, sub, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  );
}

export function ReviewStatsCards({ totalItems, stats }: { totalItems: number; stats: ReviewStats }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Tổng đánh giá" value={totalItems} sub="đánh giá" icon={MessageSquare} tone="bg-primary-100 text-primary-600" />
      <StatCard label="Điểm trung bình" value={`${stats.avgRating} / 5`} sub={<StarRating value={Math.round(Number(stats.avgRating))} />} icon={Star} tone="bg-accent-light text-accent-600" />
      <StatCard label="Chờ duyệt" value={stats.pendingCount} sub="đánh giá" icon={Clock} tone="bg-warning-light text-warning" />
      <StatCard label="Đánh giá thấp (1-2 sao)" value={stats.lowRatingCount} sub="cần xử lý" icon={Frown} tone="bg-error-light text-error" />
      <StatCard label="Đã phản hồi" value={stats.repliedCount} sub="đánh giá" icon={Reply} tone="bg-success-light text-success" />
    </div>
  );
}
