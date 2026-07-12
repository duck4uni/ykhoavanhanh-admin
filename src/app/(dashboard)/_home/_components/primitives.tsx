import { FiInfo } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { RANGE_OPTIONS, STATUS_BADGE } from "../types";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  footer?: React.ReactNode;
}

export function KpiCard({ title, value, icon: Icon, iconBg, footer }: KpiCardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="truncate">{title}</span>
            <FiInfo className="h-3.5 w-3.5 flex-shrink-0 text-text-disabled" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      {footer && (
        <div className="mt-4 rounded-lg bg-surface-secondary px-3 py-2 text-center text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  const key = (status ?? "").toUpperCase();
  const s = STATUS_BADGE[key] ?? { label: status || "—", className: "bg-surface-secondary text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

export function RangeToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-surface-secondary p-1">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.key ? "bg-white text-primary-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
