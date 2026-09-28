import { Filter, RotateCcw, Search } from "lucide-react";

interface PolicyFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterActive: boolean | null;
  onFilterActiveChange: (value: boolean | null) => void;
  onApply: () => void;
  onReset: () => void;
}

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function PolicyFilters({
  search,
  onSearchChange,
  filterActive,
  onFilterActiveChange,
  onApply,
  onReset,
}: PolicyFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_auto_auto] lg:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung chính sách..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select
            value={filterActive === null ? "all" : filterActive ? "active" : "inactive"}
            onChange={(event) => {
              const value = event.target.value;
              onFilterActiveChange(value === "all" ? null : value === "active");
            }}
            className={SELECT_CLASS}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đã ẩn</option>
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
