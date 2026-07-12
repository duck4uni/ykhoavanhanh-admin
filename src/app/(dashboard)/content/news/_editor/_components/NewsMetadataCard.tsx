import { AlignLeft, FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import type { NewsForm } from "../types";

type Props = {
  form: NewsForm;
  setForm: React.Dispatch<React.SetStateAction<NewsForm>>;
  categoryOptions: { value: string; label: string }[];
};

/** Card thông tin cơ bản: tiêu đề, mô tả, danh mục, slug. */
export function NewsMetadataCard({ form, setForm, categoryOptions }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Thông tin cơ bản</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tiêu đề và mô tả ngắn cho bài viết</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        <div className="px-6 py-5 space-y-1">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            Tiêu đề bài viết
            <span className="text-red-400">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nhập tiêu đề bài viết..."
            className="text-slate-800 placeholder:text-slate-300"
          />
        </div>

        <div className="px-6 py-5 space-y-1">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
            Mô tả ngắn
          </label>
          <textarea
            rows={3}
            className={cn(
              "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800",
              "placeholder:text-slate-300 bg-white",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400",
              "resize-none transition-shadow"
            )}
            placeholder="Mô tả ngắn về nội dung bài viết (sẽ hiển thị trong danh sách)..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Danh mục</label>
            <Select
              placeholder="Chọn danh mục..."
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
              options={categoryOptions}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Slug</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="tu-dong-tao-tu-tieu-de"
              className="font-mono text-slate-600"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
