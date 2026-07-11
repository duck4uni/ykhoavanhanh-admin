import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { isValidVietnamesePhone, type ExamAreaFormValues } from "../types";

interface ExamAreaFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: ExamAreaFormValues;
  onChange: (updater: (prev: ExamAreaFormValues) => ExamAreaFormValues) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}

const TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500";

export function ExamAreaFormModal({
  open,
  isEditing,
  form,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}: ExamAreaFormModalProps) {
  if (!open) return null;

  const phoneError =
    form.phone.trim() && !isValidVietnamesePhone(form.phone) ? "Số điện thoại không đúng định dạng" : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditing ? "Chỉnh sửa khu vực khám" : "Thêm khu vực khám mới"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="ID Nội bộ *" value={form.code} onChange={(e) => onChange((p) => ({ ...p, code: e.target.value }))} placeholder="VD: KV-001" />
            <Input label="Tên khu vực khám *" value={form.name} onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Khu khám chuyên sâu" />
            <Input label="Tên viết tắt" value={form.short_name} onChange={(e) => onChange((p) => ({ ...p, short_name: e.target.value }))} placeholder="VD: KCS" />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => onChange((p) => ({ ...p, phone: e.target.value }))}
              placeholder="VD: 0333748720"
              inputMode="tel"
              error={phoneError}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => onChange((p) => ({ ...p, status: e.target.value as ExamAreaFormValues["status"] }))}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm tắt</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả khu khám</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className={TEXTAREA_CLASS}
              placeholder="Mô tả công năng khu khám"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ</label>
            <textarea
              value={form.address}
              onChange={(e) => onChange((p) => ({ ...p, address: e.target.value }))}
              rows={2}
              className={TEXTAREA_CLASS}
              placeholder="Địa chỉ hoặc vị trí khu khám"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || Boolean(phoneError)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" />}
              {isEditing ? "Lưu thay đổi" : "Tạo khu vực khám"}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
