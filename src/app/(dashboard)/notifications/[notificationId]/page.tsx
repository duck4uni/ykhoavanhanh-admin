"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { notificationsHooks, type NotificationCategory } from "@/api/notificationsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, MailOpen, Mail, CheckCheck, Pencil, Trash2 } from "lucide-react";
import { useDeleteConfirmation } from "@/components/ui/useDeleteConfirmation";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  APPOINTMENT: "Lịch hẹn",
  SYSTEM: "Hệ thống",
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  APPOINTMENT: "bg-blue-50 text-blue-600",
  SYSTEM: "bg-slate-100 text-slate-600",
};

export default function NotificationDetailPage({ params }: { params: { notificationId: string } }) {
  const { notificationId } = params;
  const router = useRouter();

  const { data: notif, isFetching } = notificationsHooks.useDetail(notificationId);
  const markReadMutation = notificationsHooks.useMarkAsReadById();

  // Auto mark as read when opening
  useEffect(() => {
    if (notif && !notif.has_user_read) {
      markReadMutation.mutate(notif.id);
    }
  }, [notif, markReadMutation]);

  if (isFetching) {
    return <LoadingSection text="Đang tải thông báo…" />;
  }

  if (!notif) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Không tìm thấy thông báo.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{notif.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chi tiết thông báo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/notifications/${notif.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa
          </Button>
          <DeleteButton notifId={notif.id} onDeleted={() => router.push("/notifications")} />
          <Badge variant={notif.has_user_read ? "default" : "info"}>
            {notif.has_user_read ? "Đã đọc" : "Chưa đọc"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {notif.has_user_read ? (
                  <MailOpen className="h-5 w-5 text-primary" />
                ) : (
                  <Mail className="h-5 w-5 text-primary" />
                )}
                Nội dung thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tiêu đề</p>
                <p className="font-semibold text-gray-900 text-lg">{notif.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Nội dung</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {notif.content}
                </div>
              </div>
              {notif.sub_category && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phân loại phụ</p>
                  <p className="font-medium text-gray-900">{notif.sub_category}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Thông tin</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Loại</p>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium mt-1", CATEGORY_COLORS[notif.category])}>
                  {CATEGORY_LABELS[notif.category]}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Thời gian gửi</p>
                <p className="font-medium">{notif.sent_time ? formatDateTime(notif.sent_time) : "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày tạo</p>
                <p className="font-medium">{formatDateTime(notif.created_at)}</p>
              </div>
              {notif.expired_at && (
                <div>
                  <p className="text-gray-500">Hết hạn</p>
                  <p className="font-medium">{formatDateTime(notif.expired_at)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Trạng thái gửi</p>
                <p className="font-medium">{notif.has_noti_sent ? "Đã gửi" : "Chưa gửi"}</p>
              </div>
            </CardContent>
          </Card>

          {!notif.has_user_read && (
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => markReadMutation.mutate(notif.id)}
                  disabled={markReadMutation.isPending}
                >
                  {markReadMutation.isPending ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Đánh dấu đã đọc
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ notifId, onDeleted }: { notifId: string; onDeleted: () => void }) {
  const deleteMutation = notificationsHooks.useDelete();
  const { open, ConfirmDialog } = useDeleteConfirmation({
    title: "Xác nhận xóa",
    description: "Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.",
    onConfirm: () => deleteMutation.mutate(notifId, { onSuccess: onDeleted }),
  });

  return (
    <>
      <Button variant="destructive" onClick={open} disabled={deleteMutation.isPending}>
        <Trash2 className="h-4 w-4 mr-2" />
        {deleteMutation.isPending ? "Đang xóa…" : "Xóa"}
      </Button>
      {ConfirmDialog}
    </>
  );
}
