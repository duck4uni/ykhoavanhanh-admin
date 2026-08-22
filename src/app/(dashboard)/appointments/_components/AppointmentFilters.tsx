import { Calendar, Filter, RotateCcw, Search } from "lucide-react";
import { AsyncSearchSelect, type AsyncSearchFetchResult } from "@/components/ui/AsyncSearchSelect";

interface FilterOption {
  id: string;
  name: string;
}

interface AppointmentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  examAreaFilter: string;
  onExamAreaFilterChange: (value: string) => void;
  examAreaOptions: FilterOption[];
  roomFilter: string;
  onRoomFilterChange: (value: string) => void;
  fetchRoomOptions: (params: { search: string; page: number; pageSize: number }) => Promise<AsyncSearchFetchResult>;
  roomSelectedLabel?: string;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  fetchServiceOptions: (params: { search: string; page: number; pageSize: number }) => Promise<AsyncSearchFetchResult>;
  serviceSelectedLabel?: string;
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
  statusFilter,
  onStatusFilterChange,
  examAreaFilter,
  onExamAreaFilterChange,
  examAreaOptions,
  roomFilter,
  onRoomFilterChange,
  fetchRoomOptions,
  roomSelectedLabel,
  serviceFilter,
  onServiceFilterChange,
  fetchServiceOptions,
  serviceSelectedLabel,
  onApply,
  onReset,
}: AppointmentFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
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

        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className={`${CONTROL_CLASS} lg:w-40`}>
          <option value="">Trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Tạm ngưng</option>
        </select>

        <select value={examAreaFilter} onChange={(event) => onExamAreaFilterChange(event.target.value)} className={`${CONTROL_CLASS} lg:w-44`}>
          <option value="">Khu khám</option>
          {examAreaOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>

        <AsyncSearchSelect
          value={roomFilter}
          onChange={onRoomFilterChange}
          placeholder="Phòng khám"
          searchPlaceholder="Tìm phòng khám..."
          selectedLabel={roomSelectedLabel}
          fetchPage={fetchRoomOptions}
          className="lg:w-44"
        />

        <AsyncSearchSelect
          value={serviceFilter}
          onChange={onServiceFilterChange}
          placeholder="Dịch vụ khám"
          searchPlaceholder="Tìm dịch vụ khám..."
          selectedLabel={serviceSelectedLabel}
          fetchPage={fetchServiceOptions}
          className="lg:w-48"
        />

        <div className="flex items-center gap-2">
          <button type="button" onClick={onApply} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            <Filter className="h-4 w-4" /> Lọc
          </button>
          <button type="button" onClick={onReset} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
