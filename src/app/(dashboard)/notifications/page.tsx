"use client";

import Link from "next/link";
import { CheckCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useNotificationList } from "./hooks/useNotificationList";
import { NotificationStats } from "./_components/NotificationStats";
import { NotificationFilters } from "./_components/NotificationFilters";
import { NotificationTable } from "./_components/NotificationTable";

export default function NotificationsPage() {
  const ctrl = useNotificationList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách thông báo gửi đến người dùng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => ctrl.markAllMutation.mutate(undefined)}
            disabled={ctrl.markAllMutation.isPending || ctrl.unreadCount === 0}
          >
            {ctrl.markAllMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
          <Link href="/notifications/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Tạo thông báo
            </Button>
          </Link>
        </div>
      </div>

      <NotificationStats total={ctrl.total} unreadCount={ctrl.unreadCount} readCount={ctrl.rows.length - ctrl.unreadCount} />
      <NotificationFilters ctrl={ctrl} />
      <NotificationTable ctrl={ctrl} />
    </div>
  );
}
