import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import type { NewsStatusFilter } from "../types";

interface NewsHeaderFiltersProps {
  activeFilterCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: NewsStatusFilter;
  onStatusFilterChange: (value: NewsStatusFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  onResetFilters: () => void;
}

export function NewsHeaderFilters({
  activeFilterCount,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  onResetFilters,
}: NewsHeaderFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">Tin tức</h1>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                {activeFilterCount} bộ lọc
                <button onClick={onResetFilters} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-400">Thông báo và sự kiện bệnh viện</p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm tiêu đề, mô tả..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-8 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500 sm:w-64"
            />
            {search && (
              <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as NewsStatusFilter)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="HIDDEN">Ẩn</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Danh mục</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Link href="/content/news/new" className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Đăng tin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
