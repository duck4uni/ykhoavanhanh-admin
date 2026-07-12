import { Globe, Save, Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "../statusConfig";
import { NEWS_STATUS_KEYS, type NewsForm } from "../types";

type Props = {
  form: NewsForm;
  setForm: React.Dispatch<React.SetStateAction<NewsForm>>;
  isSaving: boolean;
  isUploading: boolean;
  isMutating: boolean;
  primaryLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  footer?: React.ReactNode;
};

/** Card xuất bản: nổi bật + chọn trạng thái + hành động. */
export function NewsPublishCard({ form, setForm, isSaving, isUploading, isMutating, primaryLabel, onSubmit, onCancel, footer }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Globe className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Xuất bản</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cài đặt hiển thị bài viết</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Featured toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              form.is_featured ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"
            )}>
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Nổi bật</p>
              <p className="text-xs text-slate-400">Ưu tiên trang chủ</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_featured}
            onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2",
              form.is_featured ? "bg-primary" : "bg-slate-200"
            )}
          >
            <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", form.is_featured ? "translate-x-6" : "translate-x-1")} />
          </button>
        </div>

        {/* Status selector */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Trạng thái</p>
          <div className="grid grid-cols-2 gap-2">
            {NEWS_STATUS_KEYS.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer",
                    "hover:border-slate-300 hover:bg-slate-50/60 active:scale-[0.98]",
                    form.status === s
                      ? "border-primary-400 bg-primary-50/50 ring-1 ring-primary-400/30"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <Icon className={cn("w-4 h-4", form.status === s ? "text-primary" : "text-slate-400")} />
                  <span className={cn("text-xs font-medium", form.status === s ? "text-primary" : "text-slate-500")}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="w-full gap-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            {isUploading ? "Đang upload ảnh..." : isMutating ? "Đang lưu..." : primaryLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full gap-2 active:scale-[0.98] transition-transform"
          >
            <X className="w-4 h-4" />
            Hủy bỏ
          </Button>
          {footer}
        </div>
      </div>
    </section>
  );
}
