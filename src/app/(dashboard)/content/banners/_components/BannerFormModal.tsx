import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { getImageSrc, slugifyCode, type BannerFormValues } from "../types";

interface BannerFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: BannerFormValues;
  onChange: (updater: (prev: BannerFormValues) => BannerFormValues) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onUploadImage: (file: File | null) => void;
  isSubmitting: boolean;
  isUploading: boolean;
}

export function BannerFormModal({
  open,
  isEditing,
  form,
  onChange,
  onClose,
  onSubmit,
  onUploadImage,
  isSubmitting,
  isUploading,
}: BannerFormModalProps) {
  if (!open) return null;

  const imageSrc = getImageSrc(form.content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{isEditing ? "Chỉnh sửa banner" : "Thêm banner mới"}</h2>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tên banner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  name: event.target.value,
                  code:
                    current.code && current.code === slugifyCode(current.name)
                      ? slugifyCode(event.target.value)
                      : current.code,
                }))
              }
              placeholder="VD: Banner trang chủ"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mã banner</label>
            <input
              type="text"
              value={form.code}
              onChange={(event) => onChange((current) => ({ ...current, code: event.target.value }))}
              placeholder="banner-trang-chu"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-slate-400">Để trống sẽ tự động tạo từ tên banner</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ảnh banner</label>
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/40">
              <ImageIcon className="mb-2 h-6 w-6 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{isUploading ? "Đang upload ảnh..." : "Chọn ảnh từ máy"}</span>
              <span className="mt-1 text-xs text-slate-400">Hỗ trợ PNG, JPG, WEBP. File sẽ được upload lên hệ thống.</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(event) => onUploadImage(event.target.files?.[0] ?? null)}
              />
            </label>

            {form.content && (
              <p className="mt-2 text-xs text-slate-400">
                Đường dẫn đã lưu: <span className="font-mono">{form.content}</span>
              </p>
            )}

            {imageSrc && (
              <div className="relative mt-3 h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <Image src={imageSrc} alt="preview" fill sizes="480px" className="object-cover" unoptimized />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" />}
              {isEditing ? "Lưu thay đổi" : "Tạo banner"}
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
