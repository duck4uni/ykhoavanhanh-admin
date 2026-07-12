import { Bell } from "lucide-react";
import { notificationsHooks, type Notification } from "@/api/notificationsApi";
import { LoadingSection } from "@/components/ui/Spinner";
import { cn, formatDateTime } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_LABELS, NOTIFICATIONS_PAGE_SIZE } from "../helpers";
import type { NotificationListController } from "../hooks/useNotificationList";

type MarkOneMutation = ReturnType<typeof notificationsHooks.useMarkAsReadById>;

/** Một dòng thông báo; click sẽ đánh dấu đã đọc nếu chưa đọc. */
function NotificationRow({ notif, markOneMutation }: { notif: Notification; markOneMutation: MarkOneMutation }) {
  const handleRowClick = () => {
    if (!notif.has_user_read) markOneMutation.mutate(notif.id);
  };

  return (
    <tr
      className={cn("hover:bg-slate-50/60 transition-colors group cursor-pointer", !notif.has_user_read && "bg-sky-50/30")}
      onClick={handleRowClick}
    >
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 w-2 h-2 rounded-full flex-shrink-0", notif.has_user_read ? "bg-slate-200" : "bg-primary")} />
          <div className="min-w-0">
            <p className={cn("text-sm truncate max-w-xs", notif.has_user_read ? "text-slate-600" : "font-medium text-slate-800")}>
              {notif.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{notif.content}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium", CATEGORY_COLORS[notif.category])}>
          {CATEGORY_LABELS[notif.category]}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {notif.sent_time ? formatDateTime(notif.sent_time) : "—"}
      </td>
    </tr>
  );
}

/** Bảng thông báo + trạng thái rỗng + phân trang tùy biến. */
export function NotificationTable({ ctrl }: { ctrl: NotificationListController }) {
  const { isFetching, filteredRows, markOneMutation, page, setPage, total, totalPages } = ctrl;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      {isFetching && <LoadingSection />}

      {!isFetching && filteredRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">Không có thông báo nào</p>
          <p className="text-xs text-slate-400">Thông báo sẽ hiển thị tại đây khi có dữ liệu</p>
        </div>
      )}

      {!isFetching && filteredRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Tiêu đề</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Loại</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Thời gian gửi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((notif) => (
                <NotificationRow key={notif.id} notif={notif} markOneMutation={markOneMutation} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredRows.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Hiển thị {((page - 1) * NOTIFICATIONS_PAGE_SIZE) + 1}–{Math.min(page * NOTIFICATIONS_PAGE_SIZE, total)} trong {total} thông báo
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="contents">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-slate-400 text-sm">…</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-colors",
                      p === page ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
