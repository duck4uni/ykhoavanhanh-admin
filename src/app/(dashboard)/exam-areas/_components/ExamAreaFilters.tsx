import { RefreshCw, Search } from "lucide-react";

interface ExamAreaFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onReset: () => void;
}

export function ExamAreaFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
}: ExamAreaFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên, mã khu vực, địa chỉ..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="all">Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm tắt</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
        >
          <RefreshCw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
