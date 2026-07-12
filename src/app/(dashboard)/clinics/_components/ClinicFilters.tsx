import { Filter, RotateCcw, Search } from "lucide-react";

interface ClinicFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  areaFilter: string;
  onAreaFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  hisFilter: string;
  onHisFilterChange: (value: string) => void;
  examAreaOptions: string[];
  onApply: () => void;
  onReset: () => void;
}

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function ClinicFilters({
  search,
  onSearchChange,
  areaFilter,
  onAreaFilterChange,
  statusFilter,
  onStatusFilterChange,
  hisFilter,
  onHisFilterChange,
  examAreaOptions,
  onApply,
  onReset,
}: ClinicFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] lg:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên phòng, mã phòng..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Khu khám</label>
          <select value={areaFilter} onChange={(event) => onAreaFilterChange(event.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả khu khám</option>
            {examAreaOptions.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="DELETED">Đã xóa</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Dịch vụ đã gán</label>
          <select value={hisFilter} onChange={(event) => onHisFilterChange(event.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả</option>
            <option value="has">Đã gán dịch vụ</option>
            <option value="none">Chưa gán dịch vụ</option>
          </select>
        </div>

        <button
          onClick={onApply}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Filter className="h-4 w-4" /> Lọc
        </button>
        <button
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
        >
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
