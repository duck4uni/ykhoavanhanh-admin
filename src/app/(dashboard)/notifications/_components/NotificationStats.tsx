import { Bell, BellDot, MailOpen } from "lucide-react";

type Props = {
  total: number;
  unreadCount: number;
  readCount: number;
};

/** Ba thẻ thống kê: tổng / chưa đọc / đã đọc. */
export function NotificationStats({ total, unreadCount, readCount }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Tổng thông báo</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <BellDot className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            <p className="text-xs text-gray-500">Chưa đọc</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <MailOpen className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{readCount}</p>
            <p className="text-xs text-gray-500">Đã đọc</p>
          </div>
        </div>
      </div>
    </div>
  );
}
