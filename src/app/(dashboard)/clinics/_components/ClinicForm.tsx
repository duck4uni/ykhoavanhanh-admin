"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, DoorOpen, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { examAreasHooks } from "@/api/examAreasApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { useSpecialtyPicker } from "../hooks/useSpecialtyPicker";
import type { ClinicFormValues } from "../types";
import { PickerList, type PickerItem } from "./PickerList";

/** Cấu hình danh sách dịch vụ — do trang thêm (search + infinite scroll) và
 * trang sửa (list phẳng) cung cấp khác nhau. */
export interface ServicePickerConfig {
  items: PickerItem[];
  isFetching?: boolean;
  /** Có truyền search ⇒ hiện ô tìm kiếm (trang thêm). Bỏ trống ⇒ ẩn (trang sửa). */
  search?: string;
  onSearchChange?: (value: string) => void;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  emptyText: string;
}

interface ClinicFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialForm: ClinicFormValues;
  isSubmitting: boolean;
  onSubmit: (form: ClinicFormValues) => void;
  /** Chuyên khoa đã gán sẵn (trang sửa) để seed danh sách + preview. */
  initialSelectedSpecialties?: AdminSpecialty[];
  service: ServicePickerConfig;
  /** Reset key khi cần buộc TextEditor khởi tạo lại (vd sau khi detail tải xong). */
  editorResetKey?: string;
}

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

export function ClinicForm({
  title,
  subtitle,
  submitLabel,
  initialForm,
  isSubmitting,
  onSubmit,
  initialSelectedSpecialties,
  service,
  editorResetKey,
}: ClinicFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ClinicFormValues>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const { data: examAreasData } = examAreasHooks.useList({ pageSize: 100 });
  const examAreas = examAreasData?.rows ?? [];

  const specialtyPicker = useSpecialtyPicker({
    initialSelected: initialSelectedSpecialties,
    selectedIds: form.specialty_ids,
  });

  const specialtyItems: PickerItem[] = useMemo(
    () => specialtyPicker.specialties.map((s) => ({ id: s.id, title: s.name })),
    [specialtyPicker.specialties],
  );

  function toggleFromList(key: "specialty_ids" | "service_ids", id: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((item) => item !== id)
        : [...current[key], id],
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  const selectedSpecialtyNames =
    form.specialty_ids.length > 0
      ? form.specialty_ids
          .map(
            (id) => specialtyPicker.specialties.find((s) => s.id === id)?.name,
          )
          .filter(Boolean)
          .join(", ")
      : "—";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/clinics")}
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

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        {/* Form */}
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="ID nội bộ *"
                value={form.room_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room_id: e.target.value }))
                }
                placeholder="VD: PK01"
              />
              <Input
                label="Tên phòng khám *"
                value={form.room_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room_name: e.target.value }))
                }
                placeholder="VD: Phòng khám Nội tổng quát"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Khu khám bệnh
                </label>
                <select
                  value={form.exam_area_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, exam_area_id: e.target.value }))
                  }
                  className={SELECT_CLASS}
                >
                  <option value="">-- Chọn khu khám bệnh --</option>
                  {examAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Loại phòng khám"
                value={form.clinic_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clinic_type: e.target.value }))
                }
                placeholder="VD: OUTPATIENT"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Chuyên khoa của phòng khám
              </label>
              <Input
                value={specialtyPicker.search}
                onChange={(e) => specialtyPicker.setSearch(e.target.value)}
                placeholder="Tìm theo tên chuyên khoa..."
              />
              <PickerList
                items={specialtyItems}
                selectedIds={form.specialty_ids}
                onToggle={(id) => toggleFromList("specialty_ids", id)}
                isFetching={specialtyPicker.isFetching}
                onScroll={specialtyPicker.handleScroll}
                emptyText="Không tìm thấy chuyên khoa phù hợp."
                loadingText="Đang tải chuyên khoa..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Có thể chọn nhiều chuyên khoa cho cùng một phòng khám. Cuộn
                xuống để tải thêm.
              </p>
            </div>
            {/* Ẩn chọn dịch Dịch vụ của phòng khám sau này có thì mở ra */}
            {/* <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Dịch vụ của phòng khám</label>
              {service.onSearchChange && (
                <Input
                  value={service.search ?? ""}
                  onChange={(e) => service.onSearchChange?.(e.target.value)}
                  placeholder="Tìm theo tên dịch vụ..."
                />
              )}
              <PickerList
                items={service.items}
                selectedIds={form.service_ids}
                onToggle={(id) => toggleFromList("service_ids", id)}
                isFetching={service.isFetching}
                onScroll={service.onScroll}
                emptyText={service.emptyText}
                loadingText="Đang tải dịch vụ..."
                maxHeightClass="max-h-56"
              />
              <p className="mt-1 text-xs text-muted-foreground">Có thể chọn nhiều dịch vụ cho cùng một phòng khám.{service.onScroll ? " Cuộn xuống để tải thêm." : ""}</p>
            </div> */}

            <Input
              label="Mô tả khu khám"
              value={form.exam_area_description}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  exam_area_description: e.target.value,
                }))
              }
              placeholder="VD: Khu khám tầng 2"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Hướng dẫn vào khám
              </label>
              <div className="clinic-instruction-editor min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                <TextEditor
                  key={editorResetKey}
                  content={form.visit_instruction}
                  onChangeContent={(content) =>
                    setForm((p) => ({ ...p, visit_instruction: content }))
                  }
                  contentClassName="min-h-[180px] break-words [overflow-wrap:anywhere]"
                />
              </div>
            </div>
            <Input
              label="Mô tả"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Nhập mô tả phòng khám (không bắt buộc)"
            />

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
                onClick={() => router.push("/clinics")}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>

        {/* Xem trước */}
        <div className="min-w-0 lg:sticky lg:top-6">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Xem trước</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Thông tin phòng khám sẽ hiển thị như bên dưới.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-800">
                    {form.room_name.trim() || "Tên phòng khám"}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-primary-600">
                    {form.room_id.trim() || "ID nội bộ"}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Khu khám bệnh
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {examAreas.find((a) => a.id === form.exam_area_id)?.name ||
                      "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" /> Loại phòng khám
                  </dt>
                  <dd className="font-medium text-slate-700">
                    {form.clinic_type.trim() || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" /> Chuyên khoa
                  </dt>
                  <dd className="max-w-[60%] text-right font-medium text-slate-700">
                    {selectedSpecialtyNames}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <DoorOpen className="h-4 w-4" /> Mô tả khu khám
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {form.exam_area_description.trim() || "—"}
                  </dd>
                </div>
              </dl>

              {form.visit_instruction.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">
                    Hướng dẫn vào khám
                  </p>
                  <div
                    className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: form.visit_instruction }}
                  />
                </div>
              )}

              {form.description.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Mô tả</p>
                  <p className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]">
                    {form.description.trim()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
