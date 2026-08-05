"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, MapPin, Plus, ShieldPlus, Stethoscope, Tag, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import { toast } from "@/components/ui/Toast";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import type { HisServicePriceLevel } from "@/api/hisServicesApi";
import { formatCurrency } from "@/lib/utils";

// Các loại bảo hiểm — mỗi loại là một mức giá của dịch vụ. Chuỗi `insurancetype`
// của dịch vụ (vd "BHYT/VIP") suy ra từ chính các mức giá đã khai.
export const INSURANCE_OPTIONS = [
  { value: "BHYT", label: "BHYT" },
  { value: "KT", label: "Khám thường" },
  { value: "VIP", label: "Khám VIP" },
] as const;

/** Loại chọn sẵn cho mức giá đầu tiên khi tạo dịch vụ mới. */
const DEFAULT_PRICE_LEVEL_CODE = "VIP";

// Mã cũ đã đổi tên nhưng dữ liệu cũ trong DB vẫn còn lưu mã trước đó — quy về mã hiện hành
// để dịch vụ cũ vẫn hiển thị/sửa được bình thường.
const LEGACY_CODE_ALIASES: Record<string, string> = { DV: "VIP" };

function normalizeInsuranceCode(code: string): string {
  return LEGACY_CODE_ALIASES[code] ?? code;
}

function insuranceLabel(code: string): string {
  const normalized = normalizeInsuranceCode(code);
  return INSURANCE_OPTIONS.find((option) => option.value === normalized)?.label ?? code;
}

function isKnownInsuranceCode(code: string): boolean {
  return INSURANCE_OPTIONS.some((option) => option.value === normalizeInsuranceCode(code));
}

/** Một dòng mức giá trong form; `id` chỉ dùng làm key React. */
export type PriceLevelInput = {
  id: string;
  /** Mã loại bảo hiểm: BHYT | KT | VIP. */
  code: string;
  price: string;
  status: "ACTIVE" | "INACTIVE";
};

let priceLevelSeq = 0;
function createPriceLevelId(): string {
  priceLevelSeq += 1;
  return `price-level-${priceLevelSeq}`;
}

export function createPriceLevelRow(
  code = "",
  price = "",
  status: "ACTIVE" | "INACTIVE" = "ACTIVE"
): PriceLevelInput {
  return { id: createPriceLevelId(), code, price, status };
}

/**
 * Mức giá từ API → dòng form. Dòng ACTIVE đầu tiên luôn là mức mặc định (ghi vào cột
 * `price`) — không cho chọn thủ công, nên ưu tiên xếp mức đã đánh dấu `is_default`
 * (nếu có) lên đầu. Dịch vụ cũ chỉ có cột `price` + chuỗi `insurancetype` → dựng mỗi
 * loại bảo hiểm một dòng, cùng mức giá cũ.
 */
export function mapPriceLevelsToForm(
  levels: HisServicePriceLevel[] | undefined,
  fallbackPrice: string,
  fallbackInsuranceTypes: string[] = []
): PriceLevelInput[] {
  const known = (levels ?? []).filter((level) => isKnownInsuranceCode(level.code));
  if (known.length > 0) {
    const sorted = [...known].sort((a, b) => Number(b.is_default) - Number(a.is_default));
    return sorted.map((level) =>
      createPriceLevelRow(
        normalizeInsuranceCode(level.code),
        String(level.price),
        level.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
      )
    );
  }
  const legacyCodes = fallbackInsuranceTypes.filter(isKnownInsuranceCode).map(normalizeInsuranceCode);
  if (legacyCodes.length > 0) {
    return legacyCodes.map((code) => createPriceLevelRow(code, fallbackPrice));
  }
  return [createPriceLevelRow(DEFAULT_PRICE_LEVEL_CODE, fallbackPrice)];
}

/**
 * Dòng form → payload API (bỏ dòng trống). Mức mặc định (ghi vào cột `price`, dùng khi
 * tạo lịch khám) là dòng ACTIVE đầu tiên; nếu tất cả đều Tạm ngưng thì lấy dòng đầu tiên.
 */
export function serializePriceLevels(rows: PriceLevelInput[]): HisServicePriceLevel[] {
  const valid = rows.filter((row) => row.code && row.price.trim());
  const defaultIndex = Math.max(valid.findIndex((row) => row.status !== "INACTIVE"), 0);
  return valid.map((row, index) => ({
    code: row.code,
    label: insuranceLabel(row.code),
    price: Number(row.price) || 0,
    is_default: index === defaultIndex,
    status: row.status,
  }));
}

/** Chuỗi `insurancetype` ("BHYT/VIP") suy ra từ các mức giá đang Hoạt động. */
export function getInsuranceTypes(rows: PriceLevelInput[]): string {
  return Array.from(
    new Set(
      serializePriceLevels(rows)
        .filter((level) => level.status !== "INACTIVE")
        .map((level) => level.code)
    )
  ).join("/");
}

/** Mức giá mặc định — ghi vào cột `price` để các màn cũ (lịch khám, đặt khám) vẫn đọc được. */
export function getDefaultPrice(rows: PriceLevelInput[]): number | undefined {
  const levels = serializePriceLevels(rows);
  return (levels.find((level) => level.is_default) ?? levels[0])?.price;
}

// Khu vực khám / chuyên khoa / chi tiết DV KHÔNG bắt buộc: một dịch vụ (kèm bảng giá)
// dùng chung được cho nhiều chuyên khoa, phòng khám và khu khám khác nhau.
export type ServiceFormValues = {
  service_id: string;
  service_name: string;
  service_type: string;
  /** Mỗi loại bảo hiểm (BHYT/KT/VIP) là một mức giá; `insurancetype` suy ra từ đây. */
  price_levels: PriceLevelInput[];
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
    price_levels: [createPriceLevelRow(DEFAULT_PRICE_LEVEL_CODE, "")],
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

// Tách chuỗi "BHYT/KT/VIP" thành mảng mã loại bảo hiểm.
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
  // Chỉ lấy initialForm làm giá trị khởi tạo một lần (lazy init) — KHÔNG đồng bộ lại
  // mỗi khi component cha re-render, vì initialForm là object mới mỗi lần render
  // (mapServiceToForm/createInitialServiceForm tạo mới), nếu đồng bộ liên tục sẽ
  // ghi đè mất dữ liệu người dùng đang sửa (vd giá vừa nhập bị reset về giá cũ).
  // Khi cần load lại theo bản ghi khác, truyền `key` khác cho <ServiceForm /> để
  // React remount thay vì dựa vào effect này.
  const [form, setForm] = useState<ServiceFormValues>(initialForm);

  const { data: specialtiesData } = specialtiesHooks.useList();
  const specialties = specialtiesData?.rows ?? [];
  const { data: examAreasData } = examAreasHooks.useList();
  const examAreas = examAreasData?.rows ?? [];

  function updatePriceLevel(id: string, patch: Partial<PriceLevelInput>) {
    setForm((p) => ({
      ...p,
      price_levels: p.price_levels.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  }

  function addPriceLevel() {
    // Chọn sẵn loại bảo hiểm đầu tiên chưa dùng (mỗi loại chỉ khai một mức giá).
    setForm((p) => {
      const used = new Set(p.price_levels.map((row) => row.code));
      const next = INSURANCE_OPTIONS.find((option) => !used.has(option.value));
      if (!next) return p;
      return { ...p, price_levels: [...p.price_levels, createPriceLevelRow(next.value)] };
    });
  }

  function removePriceLevel(id: string) {
    setForm((p) => {
      if (p.price_levels.length <= 1) return p;
      return { ...p, price_levels: p.price_levels.filter((row) => row.id !== id) };
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.service_id.trim() || !form.service_name.trim()) {
      toast.error("Vui lòng nhập ID nội bộ và tên dịch vụ");
      return;
    }
    if (form.price_levels.some((row) => row.code && !row.price.trim())) {
      toast.error("Vui lòng nhập giá cho từng loại bảo hiểm đã khai báo");
      return;
    }
    if (serializePriceLevels(form.price_levels).length === 0) {
      toast.error("Vui lòng nhập ít nhất một mức giá khám");
      return;
    }
    onSubmit(form);
  }

  const defaultPrice = getDefaultPrice(form.price_levels);
  const usedInsuranceCodes = new Set(form.price_levels.map((row) => row.code).filter(Boolean));
  const canAddPriceLevel = usedInsuranceCodes.size < INSURANCE_OPTIONS.length;

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
                label="ID Nội Bộ *"
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
            {/* Bảng giá: một mã dịch vụ có thể có nhiều mức giá theo loại bảo hiểm (BHYT/KT/VIP). */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-foreground">
                  Bảng giá khám <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addPriceLevel}
                  disabled={!canAddPriceLevel}
                  title={canAddPriceLevel ? undefined : "Đã khai đủ các loại bảo hiểm"}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm mức giá
                </button>
              </div>
              <div className="space-y-2">
                {form.price_levels.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1.2fr_1fr_auto_auto] items-center gap-2">
                    <select
                      value={row.code}
                      onChange={(e) => updatePriceLevel(row.id, { code: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                    >
                      {INSURANCE_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          // Mỗi loại bảo hiểm chỉ khai một mức giá.
                          disabled={option.value !== row.code && usedInsuranceCodes.has(option.value)}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={row.price}
                      onChange={(e) => updatePriceLevel(row.id, { price: e.target.value })}
                      placeholder="VD: 230000"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                    />
                    <StatusSwitch
                      checked={row.status !== "INACTIVE"}
                      onChange={(next) => updatePriceLevel(row.id, { status: next ? "ACTIVE" : "INACTIVE" })}
                      title="Bật/tắt mức giá này"
                    />
                    <button
                      type="button"
                      onClick={() => removePriceLevel(row.id)}
                      disabled={form.price_levels.length <= 1}
                      title="Xóa mức giá"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Cùng một ID nội bộ khai được nhiều mức giá theo loại bảo hiểm. Mức giá Hoạt động đầu tiên
                được dùng khi tạo lịch khám; mức giá Tạm ngưng vẫn được lưu nhưng không tính vào loại bảo hiểm của dịch vụ.
              </p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50 px-3.5 py-2.5 text-xs text-primary-700">
              Khu vực khám, chuyên khoa và chi tiết dịch vụ là tùy chọn — để trống thì dịch vụ (kèm bảng giá)
              dùng chung được cho mọi chuyên khoa, phòng khám và khu khám.
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Khu vực khám <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
              </label>
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
              <label className="mb-1 block text-sm font-medium text-foreground">
                Chuyên khoa <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
              </label>
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
              label="Chi tiết dịch vụ (không bắt buộc)"
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
                <p className="text-xs text-muted-foreground">Bảng giá khám</p>
                <p className="mt-0.5 text-xl font-bold text-slate-800">
                  {defaultPrice !== undefined ? formatCurrency(defaultPrice) : "—"}
                </p>
                <dl className="mt-2 space-y-1.5 border-t border-slate-200 pt-2 text-sm">
                  {serializePriceLevels(form.price_levels).map((level) => (
                    <div key={level.code || level.label} className="flex items-center justify-between gap-3">
                      <dt className="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground">
                        {level.label}
                        {level.is_default && (
                          <span className="flex-shrink-0 rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-700">
                            Mặc định
                          </span>
                        )}
                        {level.status === "INACTIVE" && (
                          <span className="flex-shrink-0 rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            Tạm ngưng
                          </span>
                        )}
                      </dt>
                      <dd
                        className={`flex-shrink-0 font-medium ${level.status === "INACTIVE" ? "text-slate-400 line-through" : "text-slate-700"}`}
                      >
                        {formatCurrency(level.price)}
                      </dd>
                    </div>
                  ))}
                </dl>
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
                    {getInsuranceTypes(form.price_levels) || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Khu vực khám
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {examAreas.find((a) => a.id === form.exam_area_id)?.name || "Dùng chung"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="h-4 w-4" /> Chuyên khoa
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {specialties.find((s) => s.id === form.specialty_id)?.name || "Dùng chung"}
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
