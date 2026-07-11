import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { SpecialtyFormValues } from "../types";

interface SpecialtyEditModalProps {
  open: boolean;
  form: SpecialtyFormValues;
  onChange: (updater: (prev: SpecialtyFormValues) => SpecialtyFormValues) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}

const TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500";

/** Modal chỉnh sửa nhanh chuyên khoa ngay trên trang danh sách. */
export function SpecialtyEditModal({ open, form, onChange, onClose, onSubmit, isSubmitting }: SpecialtyEditModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Chỉnh sửa chuyên khoa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tên chuyên khoa *" value={form.name} onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Nội khoa" />
            <Input label="Nhóm đặt khám" value={form.booking_group} onChange={(e) => onChange((p) => ({ ...p, booking_group: e.target.value }))} placeholder="VD: NHOM_1" />
            <Input label="Ưu tiên hiển thị" type="number" value={form.display_priority} onChange={(e) => onChange((p) => ({ ...p, display_priority: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea value={form.description} onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))} rows={3} className={TEXTAREA_CLASS} placeholder="Nhập mô tả chuyên khoa" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Hướng dẫn đến phòng khám</label>
            <textarea value={form.room_visit_instruction} onChange={(e) => onChange((p) => ({ ...p, room_visit_instruction: e.target.value }))} rows={3} className={TEXTAREA_CLASS} placeholder="VD: Tầng 2, khu A" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú đặt khám</label>
            <textarea value={form.booking_note} onChange={(e) => onChange((p) => ({ ...p, booking_note: e.target.value }))} rows={3} className={TEXTAREA_CLASS} placeholder="Nhập lưu ý khi bệnh nhân đặt khám" />
          </div>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span>
              <span className="block text-sm font-medium text-slate-700">Hoạt động</span>
              <span className="text-xs text-slate-400">Tắt nếu chuyên khoa tạm ngưng sử dụng.</span>
            </span>
            <input type="checkbox" checked={form.is_active} onChange={(e) => onChange((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 accent-primary" />
          </label>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <Spinner size="sm" />}Lưu thay đổi
            </button>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}
