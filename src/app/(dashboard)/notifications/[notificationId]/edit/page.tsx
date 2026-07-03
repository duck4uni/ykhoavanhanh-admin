"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notificationsHooks, type NotificationCategory, type NotificationSubCategory } from "@/api/notificationsApi";
import { useUsersList } from "@/api/userApi";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner, LoadingSection } from "@/components/ui/Spinner";
import { ArrowLeft, Save } from "lucide-react";

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

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditNotificationPage({ params }: { params: { notificationId: string } }) {
  const { notificationId } = params;
  const router = useRouter();

  const { data: notif, isFetching } = notificationsHooks.useDetail(notificationId);
  const updateMutation = notificationsHooks.useUpdate();
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

  useEffect(() => {
    if (notif) {
      setForm({
        title: notif.title || "",
        content: notif.content || "",
        category: notif.category || "SYSTEM",
        sub_category: notif.sub_category || "",
        belongs_to_user_id: notif.belongs_to_user_id || "",
        sent_time: toDatetimeLocal(notif.sent_time),
        expired_at: toDatetimeLocal(notif.expired_at ?? undefined),
      });
    }
  }, [notif]);

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
    };

    if (form.sub_category) payload.sub_category = form.sub_category;
    else payload.sub_category = null;

    if (form.belongs_to_user_id.trim()) payload.belongs_to_user_id = form.belongs_to_user_id.trim();
    else payload.belongs_to_user_id = null;

    if (form.sent_time) payload.sent_time = new Date(form.sent_time).toISOString();
    else payload.sent_time = null;

    if (form.expired_at) payload.expired_at = new Date(form.expired_at).toISOString();
    else payload.expired_at = null;

    updateMutation.mutate(
      { id: notificationId, data: payload },
      {
        onSuccess: () => {
          router.push(`/notifications/${notificationId}`);
        },
      }
    );
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  if (isFetching) {
    return <LoadingSection text="Đang tải thông báo…" />;
  }

  if (!notif) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Không tìm thấy thông báo.</p>
        <Link href="/notifications">
          <Button variant="outline" className="mt-4">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/notifications/${notificationId}`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa thông báo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cập nhật nội dung thông báo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin thông báo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Tiêu đề *"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              error={errors.title}
              placeholder="Nhập tiêu đề thông báo"
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nội dung *</label>
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                rows={5}
                className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Nhập nội dung thông báo"
              />
              {errors.content && <p className="mt-1 text-sm text-destructive">{errors.content}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Loại thông báo *</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phân loại phụ</label>
                <select
                  value={form.sub_category}
                  onChange={(e) => updateField("sub_category", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">— Chọn —</option>
                  {SUB_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Người nhận</label>
              <select
                value={form.belongs_to_user_id}
                onChange={(e) => updateField("belongs_to_user_id", e.target.value)}
                disabled={usersLoading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">— Tất cả người dùng —</option>
                {usersData?.rows.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.phone || u.email || u.id}
                  </option>
                ))}
              </select>
              {usersLoading && <p className="mt-1 text-xs text-muted-foreground">Đang tải danh sách…</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Thời gian gửi</label>
                <input
                  type="datetime-local"
                  value={form.sent_time}
                  onChange={(e) => updateField("sent_time", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hết hạn</label>
                <input
                  type="datetime-local"
                  value={form.expired_at}
                  onChange={(e) => updateField("expired_at", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu thay đổi
              </Button>
              <Link href={`/notifications/${notificationId}`}>
                <Button variant="outline" type="button">Hủy</Button>
              </Link>
            </div>

            {updateMutation.isError && (
              <p className="text-sm text-destructive">{updateMutation.error?.message || "Cập nhật thất bại"}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
