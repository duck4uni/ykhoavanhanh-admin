import Link from "next/link";
import { MoreVertical, UserRound } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import type { AppointmentReview } from "@/api/appointmentReviewsApi";
import { formatDate } from "@/lib/utils";
import { REVIEWS_PAGE_SIZE, initials, maskPhone } from "../types";
import { ReplyCell, StarRating, StatusBadge } from "./ReviewBadges";

interface ReviewTableProps {
  rows: AppointmentReview[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function ReviewTable({ rows, isLoading, page, totalPages, totalItems, onPageChange }: ReviewTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải đánh giá..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5">Bệnh nhân</th>
                  <th className="px-6 py-3.5">Bác sĩ</th>
                  <th className="px-6 py-3.5">Khu khám</th>
                  <th className="px-6 py-3.5">Đánh giá</th>
                  <th className="px-6 py-3.5">Nhận xét</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5">Phản hồi</th>
                  <th className="px-6 py-3.5">Ngày</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy đánh giá phù hợp.
                    </td>
                  </tr>
                ) : (
                  rows.map((review) => {
                    const name = review.is_anonymous ? "Ẩn danh" : review.patient?.patient_full_name ?? "—";
                    return (
                      <tr key={review.id} className="text-sm transition-colors hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">
                              {review.is_anonymous ? <UserRound className="h-4 w-4" /> : initials(name)}
                            </div>
                            <div className="min-w-0">
                              {review.is_anonymous ? (
                                <>
                                  <p className="font-semibold text-slate-800">Ẩn danh</p>
                                  <p className="text-xs text-muted-foreground">Không công khai thông tin</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold text-slate-800">{name}</p>
                                  <p className="text-xs text-muted-foreground">SĐT: {maskPhone(review.patient?.phone_number)}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{review.doctor?.doctor_name ?? "—"}</td>
                        <td className="px-6 py-4 text-slate-600">{review.exam_area?.name ?? "—"}</td>
                        <td className="px-6 py-4"><StarRating value={review.overall_rating} /></td>
                        <td className="px-6 py-4">
                          <p className="max-w-[220px] truncate text-slate-600">{review.comment ?? "—"}</p>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={review.status} /></td>
                        <td className="px-6 py-4"><ReplyCell review={review} /></td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(review.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/reviews/${review.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Chi tiết"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalItems={totalItems}
              pageSize={REVIEWS_PAGE_SIZE}
            />
          </div>
        </>
      )}
    </div>
  );
}
