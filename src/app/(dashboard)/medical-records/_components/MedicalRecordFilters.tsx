import { Button } from "@/components/ui/Button";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

interface MedicalRecordFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  specialtyId: string;
  onSpecialtyIdChange: (value: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (value: string) => void;
  specialties: AdminSpecialty[];
  onReset: () => void;
}

const INPUT_CLASS =
  "h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

export function MedicalRecordFilters({
  search,
  onSearchChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  specialtyId,
  onSpecialtyIdChange,
  paymentStatus,
  onPaymentStatusChange,
  specialties,
  onReset,
}: MedicalRecordFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
      <div className="flex-1">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm bệnh nhân / mã hồ sơ"
            className={`${INPUT_CLASS} w-full pl-10`}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Từ ngày</label>
        <input type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} className={INPUT_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Đến ngày</label>
        <input type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} className={INPUT_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Chuyên khoa</label>
        <select value={specialtyId} onChange={(event) => onSpecialtyIdChange(event.target.value)} className={INPUT_CLASS}>
          <option value="">Tất cả chuyên khoa</option>
          {specialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Thanh toán</label>
        <select value={paymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value)} className={INPUT_CLASS}>
          <option value="">Tất cả</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="UNPAID">Chờ thanh toán</option>
          <option value="PARTIAL">Thanh toán 1 phần</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={onReset}>
          <FiRefreshCw className="h-4 w-4" /> Đặt lại
        </Button>
      </div>
    </div>
  );
}
