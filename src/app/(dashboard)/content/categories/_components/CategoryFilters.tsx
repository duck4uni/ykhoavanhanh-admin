import { RefreshCw, Search } from "lucide-react";
import type { SortOrder } from "../types";

interface CategoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterActive: boolean | null;
  onFilterActiveChange: (value: boolean | null) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  onReset: () => void;
}

export function CategoryFilters({
  search,
  onSearchChange,
  filterActive,
  onFilterActiveChange,
  sortOrder,
  onSortOrderChange,
  onReset,
}: CategoryFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên, slug, mô tả..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select
            value={filterActive === null ? "all" : filterActive ? "active" : "inactive"}
            onChange={(event) => {
              const value = event.target.value;
              onFilterActiveChange(value === "all" ? null : value === "active");
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </div>

        <div className="min-w-[170px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Sắp xếp</label>
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value as SortOrder)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="asc">Thứ tự tăng dần</option>
            <option value="desc">Thứ tự giảm dần</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
        >
          <RefreshCw className="h-4 w-4" />
          Đặt lại
        </button>
      </div>
    </div>
  );
}
