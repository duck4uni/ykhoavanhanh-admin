import { CheckCircle2, Lock, Mail, UserRound, Users } from "lucide-react";

type Stats = {
  totalItems: number;
  activeCount: number;
  lockedCount: number;
  noRoleCount: number;
  recentCount: number;
};

export function AccountStatsCards({ stats }: { stats: Stats }) {
  const items = [
    { label: "Tổng tài khoản", value: stats.totalItems, sub: "Tất cả tài khoản trong hệ thống", icon: Users, tone: "bg-primary-100 text-primary-600" },
    { label: "Hoạt động", value: stats.activeCount, sub: "Tài khoản đang sử dụng", icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Tạm khóa", value: stats.lockedCount, sub: "Tài khoản bị tạm khóa", icon: Lock, tone: "bg-warning-light text-warning" },
    { label: "Chưa có vai trò", value: stats.noRoleCount, sub: "Cần phân quyền", icon: UserRound, tone: "bg-purple-100 text-purple-600" },
    { label: "Mới trong 30 ngày", value: stats.recentCount, sub: "Tài khoản mới tạo", icon: Mail, tone: "bg-primary-100 text-primary-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
