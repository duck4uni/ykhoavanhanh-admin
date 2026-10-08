"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { DatePicker } from "@/components/ui/DatePicker";
import { Switch } from "@/components/ui/Toggle";
import { PLATFORM_OPTIONS, STATUS_OPTIONS, UPDATE_TYPE_OPTIONS, type AppVersionFormValues } from "../types";

interface AppVersionFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialForm: AppVersionFormValues;
  isSubmitting: boolean;
  onSubmit: (form: AppVersionFormValues) => void;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Trang (không phải modal) dùng chung cho thêm/sửa bản cập nhật. */
export function AppVersionForm({ title, subtitle, submitLabel, initialForm, isSubmitting, onSubmit }: AppVersionFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AppVersionFormValues>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function set<K extends keyof AppVersionFormValues>(key: K, value: AppVersionFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/app-versions")}
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

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Thông tin phiên bản</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nền tảng" required>
              <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className={INPUT_CLASS}>
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tên phiên bản" required>
              <input
                value={form.version_name}
                onChange={(e) => set("version_name", e.target.value)}
                placeholder="VD: 1.2.0"
                className={INPUT_CLASS}
                autoFocus
              />
            </Field>
            <Field label="Mã phiên bản (version code)" required>
              <input
                value={form.version_code}
                onChange={(e) => set("version_code", e.target.value)}
                placeholder="VD: 120"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Phiên bản tối thiểu" required hint="Người dùng dùng bản thấp hơn sẽ bị nhắc cập nhật.">
              <input
                value={form.min_version}
                onChange={(e) => set("min_version", e.target.value)}
                placeholder="VD: 1.0.0"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Loại cập nhật" required hint="Bắt buộc: người dùng phải cập nhật mới tiếp tục sử dụng.">
              <select value={form.update_type} onChange={(e) => set("update_type", e.target.value)} className={INPUT_CLASS}>
                {UPDATE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <DatePicker
              label="Ngày hiệu lực"
              required
              value={form.effective_date}
              onChange={(value) => set("effective_date", value)}
              placeholder="Chọn ngày hiệu lực"
            />
            <Field label="Trạng thái" required>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={INPUT_CLASS}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kích hoạt">
              <div className="flex h-[38px] items-center gap-3">
                <Switch checked={form.enabled} onCheckedChange={(checked) => set("enabled", checked)} size="lg" />
                <span className="text-sm text-slate-600">{form.enabled ? "Đang bật" : "Đang tắt"}</span>
              </div>
            </Field>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-800">Nội dung thông báo trên ứng dụng</h2>
          <Field label="Tiêu đề" required>
            <input
              value={form.update_title}
              onChange={(e) => set("update_title", e.target.value)}
              placeholder="VD: Phiên bản 1.2.0"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Nội dung cập nhật" required>
            <textarea
              value={form.update_content}
              onChange={(e) => set("update_content", e.target.value)}
              rows={5}
              placeholder="Mô tả những thay đổi trong phiên bản này..."
              className={INPUT_CLASS}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nội dung nút cập nhật" required>
              <input
                value={form.cta_text}
                onChange={(e) => set("cta_text", e.target.value)}
                placeholder="VD: Cập nhật ngay"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Đường dẫn cửa hàng ứng dụng" required>
              <input
                type="url"
                value={form.store_url}
                onChange={(e) => set("store_url", e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </section>

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
            onClick={() => router.push("/app-versions")}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
