import { Calendar, Filter, RotateCcw, Search } from "lucide-react";

interface AppointmentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  shiftFilter: string;
  onShiftFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const CONTROL_CLASS =
  "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function AppointmentFilters({
  search,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  shiftFilter,
  onShiftFilterChange,
  statusFilter,
  onStatusFilterChange,
  onApply,
  onReset,
}: AppointmentFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm bác sĩ / khu khám..."
            className={`${CONTROL_CLASS} w-full pl-10`}
          />
        </div>

        <div className="relative lg:w-52">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => onDateFilterChange(event.target.value)}
            className={`${CONTROL_CLASS} w-full pl-10`}
          />
        </div>

        <select value={shiftFilter} onChange={(event) => onShiftFilterChange(event.target.value)} className={`${CONTROL_CLASS} lg:w-40`}>
          <option value="">Ca khám</option>
          <option value="MORNING">Sáng</option>
          <option value="AFTERNOON">Chiều</option>
          <option value="EVENING">Tối</option>
          <option value="NIGHT">Đêm</option>
        </select>

        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className={`${CONTROL_CLASS} lg:w-40`}>
          <option value="">Trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Tạm ngưng</option>
        </select>

        <div className="flex items-center gap-2">
          <button onClick={onApply} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            <Filter className="h-4 w-4" /> Lọc
          </button>
          <button onClick={onReset} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
