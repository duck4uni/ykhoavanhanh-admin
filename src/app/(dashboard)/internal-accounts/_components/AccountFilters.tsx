import { CalendarDays, Filter, RefreshCw, Search } from "lucide-react";
import type { InternalAccountsController } from "../hooks/useInternalAccounts";

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

/** Thanh lọc tài khoản nội bộ: tìm kiếm + vai trò + trạng thái + ngày tạo. */
export function AccountFilters({ ctrl }: { ctrl: InternalAccountsController }) {
  const { search, setSearch, setCurrentPage, roleFilter, setRoleFilter, statusFilter, setStatusFilter, dateFilter, setDateFilter, roleOptions, resetFilters } = ctrl;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] xl:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, email, SĐT..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Vai trò</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={fieldClass}>
            <option value="all">Tất cả vai trò</option>
            {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={fieldClass}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Tạm khóa</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Ngày tạo</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
          </div>
        </div>

        <button onClick={() => setCurrentPage(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
          <Filter className="h-4 w-4" /> Lọc
        </button>
        <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
          <RefreshCw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
