import { Filter, RefreshCw, Search } from "lucide-react";
import type { ExamServiceListController } from "../hooks/useExamServiceList";

const selectClass =
  "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

/** Thanh lọc dịch vụ khám. */
export function ServiceFilters({ ctrl }: { ctrl: ExamServiceListController }) {
  const {
    search, setSearch, serviceTypeFilter, setServiceTypeFilter, insuranceFilter, setInsuranceFilter,
    statusFilter, setStatusFilter, fromDate, setFromDate, serviceTypes, setCurrentPage, resetFilters,
  } = ctrl;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr_auto_auto] xl:items-end">
        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên dịch vụ, mã dịch vụ..." className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
          </div>
        </div>
        <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)} className={selectClass}>
          <option value="all">Loại dịch vụ: Tất cả</option>
          {serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={insuranceFilter} onChange={(e) => setInsuranceFilter(e.target.value)} className={selectClass}>
          <option value="all">Loại BH: Tất cả</option>
          <option value="yes">BHYT</option>
          <option value="no">Không BHYT</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">Trạng thái: Tất cả</option>
          <option value="active">Hoạt động</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={selectClass} />
        <button onClick={() => setCurrentPage(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"><Filter className="h-4 w-4" /> Lọc</button>
        <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"><RefreshCw className="h-4 w-4" /> Đặt lại</button>
      </div>
    </div>
  );
}
