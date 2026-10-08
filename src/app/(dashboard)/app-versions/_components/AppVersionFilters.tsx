import { RotateCcw, Search } from "lucide-react";
import { PLATFORM_OPTIONS, STATUS_OPTIONS } from "../types";

interface AppVersionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  platform: string;
  onPlatformChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  enabled: string;
  onEnabledChange: (value: string) => void;
  onReset: () => void;
}

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function AppVersionFilters({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  status,
  onStatusChange,
  enabled,
  onEnabledChange,
  onReset,
}: AppVersionFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên phiên bản (VD: 1.2.0)..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nền tảng</label>
          <select value={platform} onChange={(event) => onPlatformChange(event.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả nền tảng</option>
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Kích hoạt</label>
          <select value={enabled} onChange={(event) => onEnabledChange(event.target.value)} className={SELECT_CLASS}>
            <option value="all">Tất cả</option>
            <option value="true">Đang bật</option>
            <option value="false">Đang tắt</option>
          </select>
        </div>

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
