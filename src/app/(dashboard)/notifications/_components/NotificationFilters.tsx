import { Search, X } from "lucide-react";
import type { NotificationCategory } from "@/api/notificationsApi";
import type { NotificationListController } from "../hooks/useNotificationList";

/** Thanh lọc thông báo: tìm kiếm + loại + trạng thái đọc. */
export function NotificationFilters({ ctrl }: { ctrl: NotificationListController }) {
  const { search, setSearch, setPage, filterCategory, setFilterCategory, filterRead, setFilterRead, activeFilterCount, clearFilters } = ctrl;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm tiêu đề, nội dung..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value as "ALL" | NotificationCategory); setPage(1); }}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="ALL">Tất cả loại</option>
            <option value="APPOINTMENT">Lịch hẹn</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
          <select
            value={filterRead}
            onChange={(e) => { setFilterRead(e.target.value as "ALL" | "READ" | "UNREAD"); setPage(1); }}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="UNREAD">Chưa đọc</option>
            <option value="READ">Đã đọc</option>
          </select>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Xóa bộ lọc ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
