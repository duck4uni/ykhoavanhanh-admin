import { FiCalendar, FiUser } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Spinner";
import { StatusBadge } from "./primitives";
import { formatDateTime } from "../types";
import type { DashboardController } from "../hooks/useDashboardData";

/** Hai bảng dưới cùng: phiếu khám gần đây + lịch khám sắp tới. */
export function BottomPanels({ ctrl }: { ctrl: DashboardController }) {
  const { recentTickets, recentLoading, upcoming, upcomingLoading } = ctrl;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Recent tickets */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Phiếu khám gần đây</h2>
        </div>
        {recentLoading ? (
          <div className="py-10">
            <LoadingSpinner text="Đang tải..." />
          </div>
        ) : recentTickets && recentTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Thời gian</th>
                  <th className="pb-2 pr-3 font-medium">Bệnh nhân</th>
                  <th className="pb-2 pr-3 font-medium">Bác sĩ</th>
                  <th className="pb-2 pr-3 font-medium">Dịch vụ</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => (
                  <tr key={t.bookingId} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-muted-foreground">{formatDateTime(t.appointmentTime ?? t.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <FiUser className="h-3.5 w-3.5 text-text-disabled" />
                        {t.patientName ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-foreground">{t.doctorName ?? "—"}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{t.serviceName ?? "—"}</td>
                    <td className="py-3">
                      <StatusBadge status={t.localStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Chưa có phiếu khám nào.</p>
        )}
      </Card>

      {/* Upcoming schedules */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Lịch khám sắp tới</h2>
        </div>
        {upcomingLoading ? (
          <div className="py-10">
            <LoadingSpinner text="Đang tải..." />
          </div>
        ) : upcoming && upcoming.length > 0 ? (
          <div className="space-y-1">
            {upcoming.map((s) => (
              <div key={s.scheduleId} className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-secondary">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <FiCalendar className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{s.doctorName ?? "—"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.examAreaName ?? s.specialtyName ?? "—"}
                    {s.roomName ? ` · ${s.roomName}` : ""}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-foreground">
                    {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.bookedCount}/{s.maxAppointments ?? "—"} slot
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Không có lịch khám sắp tới.</p>
        )}
      </Card>
    </div>
  );
}
