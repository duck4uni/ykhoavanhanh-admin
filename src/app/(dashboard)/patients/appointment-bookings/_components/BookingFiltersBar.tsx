import { FiRotateCcw, FiSliders } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DoctorFilterCombobox } from "./DoctorFilterCombobox";
import type { BookingListController } from "../hooks/useBookingList";

const fieldClass =
  "h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

/** Thanh lọc lịch đặt khám. */
export function BookingFiltersBar({ ctrl }: { ctrl: BookingListController }) {
  const { draftFilters, handleFilterChange, applyFilters, resetFilters } = ctrl;

  return (
    <Card className="overflow-visible p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mã BN HIS</label>
          <input
            value={draftFilters.his_patient_id}
            onChange={(e) => handleFilterChange("his_patient_id", e.target.value)}
            placeholder="his_patient_id"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
          <select
            value={draftFilters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className={fieldClass}
          >
            <option value="">Tất cả</option>
            <option value="HIS_SYNCED">Đã đồng bộ HIS</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="CANCELED">Đã hủy</option>
            <option value="PENDING">Đang chờ</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Bác sĩ</label>
          <DoctorFilterCombobox
            value={draftFilters.doctor_id}
            onChange={(doctorId) => handleFilterChange("doctor_id", doctorId)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Từ ngày</label>
          <input
            type="date"
            value={draftFilters.from_date}
            onChange={(e) => handleFilterChange("from_date", e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Đến ngày</label>
          <input
            type="date"
            value={draftFilters.to_date}
            onChange={(e) => handleFilterChange("to_date", e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={applyFilters}>
            <FiSliders className="h-4 w-4" /> Lọc
          </Button>
          <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={resetFilters}>
            <FiRotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
        </div>
      </div>
    </Card>
  );
}
