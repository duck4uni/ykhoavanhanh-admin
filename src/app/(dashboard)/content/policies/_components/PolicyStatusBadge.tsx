export function PolicyStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Đang hiển thị" : "Đã ẩn"}
    </span>
  );
}
