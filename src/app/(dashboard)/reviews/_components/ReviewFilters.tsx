import { RotateCcw, Search } from "lucide-react";
import type { HisDoctor } from "@/api/doctorsApi";
import type { ExamArea } from "@/api/examAreasApi";

interface ReviewFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  ratingFilter: string;
  onRatingFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  doctorFilter: string;
  onDoctorFilterChange: (value: string) => void;
  areaFilter: string;
  onAreaFilterChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  doctorList: HisDoctor[];
  examAreas: ExamArea[];
  onReset: () => void;
}

const SELECT_CLASS =
  "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";
const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function ReviewFilters({
  search,
  onSearchChange,
  ratingFilter,
  onRatingFilterChange,
  statusFilter,
  onStatusFilterChange,
  doctorFilter,
  onDoctorFilterChange,
  areaFilter,
  onAreaFilterChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  doctorList,
  examAreas,
  onReset,
}: ReviewFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo nội dung nhận xét..."
            className={`${INPUT_CLASS} pl-10`}
          />
        </div>

        <select value={ratingFilter} onChange={(e) => onRatingFilterChange(e.target.value)} className={SELECT_CLASS}>
          <option value="">Số sao: Tất cả</option>
          {[5, 4, 3, 2, 1].map((score) => (
            <option key={score} value={score}>{score} sao</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} className={SELECT_CLASS}>
          <option value="">Trạng thái: Tất cả</option>
          <option value="APPROVED">Hiển thị</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>

        <select value={doctorFilter} onChange={(e) => onDoctorFilterChange(e.target.value)} className={SELECT_CLASS}>
          <option value="">Bác sĩ: Tất cả</option>
          {doctorList.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>{doctor.doctorname}</option>
          ))}
        </select>

        <select value={areaFilter} onChange={(e) => onAreaFilterChange(e.target.value)} className={SELECT_CLASS}>
          <option value="">Khu khám: Tất cả</option>
          {examAreas.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>

        <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className={`${SELECT_CLASS} xl:w-40`} />
        <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className={`${SELECT_CLASS} xl:w-40`} />

        <button
          onClick={onReset}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
        >
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
