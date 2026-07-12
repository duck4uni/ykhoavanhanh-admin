import { Check, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { slugify, type CategoryFormValues } from "../types";

interface CategoryFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: CategoryFormValues;
  onChange: (updater: (prev: CategoryFormValues) => CategoryFormValues) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function CategoryFormModal({
  open,
  isEditing,
  form,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}: CategoryFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h2>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  name: event.target.value,
                  slug:
                    current.slug && current.slug === slugify(current.name)
                      ? slugify(event.target.value)
                      : current.slug,
                }))
              }
              placeholder="VD: Sức khỏe"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(event) => onChange((current) => ({ ...current, slug: event.target.value }))}
              placeholder="suc-khoe"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-slate-400">Để trống sẽ tự động tạo từ tên danh mục</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
              placeholder="Mô tả ngắn về danh mục..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Thứ tự</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  onChange((current) => ({ ...current, sort_order: parseInt(event.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
              <button
                type="button"
                onClick={() => onChange((current) => ({ ...current, is_active: !current.is_active }))}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  form.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {form.is_active ? (
                  <>
                    <Check className="h-4 w-4" /> Hoạt động
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" /> Tắt
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" />}
              {isEditing ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
