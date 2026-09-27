"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  ClipboardList,
  HelpCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  appointmentReminderConfigHooks,
  type AppointmentReminderConfig,
} from "@/api/appointmentReminderConfigApi";
import { toast } from "@/components/ui/Toast";
import { PermissionGuard, AccessDenied } from "@/components/auth/PermissionGuard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { LoadingSection } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

// ─── Validation ──────────────────────────────────────────────────────────────
// Backend chấp nhận số nguyên từ 1 đến 720 giờ (30 ngày) cho mỗi mốc nhắc.

const MIN_HOURS = 1;
const MAX_HOURS = 720;

function parseHours(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function validateHours(value: string): string | undefined {
  const n = parseHours(value);
  if (n === null) return "Vui lòng nhập số nguyên.";
  if (n < MIN_HOURS || n > MAX_HOURS) return `Số giờ phải nằm trong khoảng từ ${MIN_HOURS} đến ${MAX_HOURS}.`;
  return undefined;
}

// ─── Time helpers ────────────────────────────────────────────────────────────
// FE không tự quy đổi timezone — chỉ hiển thị đúng giá trị BE trả về (giờ Việt Nam).

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateTimeVN(date: Date): string {
  const d = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const t = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${d} · ${t}`;
}

function formatIsoDateTimeVN(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDateTimeVN(d);
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Ô nhập số giờ dạng khung bo góc + hậu tố "giờ", đồng bộ phong cách với các
 * control giờ khác trong khối quản trị (vd trang Đồng bộ tự động HIS). */
function HoursField({
  label,
  description,
  hint,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string;
  description: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary-500" />
        <p className="text-sm font-semibold text-slate-800">{label}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>

      <div
        className={cn(
          "mt-3 flex items-center gap-2 rounded-xl border bg-surface-secondary px-3",
          error ? "border-red-300" : "border-slate-200",
          disabled && "opacity-60",
        )}
      >
        <input
          type="number"
          inputMode="numeric"
          min={MIN_HOURS}
          max={MAX_HOURS}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-11 w-full flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="shrink-0 text-sm text-slate-400">giờ</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function TickStatCard({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Số thông báo đã gửi trong lần kiểm tra gần nhất.</p>
      </div>
      <div className="shrink-0 text-center">
        <p className="text-2xl font-bold text-primary-600">{count}</p>
        <p className="text-xs text-muted-foreground">thông báo đã gửi</p>
      </div>
    </div>
  );
}

// ─── Nội dung tĩnh "Cách hoạt động" / "Lưu ý" ────────────────────────────────

const HOW_IT_WORKS: string[] = [
  "Chỉ áp dụng với lịch khám đã thanh toán (PAID) hoặc đã xác nhận (CONFIRMED).",
  "Mỗi lịch khám được nhắc tối đa 2 lần.",
  "Mỗi mốc chỉ gửi đúng 1 lần.",
  "Hệ thống kiểm tra và gửi thông báo nhắc lịch mỗi 5 phút.",
  "Không gửi nhắc cho lịch đã quá giờ khám.",
  "Thời gian gửi thực tế có thể lệch tối đa khoảng 5 phút so với mốc đã cấu hình.",
  "Cấu hình sử dụng giờ Việt Nam (Asia/Ho_Chi_Minh).",
  "Tắt nhắc lịch chỉ dừng gửi thêm, không thu hồi các thông báo đã gửi trước đó.",
];

const NOTES: string[] = [
  "Mốc nhắc lần 2 nên nhỏ hơn mốc nhắc lần 1 để đảm bảo thứ tự thông báo hợp lý.",
  "Cấu hình mới được áp dụng ở lượt kiểm tra tiếp theo, tối đa khoảng 5 phút.",
  "Nếu một mốc đã được gửi rồi, đổi giờ lịch hẹn không tự động gửi lại mốc đó.",
  "Hiện không hỗ trợ bật/tắt riêng từng mốc — is_enabled áp dụng chung cho cả 2 mốc.",
];

// ─── Form cấu hình ───────────────────────────────────────────────────────────

interface EditableForm {
  is_enabled: boolean;
  reminder_1_hours_before: string;
  reminder_2_hours_before: string;
}

function toEditableForm(config: AppointmentReminderConfig): EditableForm {
  return {
    is_enabled: config.is_enabled,
    reminder_1_hours_before: String(config.reminder_1_hours_before),
    reminder_2_hours_before: String(config.reminder_2_hours_before),
  };
}

function AppointmentReminderConfigContent() {
  const { data: config, isLoading, isFetching, refetch } = appointmentReminderConfigHooks.useConfig();
  const [form, setForm] = useState<EditableForm | null>(null);

  // Chỉ nạp form từ dữ liệu server 1 lần (lần load đầu) để tránh đè nội dung
  // người dùng đang chỉnh khi query refetch nền ("Làm mới"...).
  useEffect(() => {
    if (config && form === null) {
      setForm(toEditableForm(config));
    }
  }, [config, form]);

  const updateMutation = appointmentReminderConfigHooks.useUpdateConfig({
    onSuccess: (data) => {
      setForm(toEditableForm(data));
      toast.success("Đã lưu cấu hình nhắc lịch khám");
    },
    onError: (err) => toast.error(err.message || "Lưu cấu hình thất bại"),
  });

  const reminder1Error = form ? validateHours(form.reminder_1_hours_before) : undefined;
  const reminder2Error = form ? validateHours(form.reminder_2_hours_before) : undefined;
  const hasValidationError = !!reminder1Error || !!reminder2Error;

  const isDirty =
    !!form &&
    !!config &&
    (form.is_enabled !== config.is_enabled ||
      form.reminder_1_hours_before !== String(config.reminder_1_hours_before) ||
      form.reminder_2_hours_before !== String(config.reminder_2_hours_before));

  // Cảnh báo nếu rời trang khi còn thay đổi chưa lưu.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (isLoading || !form) {
    return <LoadingSection text="Đang tải cấu hình nhắc lịch khám..." />;
  }

  const showOrderWarning =
    !hasValidationError &&
    Number(form.reminder_2_hours_before) >= Number(form.reminder_1_hours_before);

  function handleSave() {
    if (!form || hasValidationError) return;
    updateMutation.mutate({
      is_enabled: form.is_enabled,
      reminder_1_hours_before: Number(form.reminder_1_hours_before),
      reminder_2_hours_before: Number(form.reminder_2_hours_before),
    });
  }

  // Ví dụ minh hoạ (chỉ để preview giao diện, không dùng để quyết định logic backend):
  // lấy hôm nay lúc 08:00 làm mốc lịch hẹn mẫu.
  const previewAnchor = new Date();
  previewAnchor.setHours(8, 0, 0, 0);
  const reminder1Preview = new Date(
    previewAnchor.getTime() - (parseHours(form.reminder_1_hours_before) ?? 0) * 3600_000,
  );
  const reminder2Preview = new Date(
    previewAnchor.getTime() - (parseHours(form.reminder_2_hours_before) ?? 0) * 3600_000,
  );

  const neverTicked = !config?.last_tick_at;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Nhắc lịch khám</h1>
          <span title="Cấu hình thời điểm hệ thống tự động gửi thông báo nhắc bệnh nhân trước lịch khám.">
            <HelpCircle className="h-5 w-5 text-primary-400" />
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cấu hình thời điểm hệ thống tự động gửi thông báo nhắc bệnh nhân trước lịch khám.
        </p>
      </div>

      {/* Khối 1 — Cấu hình + Cách hoạt động / Lưu ý */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="space-y-4">
            <SectionHeader
              icon={Bell}
              iconClassName="bg-primary-50 text-primary-600"
              title="Cấu hình nhắc lịch"
              description="Thiết lập hai thời điểm gửi thông báo trước giờ hẹn."
              action={
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || hasValidationError || updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                  loadingText="Đang lưu..."
                >
                  Lưu cấu hình
                </Button>
              }
            />

            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <span className="text-sm font-medium text-slate-700">Bật nhắc lịch tự động</span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Khi bật, hệ thống sẽ tự động gửi thông báo cho các lịch đủ điều kiện.
                </p>
              </div>
              <Toggle
                size="lg"
                checked={form.is_enabled}
                onChange={(checked) => setForm({ ...form, is_enabled: checked })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HoursField
                label="Nhắc lần 1"
                description="Gửi trước lịch hẹn"
                hint="Phù hợp để bệnh nhân chủ động sắp xếp thời gian trước ngày khám."
                value={form.reminder_1_hours_before}
                onChange={(v) => setForm({ ...form, reminder_1_hours_before: v })}
                disabled={!form.is_enabled}
                error={reminder1Error}
              />
              <HoursField
                label="Nhắc lần 2"
                description="Gửi trước lịch hẹn"
                hint="Nhắc lại gần giờ khám để bệnh nhân chuẩn bị di chuyển đến bệnh viện."
                value={form.reminder_2_hours_before}
                onChange={(v) => setForm({ ...form, reminder_2_hours_before: v })}
                disabled={!form.is_enabled}
                error={reminder2Error}
              />
            </div>

            {showOrderWarning && (
              <p className="text-xs font-medium text-amber-600">
                Mốc nhắc lần 2 nên nhỏ hơn mốc nhắc lần 1 để đảm bảo thứ tự thông báo hợp lý.
              </p>
            )}

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarClock className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Ví dụ thời điểm gửi thông báo</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Với lịch khám ngày {formatDateTimeVN(previewAnchor).split(" · ")[0]} lúc{" "}
                {formatDateTimeVN(previewAnchor).split(" · ")[1]} (giờ Việt Nam), hệ thống sẽ gửi thông báo vào:
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Nhắc lần 1 ({form.reminder_1_hours_before || 0} giờ trước)
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateTimeVN(reminder1Preview)}
                  </p>
                </div>
                <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                  <p className="text-xs text-muted-foreground">
                    Nhắc lần 2 ({form.reminder_2_hours_before || 0} giờ trước)
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateTimeVN(reminder2Preview)}
                  </p>
                </div>
              </div>
            </div>

            {isDirty && <p className="text-xs font-medium text-amber-600">Có thay đổi chưa được lưu.</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Info className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Cách hoạt động</h3>
            </div>
            <ul className="mt-3 space-y-3">
              {HOW_IT_WORKS.map((text, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                    {i + 1}
                  </span>
                  <span className="text-sm text-emerald-800">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Lưu ý</h3>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-amber-800">
              {NOTES.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Khối 2 — Lần kiểm tra gần nhất */}
      <Card>
        <CardContent className="space-y-4">
          <SectionHeader
            icon={BarChart3}
            iconClassName="bg-violet-50 text-violet-600"
            title="Lần kiểm tra gần nhất"
            description="Thống kê kết quả của lượt job nhắc lịch gần nhất."
            action={
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching} isLoading={isFetching}>
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            }
          />

          {neverTicked ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <ClipboardList className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Chưa có dữ liệu lần kiểm tra</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Hệ thống chưa ghi nhận lượt job nhắc lịch nào.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <CheckCircle2 className="h-7 w-7 shrink-0 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Thời điểm kiểm tra</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatIsoDateTimeVN(config?.last_tick_at)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">(Giờ Việt Nam)</span>
                  </p>
                </div>
                <div className="ml-auto flex max-w-sm items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Số liệu chỉ phản ánh lần kiểm tra gần nhất của hệ thống (không phải tổng từ trước tới nay).</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TickStatCard
                  title={`Nhắc lần 1 (${config?.reminder_1_hours_before ?? "—"} giờ trước)`}
                  count={config?.last_tick_reminder_1_count ?? 0}
                />
                <TickStatCard
                  title={`Nhắc lần 2 (${config?.reminder_2_hours_before ?? "—"} giờ trước)`}
                  count={config?.last_tick_reminder_2_count ?? 0}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppointmentReminderConfigPage() {
  return (
    <PermissionGuard
      permission="admin.all"
      fallback={<AccessDenied message="Bạn không có quyền quản lý cấu hình nhắc lịch khám" />}
    >
      <AppointmentReminderConfigContent />
    </PermissionGuard>
  );
}
