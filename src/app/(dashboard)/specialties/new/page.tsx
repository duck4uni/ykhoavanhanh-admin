"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList, Save, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";

type SpecialtyForm = {
  name: string;
  description: string;
  is_active: boolean;
  room_visit_instruction: string;
  booking_note: string;
  booking_group: string;
  display_priority: string;
};

const initialForm: SpecialtyForm = {
  name: "",
  description: "",
  is_active: true,
  room_visit_instruction: "",
  booking_note: "",
  booking_group: "",
  display_priority: "",
};

function buildPayload(form: SpecialtyForm): Partial<AdminSpecialty> {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    is_active: form.is_active,
    room_visit_instruction: form.room_visit_instruction.trim() || null,
    booking_note: form.booking_note.trim() || null,
    booking_group: form.booking_group.trim() || null,
    display_priority: form.display_priority.trim() ? Number(form.display_priority) : null,
  };
}

export default function NewSpecialtyPage() {
  const router = useRouter();
  const [form, setForm] = useState<SpecialtyForm>(initialForm);

  const createMutation = specialtiesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo chuyên khoa thành công");
      router.push("/specialties");
    },
    onError: (err) => toast.error(err.message || "Tạo chuyên khoa thất bại"),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên khoa");
      return;
    }
    createMutation.mutate(buildPayload(form));
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
          <h1 className="text-2xl font-bold text-foreground">Thêm chuyên khoa mới</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo chuyên khoa và cấu hình thông tin đặt khám theo API specialties.</p>
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
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nhập lưu ý khi bệnh nhân đặt khám"
            />
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
                disabled={createMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {createMutation.isPending ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Tạo chuyên khoa
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
