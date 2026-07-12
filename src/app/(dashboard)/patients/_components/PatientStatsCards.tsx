import { FiUsers, FiShield, FiCopy, FiRefreshCw } from "react-icons/fi";
import { Card } from "@/components/ui/Card";

type PatientStatsCardsProps = {
  total: number;
  withInsurance: number;
  insurancePct: number;
  pendingSync: number;
};

export function PatientStatsCards({ total, withInsurance, insurancePct, pendingSync }: PatientStatsCardsProps) {
  const stats = [
    { label: "Tổng bệnh nhân", value: total, sub: "Tất cả hồ sơ trong hệ thống", icon: FiUsers, tone: "bg-primary-100 text-primary-600" },
    { label: "Có BHYT", value: withInsurance, sub: `${insurancePct}% tổng số bệnh nhân`, icon: FiShield, tone: "bg-success-light text-success" },
    { label: "Hồ sơ trùng", value: 0, sub: "Cần kiểm tra & gộp", icon: FiCopy, tone: "bg-warning-light text-warning" },
    { label: "Chờ đồng bộ HIS", value: pendingSync, sub: "Chưa đồng bộ thông tin", icon: FiRefreshCw, tone: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-5">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
