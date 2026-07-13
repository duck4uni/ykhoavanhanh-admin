import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import type { ScheduleEditorController } from "../hooks/useNewScheduleForm";

/** Modal tự sinh khung giờ. */
export function AutoGenModal({ ctrl }: { ctrl: ScheduleEditorController }) {
  const { autoGenOpen, setAutoGenOpen, autoGen, setAutoGen, runAutoGenerate } = ctrl;

  return (
    <Modal
      isOpen={autoGenOpen}
      onClose={() => setAutoGenOpen(false)}
      title="Tự sinh khung giờ"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setAutoGenOpen(false)}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={runAutoGenerate}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Sinh khung giờ
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Thời gian bắt đầu</label>
          <input
            type="time"
            value={autoGen.start}
            onChange={(e) => setAutoGen((p) => ({ ...p, start: e.target.value }))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Thời gian kết thúc</label>
          <input
            type="time"
            value={autoGen.end}
            onChange={(e) => setAutoGen((p) => ({ ...p, end: e.target.value }))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
          />
        </div>
        <Select
          label="Mỗi khung"
          value={String(autoGen.stepMinutes)}
          onChange={(e) => setAutoGen((p) => ({ ...p, stepMinutes: Number(e.target.value) }))}
          options={[
            { value: "15", label: "15 phút" },
            { value: "20", label: "20 phút" },
            { value: "30", label: "30 phút" },
            { value: "45", label: "45 phút" },
            { value: "60", label: "60 phút" },
          ]}
        />
        <Input
          label="Số phiếu khám"
          type="number"
          min={1}
          value={autoGen.slotLimit}
          onChange={(e) => setAutoGen((p) => ({ ...p, slotLimit: Number(e.target.value) || 0 }))}
        />
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
        <strong>Lưu ý:</strong> thao tác này sẽ thay thế toàn bộ khung giờ hiện có. Khung giờ mới mặc định áp dụng cho tất cả phạm vi; bạn vẫn cần chọn thứ/ngày áp dụng cho từng khung giờ.
      </div>
    </Modal>
  );
}
