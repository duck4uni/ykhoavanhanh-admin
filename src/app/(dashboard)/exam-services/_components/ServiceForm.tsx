"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, MapPin, ShieldPlus, Stethoscope, Tag } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { formatCurrency } from "@/lib/utils";

// Các loại bảo hiểm chọn được; lưu dạng chuỗi ngăn cách "/" (vd "BHXH/BHT/DV").
export const INSURANCE_OPTIONS = [
  { value: "BHYT", label: "BHYT" },
  { value: "BHXH", label: "BHXH" },
  { value: "BHT", label: "BHT" },
  { value: "DV", label: "Dịch vụ (DV)" },
] as const;

export type ServiceFormValues = {
  service_id: string;
  service_name: string;
  service_type: string;
  price: string;
  insurance_types: string[];
  exam_area_id: string;
  specialty_id: string;
  description: string;
  booking_note: string;
  display_group: string;
  display_priority: string;
  room_visit_instruction: string;
  detail: string;
};

export function createInitialServiceForm(): ServiceFormValues {
  return {
    service_id: "",
    service_name: "",
    service_type: "",
    price: "",
    insurance_types: [],
    exam_area_id: "",
    specialty_id: "",
    description: "",
    booking_note: "",
    display_group: "",
    display_priority: "",
    room_visit_instruction: "",
    detail: "",
  };
}

// Tách chuỗi "BHYT/BHXH/BHT/DV" thành mảng để map lại checkbox.
export function parseInsuranceTypes(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split("/")
    .map((v) => v.trim())
    .filter(Boolean);
}

type Props = {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialForm: ServiceFormValues;
  isSubmitting: boolean;
  /** Khóa mã dịch vụ khi sửa (mã là unique key theo cơ sở). */
  lockServiceId?: boolean;
  onSubmit: (form: ServiceFormValues) => void;
};

export function ServiceForm({
  title,
  subtitle,
  submitLabel,
  initialForm,
  isSubmitting,
  lockServiceId = false,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ServiceFormValues>(initialForm);

  const { data: specialtiesData } = specialtiesHooks.useList();
  const specialties = specialtiesData?.rows ?? [];
  const { data: examAreasData } = examAreasHooks.useList();
  const examAreas = examAreasData?.rows ?? [];

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function toggleInsurance(value: string) {
    setForm((p) => ({
      ...p,
      insurance_types: p.insurance_types.includes(value)
        ? p.insurance_types.filter((v) => v !== value)
        : [...p.insurance_types, value],
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.service_id.trim() || !form.service_name.trim()) {
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/exam-services")}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Mã dịch vụ *"
                value={form.service_id}
                onChange={(e) => setForm((p) => ({ ...p, service_id: e.target.value }))}
                placeholder="VD: 51582"
                disabled={lockServiceId}
              />
              <Input
                label="Loại dịch vụ"
                value={form.service_type}
                onChange={(e) => setForm((p) => ({ ...p, service_type: e.target.value }))}
                placeholder="VD: KHÁM"
              />
            </div>
            <Input
              label="Tên dịch vụ *"
              value={form.service_name}
              onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))}
              placeholder="VD: Khám bệnh chăm sóc tích cực"
            />
            <Input
              label="Giá (đ)"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="VD: 500000"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Loại bảo hiểm</label>
              <div className="flex flex-wrap gap-2">
                {INSURANCE_OPTIONS.map((option) => {
                  const checked = form.insurance_types.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                        checked
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleInsurance(option.value)}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Khu vực khám</label>
              <select
                value={form.exam_area_id}
                onChange={(e) => setForm((p) => ({ ...p, exam_area_id: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              >
                <option value="">Chọn khu vực khám</option>
                {examAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Chuyên khoa</label>
              <select
                value={form.specialty_id}
                onChange={(e) => setForm((p) => ({ ...p, specialty_id: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              >
                <option value="">Chọn chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Chi tiết dịch vụ"
              value={form.detail}
              onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
              placeholder="VD: Dịch vụ khám tổng quát"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Hướng dẫn vào phòng khám</label>
              <div className="service-instruction-editor min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                <TextEditor
                  key={`${form.service_id}-${initialForm.room_visit_instruction}`}
                  content={form.room_visit_instruction}
                  onChangeContent={(content) => setForm((p) => ({ ...p, room_visit_instruction: content }))}
                  contentClassName="min-h-[180px] [overflow-wrap:anywhere]"
                />
              </div>
            </div>
            <Input
              label="Ghi chú đặt khám"
              value={form.booking_note}
              onChange={(e) => setForm((p) => ({ ...p, booking_note: e.target.value }))}
              placeholder="VD: Cần nhịn ăn trước khi khám"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nhóm hiển thị"
                type="number"
                value={form.display_group}
                onChange={(e) => setForm((p) => ({ ...p, display_group: e.target.value }))}
                placeholder="VD: 1"
              />
              <Input
                label="Ưu tiên hiển thị"
                type="number"
                value={form.display_priority}
                onChange={(e) => setForm((p) => ({ ...p, display_priority: e.target.value }))}
                placeholder="VD: 10"
              />
            </div>
            <Input
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả dịch vụ (không bắt buộc)"
            />
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting && <Spinner size="sm" />}{submitLabel}
              </button>
              <button
                type="button"
                onClick={() => router.push("/exam-services")}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>

        {/* Xem trước */}
        <div className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Xem trước</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Thông tin dịch vụ sẽ hiển thị như bên dưới.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-800">
                    {form.service_name.trim() || "Tên dịch vụ"}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-primary-600">
                    {form.service_id.trim() || "Mã dịch vụ"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-muted-foreground">Giá dịch vụ</p>
                <p className="mt-0.5 text-xl font-bold text-slate-800">
                  {form.price.trim() ? formatCurrency(Number(form.price) || 0) : "—"}
                </p>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" /> Loại dịch vụ
                  </dt>
                  <dd className="font-medium text-slate-700">
                    {form.service_type.trim() || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <ShieldPlus className="h-4 w-4" /> Loại bảo hiểm
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {form.insurance_types.length > 0 ? form.insurance_types.join("/") : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Khu vực khám
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {examAreas.find((a) => a.id === form.exam_area_id)?.name || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="h-4 w-4" /> Chuyên khoa
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {specialties.find((s) => s.id === form.specialty_id)?.name || "—"}
                  </dd>
                </div>
              </dl>

              {form.detail.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Chi tiết dịch vụ</p>
                  <p className="mt-1 text-sm text-slate-700">{form.detail.trim()}</p>
                </div>
              )}
              {form.room_visit_instruction.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Hướng dẫn vào phòng khám</p>
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
              {form.description.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Mô tả</p>
                  <p className="mt-1 text-sm text-slate-700">{form.description.trim()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
