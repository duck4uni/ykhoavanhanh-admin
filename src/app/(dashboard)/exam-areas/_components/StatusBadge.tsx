import type { ExamArea } from "@/api/examAreasApi";

export function StatusBadge({ status }: { status: ExamArea["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-amber-200 bg-amber-50 text-amber-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />
      {active ? "Hoạt động" : "Tạm tắt"}
    </span>
  );
}
