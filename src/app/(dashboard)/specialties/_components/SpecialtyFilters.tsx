import { RefreshCw, Search } from "lucide-react";

interface SpecialtyFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  bookingGroupFilter: string;
  onBookingGroupFilterChange: (value: string) => void;
  bookingGroups: string[];
  onReset: () => void;
}

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function SpecialtyFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  bookingGroupFilter,
  onBookingGroupFilterChange,
  bookingGroups,
  onReset,
}: SpecialtyFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên, mã chuyên khoa..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <div className="min-w-[170px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>

        <div className="min-w-[170px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nhóm đặt khám</label>
          <select value={bookingGroupFilter} onChange={(e) => onBookingGroupFilterChange(e.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả</option>
            {bookingGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <button onClick={onReset} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
          <RefreshCw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
