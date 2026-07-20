import { FiSearch, FiRotateCcw } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PatientListController } from "../hooks/usePatientList";

const controlClass =
  "h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10";

/** Thanh lọc: tìm kiếm + giới tính + nguồn + trạng thái. */
export function PatientFilters({ ctrl }: { ctrl: PatientListController }) {
  const { searchValue, setSearchValue, gender, setGender, source, setSource, syncStatus, setSyncStatus, resetFilters } = ctrl;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm theo mã BN, họ tên, số điện thoại, BHYT..."
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Giới tính</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={controlClass}>
            <option value="all">Tất cả</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nguồn tạo hồ sơ</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={controlClass}>
            <option value="all">Tất cả</option>
            <option value="HIS">HIS</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái hồ sơ</label>
          <select value={syncStatus} onChange={(e) => setSyncStatus(e.target.value)} className={controlClass}>
            <option value="all">Tất cả</option>
            <option value="Đã đồng bộ">Đã đồng bộ</option>
            <option value="Chờ đồng bộ">Chờ đồng bộ</option>
            <option value="Chưa đồng bộ">Chưa đồng bộ</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={resetFilters}>
            <FiRotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
        </div>
      </div>
    </Card>
  );
}
