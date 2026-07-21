import { Filter, RotateCcw, Search } from "lucide-react";
import type { DoctorListController } from "../hooks/useDoctorList";
import { SpecialtyFilterCombobox } from "./SpecialtyFilterCombobox";
import { RoomFilterCombobox } from "./RoomFilterCombobox";

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

/** Thanh lọc bác sĩ: tìm kiếm + chuyên khoa + phòng khám + trạng thái + lịch khám. */
export function DoctorFilters({ ctrl }: { ctrl: DoctorListController }) {
  const {
    search, setSearch, setPage,
    specialtyFilter, setSpecialtyFilter, clinicFilter, setClinicFilter,
    statusFilter, setStatusFilter,
    resetFilters,
  } = ctrl;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto_auto] xl:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, mã bác sĩ..." className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Chuyên khoa</label>
          <SpecialtyFilterCombobox value={specialtyFilter} onChange={(value) => { setSpecialtyFilter(value); setPage(1); }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Phòng khám</label>
          <RoomFilterCombobox value={clinicFilter} onChange={(value) => { setClinicFilter(value); setPage(1); }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={fieldClass}>
            <option value="all">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
            {/* <option value="Ẩn khỏi app">Ẩn khỏi app</option> */}
          </select>
        </div>
        {/* <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Có lịch khám</label>
          <select value={scheduleFilter} onChange={(e) => { setScheduleFilter(e.target.value); setPage(1); }} className={fieldClass}>
            <option value="all">Tất cả</option>
            <option value="has">Có lịch</option>
            <option value="none">Chưa có lịch</option>
          </select>
        </div> */}
        <button onClick={() => setPage(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
          <Filter className="h-4 w-4" /> Lọc
        </button>
        <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
