"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notificationsHooks, type NotificationCategory, type NotificationSubCategory } from "@/api/notificationsApi";
import { useUsersList } from "@/api/userApi";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, Bell, CalendarClock, Send, UserRound } from "lucide-react";

const CATEGORIES: { value: NotificationCategory; label: string }[] = [
  { value: "APPOINTMENT", label: "Lịch hẹn" },
  { value: "SYSTEM", label: "Hệ thống" },
];

const SUB_CATEGORIES: { value: NotificationSubCategory; label: string }[] = [
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "REMINDER", label: "Nhắc hẹn" },
  { value: "SYSTEM", label: "Hệ thống" },
];

function formatDateTime(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function NewNotificationPage() {
  const router = useRouter();
  const createMutation = notificationsHooks.useCreate();
  const { data: usersData, isLoading: usersLoading } = useUsersList({ pageSize: 100 });

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "SYSTEM" as NotificationCategory,
    sub_category: "" as NotificationSubCategory | "",
    belongs_to_user_id: "",
    sent_time: "",
    expired_at: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Vui lòng nhập tiêu đề";
    if (!form.content.trim()) e.content = "Vui lòng nhập nội dung";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      has_user_read: false,
      has_noti_sent: false,
    };
    if (form.sub_category) payload.sub_category = form.sub_category;
    if (form.belongs_to_user_id.trim()) payload.belongs_to_user_id = form.belongs_to_user_id.trim();
    if (form.sent_time) payload.sent_time = new Date(form.sent_time).toISOString();
    if (form.expired_at) payload.expired_at = new Date(form.expired_at).toISOString();

    createMutation.mutate(payload, { onSuccess: () => router.push("/notifications") });
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const categoryLabel = CATEGORIES.find((item) => item.value === form.category)?.label ?? "Hệ thống";
  const subCategoryLabel = SUB_CATEGORIES.find((item) => item.value === form.sub_category)?.label;
  const selectedUser = usersData?.rows.find((user) => user.id === form.belongs_to_user_id);
  const recipientLabel = selectedUser
    ? selectedUser.full_name || selectedUser.phone || selectedUser.email || selectedUser.id
    : "Tất cả người dùng";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link href="/notifications">
          <Button variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" /> Quay lại</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo thông báo mới</h1>
          <p className="mt-0.5 text-sm text-gray-500">Soạn và gửi thông báo đến người dùng</p>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Card className="min-w-0">
          <CardHeader><CardTitle>Thông tin thông báo</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Tiêu đề *"
                required
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                error={errors.title}
                placeholder="Nhập tiêu đề thông báo"
              />

              <div>
                <label htmlFor="notification-content" className="mb-1 block text-sm font-medium text-foreground">
                  Nội dung <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="notification-content"
                  required
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={errors.content ? "notification-content-error" : undefined}
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={6}
                  className="flex w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Nhập nội dung thông báo"
                />
                {errors.content && <p id="notification-content-error" className="mt-1 text-sm text-destructive">{errors.content}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="notification-category" className="mb-1 block text-sm font-medium text-foreground">
                    Loại thông báo <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <select id="notification-category" required value={form.category} onChange={(e) => updateField("category", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                    {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="notification-sub-category" className="mb-1 block text-sm font-medium text-foreground">Phân loại phụ</label>
                  <select id="notification-sub-category" value={form.sub_category} onChange={(e) => updateField("sub_category", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                    <option value="">— Chọn —</option>
                    {SUB_CATEGORIES.map((subCategory) => <option key={subCategory.value} value={subCategory.value}>{subCategory.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notification-recipient" className="mb-1 block text-sm font-medium text-foreground">Người nhận</label>
                <select id="notification-recipient" value={form.belongs_to_user_id} onChange={(e) => updateField("belongs_to_user_id", e.target.value)} disabled={usersLoading} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50">
                  <option value="">— Tất cả người dùng —</option>
                  {usersData?.rows.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.phone || user.email || user.id}</option>)}
                </select>
                {usersLoading && <p className="mt-1 text-xs text-muted-foreground">Đang tải danh sách…</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="notification-sent-time" className="mb-1 block text-sm font-medium text-foreground">Thời gian gửi</label>
                  <input id="notification-sent-time" type="datetime-local" value={form.sent_time} onChange={(e) => updateField("sent_time", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                </div>
                <div>
                  <label htmlFor="notification-expired-at" className="mb-1 block text-sm font-medium text-foreground">Hết hạn</label>
                  <input id="notification-expired-at" type="datetime-local" value={form.expired_at} onChange={(e) => updateField("expired_at", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" variant="primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  Tạo thông báo
                </Button>
                <Link href="/notifications"><Button variant="outline" type="button">Hủy</Button></Link>
              </div>
              {createMutation.isError && <p className="text-sm text-destructive">{createMutation.error?.message || "Tạo thông báo thất bại"}</p>}
            </form>
          </CardContent>
        </Card>

        <aside className="min-w-0 xl:sticky xl:top-6" aria-labelledby="notification-preview-heading">
          <Card className="overflow-hidden border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 py-4">
              <CardTitle id="notification-preview-heading" className="text-base">Xem trước</CardTitle>
              <p className="text-xs text-muted-foreground">Nội dung sẽ cập nhật ngay khi bạn soạn.</p>
            </CardHeader>
            <CardContent className="p-5">
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-1 bg-primary" />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Bell className="h-5 w-5" aria-hidden="true" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{categoryLabel}</span>
                        {subCategoryLabel && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{subCategoryLabel}</span>}
                      </div>
                      <h2 className={`mt-3 break-words text-sm font-semibold ${form.title.trim() ? "text-slate-900" : "text-slate-400"}`}>{form.title.trim() || "Tiêu đề thông báo"}</h2>
                      <p className={`mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 ${form.content.trim() ? "text-slate-600" : "text-slate-400"}`}>{form.content.trim() || "Nội dung thông báo sẽ hiển thị tại đây."}</p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-500">
                      <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <dt className="sr-only">Người nhận</dt>
                      <dd className="break-words font-medium text-slate-700">{recipientLabel}</dd>
                    </div>
                    <div className="flex items-start gap-2 text-slate-500">
                      <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <dt className="sr-only">Thời gian gửi</dt>
                      <dd>
                        <span className="font-medium text-slate-700">{form.sent_time ? formatDateTime(form.sent_time) : "Gửi ngay"}</span>
                        {form.expired_at && <span className="mt-0.5 block">Hết hạn: {formatDateTime(form.expired_at)}</span>}
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
