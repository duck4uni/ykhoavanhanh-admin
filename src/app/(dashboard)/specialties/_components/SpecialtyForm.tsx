"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList, MapPin, Save, Stethoscope, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { examAreasHooks } from "@/api/examAreasApi";
import { EMPTY_SPECIALTY_FORM, type SpecialtyFormValues } from "../types";

interface SpecialtyFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialForm?: SpecialtyFormValues;
  isSubmitting: boolean;
  onSubmit: (form: SpecialtyFormValues) => void;
}

const TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500";

/** Form đầy đủ (kèm rich text + preview) cho trang thêm/sửa chuyên khoa. */
export function SpecialtyForm({
  title,
  subtitle,
  submitLabel,
  initialForm = EMPTY_SPECIALTY_FORM,
  isSubmitting,
  onSubmit,
}: SpecialtyFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<SpecialtyFormValues>(initialForm);
  const { data: examAreasData } = examAreasHooks.useList();
  const examAreas = examAreasData?.rows ?? [];
  const selectedAreas = examAreas.filter((area) => form.exam_area_ids.includes(area.id));

  function toggleExamArea(id: string) {
    setForm((p) => ({
      ...p,
      exam_area_ids: p.exam_area_ids.includes(id)
        ? p.exam_area_ids.filter((areaId) => areaId !== id)
        : [...p.exam_area_ids, id],
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push("/specialties")}
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

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Tên chuyên khoa *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: Tim mạch"
              />
              <Input
                label="Nhóm đặt khám"
                value={form.booking_group}
                onChange={(e) => setForm((p) => ({ ...p, booking_group: e.target.value }))}
                placeholder="VD: NHOM_1"
              />
              <Input
                label="Ưu tiên hiển thị"
                type="number"
                value={form.display_priority}
                onChange={(e) => setForm((p) => ({ ...p, display_priority: e.target.value }))}
                placeholder="VD: 1"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className={TEXTAREA_CLASS}
                placeholder="Nhập mô tả chuyên khoa"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hướng dẫn đến phòng khám</label>
              <div className="specialty-instruction-editor min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                <TextEditor
                  content={form.room_visit_instruction}
                  onChangeContent={(content) => setForm((p) => ({ ...p, room_visit_instruction: content }))}
                  contentClassName="min-h-[180px] [overflow-wrap:anywhere]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú đặt khám</label>
              <textarea
                value={form.booking_note}
                onChange={(e) => setForm((p) => ({ ...p, booking_note: e.target.value }))}
                rows={4}
                className={TEXTAREA_CLASS}
                placeholder="Nhập lưu ý khi bệnh nhân đặt khám"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Khu vực khám</label>
              <p className="mb-2 text-xs text-slate-400">Chọn các khu vực khám sẽ được gán cho chuyên khoa này.</p>
              {selectedAreas.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedAreas.map((area) => (
                    <span key={area.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                      <MapPin className="h-3 w-3" />
                      {area.name}
                      <button type="button" onClick={() => toggleExamArea(area.id)} className="text-primary-400 hover:text-primary-700" title="Bỏ chọn">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                {examAreas.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">Chưa có khu vực khám nào.</p>
                ) : (
                  examAreas.map((area) => (
                    <label key={area.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={form.exam_area_ids.includes(area.id)}
                        onChange={() => toggleExamArea(area.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-700">{area.name}</span>
                        {area.address && <span className="block truncate text-xs text-slate-400">{area.address}</span>}
                      </span>
                      {area.short_name && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{area.short_name}</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span>
                <span className="block text-sm font-medium text-slate-700">Hoạt động</span>
                <span className="text-xs text-slate-400">Tắt nếu chuyên khoa tạm ngưng sử dụng.</span>
              </span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                {submitLabel}
              </button>
              <button
                type="button"
                onClick={() => router.push("/specialties")}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Xem trước</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Thông tin chuyên khoa sẽ hiển thị như bên dưới.</p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-800">{form.name.trim() || "Tên chuyên khoa"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{form.description.trim() || "Chưa có mô tả"}</p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><ClipboardList className="h-4 w-4" /> Nhóm đặt khám</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">{form.booking_group.trim() || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><ClipboardList className="h-4 w-4" /> Ưu tiên</dt>
                  <dd className="font-medium text-slate-700">{form.display_priority.trim() || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Trạng thái</dt>
                  <dd className={form.is_active ? "font-medium text-emerald-600" : "font-medium text-slate-500"}>
                    {form.is_active ? "Hoạt động" : "Tạm ngưng"}
                  </dd>
                </div>
              </dl>

              {form.room_visit_instruction.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Hướng dẫn đến phòng khám</p>
                  <div
                    className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: form.room_visit_instruction }}
                  />
                </div>
              )}

              {form.booking_note.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Ghi chú đặt khám</p>
                  <p className="mt-1 text-sm text-slate-700">{form.booking_note.trim()}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
