import { Clock, Reply, Star } from "lucide-react";
import type { AppointmentReview } from "@/api/appointmentReviewsApi";
import { formatDate } from "@/lib/utils";

export function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((score) => (
          <Star
            key={score}
            className={`size-4 ${
              score <= value ? "fill-accent-400 text-accent-400" : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="ml-1 text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: AppointmentReview["status"] }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
        Hiển thị
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full bg-error-light px-2.5 py-1 text-xs font-medium text-error">
        Từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-warning-light px-2.5 py-1 text-xs font-medium text-warning">
      Chờ duyệt
    </span>
  );
}

export function ReplyCell({ review }: { review: AppointmentReview }) {
  if (review.admin_reply) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <Reply className="size-3.5" /> Đã phản hồi
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {review.admin_replied_at ? formatDate(review.admin_replied_at) : "—"}
        </p>
      </div>
    );
  }
  if (review.status === "PENDING") {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
          <Clock className="size-3.5" /> Cần xử lý
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">—</p>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">Chưa phản hồi</span>;
}
