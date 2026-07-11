export function StatusBadge({ deleted }: { deleted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        deleted
          ? "border-slate-200 bg-slate-100 text-slate-500"
          : "border-emerald-200 bg-emerald-50 text-emerald-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${deleted ? "bg-slate-400" : "bg-emerald-500"}`} />
      {deleted ? "Đã xóa" : "Hoạt động"}
    </span>
  );
}
