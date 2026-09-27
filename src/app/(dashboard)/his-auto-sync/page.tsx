"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Cog,
  HelpCircle,
  Info,
  Play,
  RefreshCw,
} from "lucide-react";
import {
  hisAutoSyncConfigHooks,
  type HisAutoSyncCategorySummary,
  type HisAutoSyncRunStatus,
} from "@/api/hisAutoSyncConfigApi";
import { toast } from "@/components/ui/Toast";
import { PermissionGuard, AccessDenied } from "@/components/auth/PermissionGuard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { LoadingSection } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

// ─── Time helpers ────────────────────────────────────────────────────────────
// BE dùng "HH:mm:ss"; UI chỉ hiển thị/chỉnh giờ:phút, không hiển thị giây.

/** "02:00:00" (BE) -> "02:00" (UI, input type="time" mặc định không có giây). */
function toDisplayTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

/** "02:00" (UI) -> "02:00:00" (BE). */
function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

/** last_run_at (ISO) -> "27/09/2026 02:00:03". FE không tự quy đổi timezone,
 * chỉ hiển thị đúng giá trị BE trả về. */
function formatRunAt(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${date} ${time}`;
}

// ─── Trạng thái lần chạy ─────────────────────────────────────────────────────
// Luôn ưu tiên field last_run_status từ BE, không tự suy luận theo số lượng lỗi.

const RUN_STATUS_LABEL: Record<HisAutoSyncRunStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  SUCCESS: { label: "Thành công", variant: "success" },
  PARTIAL: { label: "Thành công một phần", variant: "warning" },
  FAILED: { label: "Thất bại", variant: "danger" },
};

function RunStatusBadge({ status }: { status: HisAutoSyncRunStatus | null }) {
  if (!status) return <Badge variant="default">Chưa chạy lần nào</Badge>;
  const info = RUN_STATUS_LABEL[status];
  return <Badge variant={info.variant}>{info.label}</Badge>;
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

function StatCell({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={cn("text-xl font-bold", className)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CategoryStatCard({
  title,
  description,
  summary,
  status,
  errorTitle,
}: {
  title: string;
  description: string;
  summary: HisAutoSyncCategorySummary | undefined;
  status: HisAutoSyncRunStatus | null;
  errorTitle: string;
}) {
  const hasMessage = !!summary?.message;
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {!hasMessage && <RunStatusBadge status={status} />}
      </div>

      {hasMessage ? (
        // Nhóm này có message riêng (thường kèm số liệu = 0) -> ưu tiên hiển thị lỗi,
        // không hiển thị "0 tổng/0 thành công/..." gây hiểu nhầm là không có gì xảy ra.
        <div className="mt-3 flex flex-1 items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{errorTitle}</p>
            <p className="mt-0.5 text-red-600">{summary?.message}</p>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell label="Tổng số" value={summary?.total ?? 0} className="text-slate-800" />
          <StatCell label="Thành công" value={summary?.success ?? 0} className="text-success" />
          <StatCell label="Lỗi" value={summary?.error ?? 0} className="text-error" />
          <StatCell label="Bỏ qua" value={summary?.skipped ?? 0} className="text-slate-500" />
        </div>
      )}
    </div>
  );
}

// ─── Form cấu hình ───────────────────────────────────────────────────────────

interface EditableForm {
  is_enabled: boolean;
  /** "HH:mm" — dạng hiển thị/chỉnh sửa trên UI, không có giây. */
  sync_time: string;
}

function HisAutoSyncConfigContent() {
  const { data: config, isLoading, isFetching, refetch } = hisAutoSyncConfigHooks.useConfig();
  const [form, setForm] = useState<EditableForm | null>(null);

  // Chỉ nạp form từ dữ liệu server 1 lần (lần load đầu) để tránh đè nội dung
  // người dùng đang chỉnh khi query refetch nền (invalidate sau run-now, "Làm mới"...).
  useEffect(() => {
    if (config && form === null) {
      setForm({ is_enabled: config.is_enabled, sync_time: toDisplayTime(config.sync_time) });
    }
  }, [config, form]);

  const updateMutation = hisAutoSyncConfigHooks.useUpdateConfig({
    onSuccess: (data) => {
      setForm({ is_enabled: data.is_enabled, sync_time: toDisplayTime(data.sync_time) });
      toast.success("Đã lưu cấu hình đồng bộ");
    },
    onError: (err) => toast.error(err.message || "Lưu cấu hình thất bại"),
  });

  const runNowMutation = hisAutoSyncConfigHooks.useRunNow({
    onSuccess: (data) => {
      if (!data.started) {
        // started = false không phải lỗi — chỉ là không có gì để chạy hoặc đang
        // có 1 lần đồng bộ khác chạy dở, BE tự chịu trách nhiệm quyết định.
        toast.warning("Đang có 1 lần đồng bộ khác đang chạy, vui lòng thử lại sau.");
        return;
      }
      toast.success("Đồng bộ hoàn tất");
    },
    onError: (err) => toast.error(err.message || "Không thể chạy đồng bộ HIS ngay bây giờ"),
  });

  if (isLoading || !form) {
    return <LoadingSection text="Đang tải cấu hình đồng bộ tự động HIS..." />;
  }

  const isDirty =
    !!config && (form.is_enabled !== config.is_enabled || form.sync_time !== toDisplayTime(config.sync_time));

  function handleSave() {
    if (!form) return;
    updateMutation.mutate({ is_enabled: form.is_enabled, sync_time: toApiTime(form.sync_time) });
  }

  const neverRun = !config?.last_run_status && !config?.last_run_at;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Đồng bộ tự động lên HIS</h1>
          <span title="Cấu hình lịch chạy tự động hằng ngày và theo dõi kết quả đồng bộ lịch khám/bệnh nhân lên HIS.">
            <HelpCircle className="h-5 w-5 text-primary-400" />
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cấu hình lịch chạy tự động hằng ngày để đẩy lịch khám và bệnh nhân đủ điều kiện lên HIS,
          và có thể chạy ngay thủ công khi cần.
        </p>
      </div>

      {/* Khối 1 — Cấu hình */}
      <Card>
        <CardContent className="space-y-4">
          <SectionHeader
            icon={CalendarClock}
            iconClassName="bg-primary-50 text-primary-600"
            title="Cấu hình"
            description="Bật/tắt và chọn giờ chạy tự động hằng ngày theo giờ Việt Nam."
            action={
              <Button
                onClick={handleSave}
                disabled={!isDirty || updateMutation.isPending}
                isLoading={updateMutation.isPending}
                loadingText="Đang lưu..."
              >
                <Play className="h-4 w-4" />
                Lưu cấu hình
              </Button>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Bật đồng bộ tự động hằng ngày</span>
                <Toggle checked={form.is_enabled} onChange={(checked) => setForm({ ...form, is_enabled: checked })} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Giờ chạy hằng ngày (giờ Việt Nam)
                </label>
                {/* Dùng 2 <select> giờ/phút thay vì <input type="time"> — picker giờ
                   của trình duyệt render theo locale hệ điều hành nên có máy ra dạng
                   12h (SA/CH) gây khó thao tác; 2 select luôn hiển thị đúng 24h. */}
                <div className="flex max-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-surface-secondary px-3">
                  <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
                  <select
                    value={form.sync_time.slice(0, 2)}
                    onChange={(e) => setForm({ ...form, sync_time: `${e.target.value}:${form.sync_time.slice(3, 5)}` })}
                    className="h-11 flex-1 bg-transparent text-sm outline-none"
                    aria-label="Giờ"
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-sm text-slate-400">:</span>
                  <select
                    value={form.sync_time.slice(3, 5)}
                    onChange={(e) => setForm({ ...form, sync_time: `${form.sync_time.slice(0, 2)}:${e.target.value}` })}
                    className="h-11 flex-1 bg-transparent text-sm outline-none"
                    aria-label="Phút"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p>Hệ thống sẽ tự động chạy mỗi ngày vào giờ đã cấu hình (giờ Việt Nam).</p>
                  <p>Nếu giờ đã cấu hình đã qua trong hôm nay, hệ thống sẽ tự chạy trong vài phút tới.</p>
                </div>
              </div>

              {isDirty && <p className="text-xs font-medium text-amber-600">Có thay đổi chưa được lưu.</p>}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Info className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Lưu ý</h3>
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-emerald-800">
                <li>Giờ chạy được hiểu theo giờ Việt Nam (Asia/Ho_Chi_Minh).</li>
                <li>Mỗi ngày chỉ chạy tối đa 1 lần theo lịch tự động.</li>
                <li>Bạn vẫn có thể bấm &quot;Đồng bộ ngay&quot; bất cứ lúc nào.</li>
                <li>Lần chạy thủ công không ảnh hưởng giới hạn 1 lần/ngày của lịch tự động.</li>
                <li>Nếu đang có một lần đồng bộ chạy thì hệ thống sẽ không chạy chồng thêm lần khác.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Khối 2 — Kết quả lần chạy gần nhất */}
      <Card>
        <CardContent className="space-y-4">
          <SectionHeader
            icon={BarChart3}
            iconClassName="bg-violet-50 text-violet-600"
            title="Kết quả lần chạy gần nhất"
            description="Thông tin và thống kê của lần đồng bộ gần nhất (tự động hoặc thủ công)."
            action={
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching} isLoading={isFetching}>
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            }
          />

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Trạng thái</p>
              <div className="mt-1"><RunStatusBadge status={config?.last_run_status ?? null} /></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Thời gian chạy</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatRunAt(config?.last_run_at)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">(giờ Việt Nam)</span>
              </p>
            </div>
          </div>

          {neverRun ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <ClipboardList className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Chưa có lần đồng bộ nào</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Khi hệ thống chạy tự động hoặc bạn bấm &quot;Đồng bộ ngay&quot;, kết quả sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <CategoryStatCard
                title="Lịch hẹn khám"
                description="Tổng số lịch hẹn được xử lý trong lần chạy này."
                summary={config?.last_run_summary?.appointments}
                status={config?.last_run_status ?? null}
                errorTitle="Không thể đồng bộ lịch hẹn"
              />
              <CategoryStatCard
                title="Hồ sơ bệnh nhân"
                description="Tổng số hồ sơ bệnh nhân được xử lý trong lần chạy này."
                summary={config?.last_run_summary?.patients}
                status={config?.last_run_status ?? null}
                errorTitle="Không thể đồng bộ hồ sơ bệnh nhân"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Khối 3 — Chạy đồng bộ ngay */}
      <Card>
        <CardContent className="space-y-4">
          <SectionHeader
            icon={Cog}
            iconClassName="bg-slate-100 text-slate-600"
            title="Chạy đồng bộ ngay"
            description="Kích hoạt đồng bộ ngay lập tức, không cần chờ tới giờ đã cấu hình."
            action={
              <Button
                onClick={() => runNowMutation.mutate()}
                disabled={runNowMutation.isPending}
                isLoading={runNowMutation.isPending}
                loadingText="Đang đồng bộ..."
              >
                <Play className="h-4 w-4" />
                Đồng bộ ngay
              </Button>
            }
          />

          <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Nếu đang có một lần đồng bộ khác chạy, hệ thống sẽ không chạy chồng và sẽ thông báo cho bạn.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HisAutoSyncConfigPage() {
  return (
    <PermissionGuard
      permission="admin.all"
      fallback={<AccessDenied message="Bạn không có quyền quản lý đồng bộ tự động lên HIS" />}
    >
      <HisAutoSyncConfigContent />
    </PermissionGuard>
  );
}
