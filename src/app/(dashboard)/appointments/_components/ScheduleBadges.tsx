import type { DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";

export function SlotBar({ booked, max }: { booked: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((booked / max) * 100)) : 0;
  const full = max > 0 && booked >= max;
  return (
    <div className="min-w-[110px]">
      <p className="text-sm font-medium text-slate-700">{booked}/{max}</p>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${full ? "bg-slate-400" : "bg-primary-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatusBadge({ item }: { item: DoctorWorkSchedule }) {
  const max = item.max_appointments ?? 0;
  const full = max > 0 && item.booked_count >= max;
  let label: string;
  let className: string;
  if (item.status !== "ACTIVE") {
    label = "Tạm ngưng";
    className = "bg-warning-light text-warning";
  } else if (full) {
    label = "Đã đầy";
    className = "bg-primary-100 text-primary-600";
  } else {
    label = "Hoạt động";
    className = "bg-success-light text-success";
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
