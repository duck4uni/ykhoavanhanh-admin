"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  HelpCircle,
  Info,
  Lock,
  RefreshCw,
  Unlock,
} from "lucide-react";
import {
  appointmentBookingConfigHooks,
  type AppointmentBookingConfig,
} from "@/api/appointmentBookingConfigApi";
import { toast } from "@/components/ui/Toast";
import { PermissionGuard, AccessDenied } from "@/components/auth/PermissionGuard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { LoadingSection } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

// ─── Validation ──────────────────────────────────────────────────────────────
// Backend giới hạn `disabled_message` tối đa 1000 ký tự (đã trim).

const MAX_MESSAGE_LENGTH = 1000;

/** Câu backend dùng khi admin để trống lý do — hiển thị để admin biết trước. */
const DEFAULT_DISABLED_MESSAGE =
  "Chức năng đặt lịch khám đang tạm ngưng, vui lòng liên hệ hotline của bệnh viện để được hỗ trợ.";

function validateMessage(value: string): string | undefined {
  if (value.trim().length > MAX_MESSAGE_LENGTH) {
    return `Lý do không được dài quá ${MAX_MESSAGE_LENGTH} ký tự.`;
  }
  return undefined;
}

// ─── Time helpers ────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatIsoDateTimeVN(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
      {action}
    </div>
  );
}

// ─── Nội dung tĩnh ───────────────────────────────────────────────────────────

const WHEN_CLOSED: string[] = [
  "Bệnh nhân KHÔNG đặt được lịch mới trên app — ứng dụng hiện đúng lý do bên dưới.",
  "Tiếp tân và super admin VẪN lập được lịch hộ bệnh nhân tại viện.",
  "Lịch đã đặt không bị ảnh hưởng: vẫn xem, thanh toán, huỷ, hoàn tiền bình thường.",
  "Nhắc lịch khám và đồng bộ HIS vẫn chạy như thường.",
  "Màn báo giá trên app vẫn hoạt động, nên người dùng không thấy lỗi lạ giữa luồng.",
];

const NOTES: string[] = [
  "Có hiệu lực NGAY LẬP TỨC, không cần restart server hay ép app cập nhật.",
  "App đọc trạng thái mỗi phút, nên nút đặt lịch có thể còn hiện tối đa ~1 phút sau khi tắt — nhưng backend đã chặn ngay, không lịch nào lọt qua.",
  "Nếu để trống lý do, hệ thống dùng câu mặc định có sẵn.",
  "Tắt công tắc này không huỷ lịch nào đã đặt trước đó.",
];

// ─── Form ────────────────────────────────────────────────────────────────────

interface EditableForm {
  is_enabled: boolean;
  disabled_message: string;
}

function toEditableForm(config: AppointmentBookingConfig): EditableForm {
  return {
    is_enabled: config.is_enabled,
    disabled_message: config.disabled_message ?? "",
  };
}

function AppointmentBookingConfigContent() {
  const { data: config, isLoading, isFetching, refetch } = appointmentBookingConfigHooks.useConfig();
  const [form, setForm] = useState<EditableForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Chỉ nạp form từ dữ liệu server 1 lần (lần load đầu) để tránh đè nội dung
  // người dùng đang chỉnh khi query refetch nền ("Làm mới"...).
  useEffect(() => {
    if (config && form === null) {
      setForm(toEditableForm(config));
    }
  }, [config, form]);

  const updateMutation = appointmentBookingConfigHooks.useUpdateConfig({
    onSuccess: (data) => {
      setForm(toEditableForm(data));
      setConfirmOpen(false);
      toast.success(
        data.is_enabled
          ? "Đã mở lại chức năng đặt lịch khám trên app"
          : "Đã tạm ngưng chức năng đặt lịch khám trên app",
      );
    },
    onError: (err) => {
      setConfirmOpen(false);
      toast.error(err.message || "Lưu cấu hình thất bại");
    },
  });

  const messageError = form ? validateMessage(form.disabled_message) : undefined;
  const hasValidationError = !!messageError;

  const isDirty =
    !!form &&
    !!config &&
    (form.is_enabled !== config.is_enabled ||
      form.disabled_message.trim() !== (config.disabled_message ?? "").trim());

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
    return <LoadingSection text="Đang tải cấu hình đặt lịch khám..." />;
  }

  function submit() {
    if (!form || hasValidationError) return;
    const trimmed = form.disabled_message.trim();
    updateMutation.mutate({
      is_enabled: form.is_enabled,
      // Chuỗi rỗng -> null: xoá lý do, backend quay về câu mặc định.
      disabled_message: trimmed === "" ? null : trimmed,
    });
  }

  /** Đang MỞ mà bấm lưu để ĐÓNG -> hỏi lại, vì sẽ chặn ngay toàn bộ bệnh nhân. */
  function handleSave() {
    if (!form || hasValidationError) return;
    const isClosingNow = config?.is_enabled === true && form.is_enabled === false;
    if (isClosingNow) {
      setConfirmOpen(true);
      return;
    }
    submit();
  }

  const isCurrentlyOpen = config?.is_enabled === true;
  const effectiveMessage = form.disabled_message.trim() || DEFAULT_DISABLED_MESSAGE;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Đóng/mở đặt lịch khám</h1>
          <span title="Tạm ngưng việc bệnh nhân tự đặt lịch khám trên app, kèm lý do hiển thị cho người dùng.">
            <HelpCircle className="h-5 w-5 text-primary-400" />
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạm ngưng việc bệnh nhân tự đặt lịch khám trên app, kèm lý do hiển thị cho người dùng.
        </p>
      </div>

      {/* Trạng thái hiện tại — đọc từ server, không phải giá trị đang chỉnh dở */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  isCurrentlyOpen ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
                )}
              >
                {isCurrentlyOpen ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {isCurrentlyOpen ? "Đang cho đặt lịch" : "Đang tạm ngưng đặt lịch"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Cập nhật lần cuối: {formatIsoDateTimeVN(config?.updated_at)}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()} isLoading={isFetching} loadingText="Đang tải...">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Cấu hình */}
        <Card>
          <CardContent className="space-y-4">
            <SectionHeader
              icon={CalendarX2}
              iconClassName="bg-primary-50 text-primary-600"
              title="Cấu hình"
              description="Bật/tắt chức năng đặt lịch trên app và soạn lý do hiển thị."
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
                <span className="text-sm font-medium text-slate-700">Cho phép đặt lịch khám trên app</span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tắt để tạm ngưng tiếp nhận lịch mới từ bệnh nhân. Tiếp tân vẫn lập lịch được.
                </p>
              </div>
              <Toggle
                size="lg"
                checked={form.is_enabled}
                onChange={(checked) => setForm({ ...form, is_enabled: checked })}
              />
            </div>

            {/* Lý do: chỉ có tác dụng khi đang tắt, nên làm mờ khi đang bật */}
            <div
              className={cn(
                "rounded-xl border border-slate-200 p-4",
                form.is_enabled && "opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-500" />
                <p className="text-sm font-semibold text-slate-800">Lý do hiển thị cho người dùng</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {form.is_enabled
                  ? "Chỉ hiển thị khi chức năng đặt lịch đang tắt."
                  : "Người dùng sẽ thấy đúng nội dung này trên app."}
              </p>

              <textarea
                rows={3}
                value={form.disabled_message}
                maxLength={MAX_MESSAGE_LENGTH + 50}
                onChange={(e) => setForm({ ...form, disabled_message: e.target.value })}
                placeholder={DEFAULT_DISABLED_MESSAGE}
                aria-label="Lý do hiển thị cho người dùng"
                className={cn(
                  "mt-3 w-full resize-y rounded-xl border bg-surface-secondary px-3 py-2.5 text-sm outline-none",
                  messageError ? "border-red-300" : "border-slate-200",
                )}
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                {messageError ? (
                  <p className="text-xs text-red-600">{messageError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Để trống sẽ dùng câu mặc định của hệ thống.
                  </p>
                )}
                <p
                  className={cn(
                    "shrink-0 text-xs",
                    form.disabled_message.trim().length > MAX_MESSAGE_LENGTH
                      ? "text-red-600"
                      : "text-muted-foreground",
                  )}
                >
                  {form.disabled_message.trim().length}/{MAX_MESSAGE_LENGTH}
                </p>
              </div>
            </div>

            {/* Xem trước đúng câu người dùng sẽ thấy */}
            {!form.is_enabled && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-900">Người dùng trên app sẽ thấy</p>
                </div>
                <p className="mt-2 text-sm text-amber-900">{effectiveMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Giải thích */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3">
              <SectionHeader
                icon={Lock}
                iconClassName="bg-red-50 text-red-600"
                title="Khi tạm ngưng"
              />
              <ul className="space-y-2">
                {WHEN_CLOSED.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <SectionHeader icon={Info} iconClassName="bg-sky-50 text-sky-600" title="Lưu ý" />
              <ul className="space-y-2">
                {NOTES.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hỏi lại trước khi đóng: tác động tới toàn bộ bệnh nhân trên app */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Tạm ngưng đặt lịch khám trên app?"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              isLoading={updateMutation.isPending}
              loadingText="Đang lưu..."
            >
              Tạm ngưng
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Ngay sau khi lưu, <strong>bệnh nhân sẽ không đặt được lịch khám mới trên app</strong>. Tiếp
            tân và super admin vẫn lập lịch hộ được, và các lịch đã đặt không bị ảnh hưởng.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">Người dùng sẽ thấy:</p>
            <p className="mt-1 text-sm text-amber-900">{effectiveMessage}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AppointmentBookingConfigPage() {
  return (
    <PermissionGuard
      superAdminOnly
      fallback={<AccessDenied message="Bạn không có quyền quản lý cấu hình đặt lịch khám" />}
    >
      <AppointmentBookingConfigContent />
    </PermissionGuard>
  );
}
