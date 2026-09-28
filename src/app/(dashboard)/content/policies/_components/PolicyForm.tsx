"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import type { PolicyFormValues } from "../types";

interface PolicyFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialForm: PolicyFormValues;
  isSubmitting: boolean;
  onSubmit: (form: PolicyFormValues) => void;
}

/** Trang (không phải modal) dùng chung cho thêm/sửa chính sách. */
export function PolicyForm({ title, subtitle, submitLabel, initialForm, isSubmitting, onSubmit }: PolicyFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PolicyFormValues>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/content/policies")}
          className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-500 shadow-sm transition-colors hover:bg-surface-secondary"
          title="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tiêu đề chính sách <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="VD: Chính sách bảo mật thông tin"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nội dung chính sách</label>
            <div className="policy-content-editor min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
              <TextEditor
                content={form.description}
                onChangeContent={(content) => setForm((current) => ({ ...current, description: content }))}
                contentClassName="min-h-[280px] [overflow-wrap:anywhere]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Thứ tự hiển thị</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sort_order: parseInt(event.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, is_active: !current.is_active }))}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  form.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {form.is_active ? (
                  <>
                    <Check className="h-4 w-4" /> Đang hiển thị
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" /> Đã ẩn
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" />}
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={() => router.push("/content/policies")}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
