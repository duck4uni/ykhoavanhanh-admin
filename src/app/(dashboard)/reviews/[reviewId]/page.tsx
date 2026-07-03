"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSection } from "@/components/ui/Spinner";
import { appointmentReviewsHooks } from "@/api/appointmentReviewsApi";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Star, ArrowLeft, Check, X, MessageSquare } from "lucide-react";

function StarRow({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${s <= v ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">{v}/5</span>
      </div>
    </div>
  );
}

export default function ReviewDetailPage() {
  const params = useParams<{ reviewId: string }>();
  const reviewId = params.reviewId;
  const router = useRouter();

  const { data: review, isLoading } = appointmentReviewsHooks.useDetail(reviewId);

  const [adminReply, setAdminReply] = useState("");

  useEffect(() => {
    if (review) setAdminReply(review.admin_reply ?? "");
  }, [review]);

  const updateMutation = appointmentReviewsHooks.useUpdate({
    onSuccess: () => toast.success("Cập nhật đánh giá thành công"),
    onError: (err) => toast.error(err.message || "Cập nhật đánh giá thất bại"),
  });

  if (isLoading) {
    return <LoadingSection text="Đang tải đánh giá..." />;
  }

  if (!review) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Không tìm thấy đánh giá.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const detailRatings = [
    review.doctor_rating,
    review.service_rating,
    review.waiting_time_rating,
    review.facility_rating,
  ].filter((v): v is number => typeof v === "number");
  const avgRating =
    detailRatings.length > 0
      ? (detailRatings.reduce((a, b) => a + b, 0) / detailRatings.length).toFixed(1)
      : review.overall_rating.toFixed(1);

  const patientName = review.is_anonymous
    ? "Ẩn danh"
    : review.patient?.patient_full_name ?? "—";
  const patientPhone = review.is_anonymous ? null : review.patient?.phone_number ?? null;
  const doctorName = review.doctor?.doctor_name ?? "—";

  function handleSaveReply() {
    updateMutation.mutate({
      id: reviewId,
      data: {
        admin_reply: adminReply,
        admin_replied_at: new Date().toISOString(),
      },
    });
  }

  function handleSetStatus(status: "APPROVED" | "REJECTED" | "PENDING") {
    updateMutation.mutate({ id: reviewId, data: { status } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết đánh giá</h1>
          <p className="text-sm text-gray-500 mt-0.5">{patientName} → {doctorName}</p>
        </div>
        <div className="flex items-center gap-2">
          {review.status === "APPROVED" ? (
            <Badge variant="success">Đã duyệt</Badge>
          ) : review.status === "REJECTED" ? (
            <Badge variant="danger">Đã từ chối</Badge>
          ) : (
            <Badge variant="warning">Chờ duyệt</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Ratings breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                Điểm đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="text-5xl font-bold text-gray-900">{review.overall_rating}</div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-5 w-5 ${s <= review.overall_rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Điểm tổng thể / Trung bình chi tiết: {avgRating}</p>
                </div>
              </div>
              <div className="space-y-3">
                <StarRow label="Chuyên môn bác sĩ" value={review.doctor_rating} />
                <StarRow label="Dịch vụ" value={review.service_rating} />
                <StarRow label="Thời gian chờ" value={review.waiting_time_rating} />
                <StarRow label="Cơ sở vật chất" value={review.facility_rating} />
              </div>
            </CardContent>
          </Card>

          {/* Comment */}
          {review.comment && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary-600" />Nhận xét của bệnh nhân</CardTitle></CardHeader>
              <CardContent>
                <blockquote className="border-l-4 border-primary-200 pl-4 text-gray-700 italic">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
              </CardContent>
            </Card>
          )}

          {/* Admin reply */}
          <Card>
            <CardHeader><CardTitle>Phản hồi của quản trị viên</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập phản hồi hiển thị cho bệnh nhân..."
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
              />
              {review.admin_replied_at && (
                <p className="text-xs text-gray-400">
                  Phản hồi lúc: {formatDateTime(review.admin_replied_at)}
                </p>
              )}
              <Button variant="outline" onClick={handleSaveReply} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Đang lưu..." : "Lưu phản hồi"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader><CardTitle>Kiểm duyệt</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {review.status !== "APPROVED" ? (
                <Button variant="primary" className="w-full" disabled={updateMutation.isPending} onClick={() => handleSetStatus("APPROVED")}>
                  <Check className="h-4 w-4 mr-2" /> Duyệt đánh giá
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled={updateMutation.isPending} onClick={() => handleSetStatus("PENDING")}>
                  Chuyển về chờ duyệt
                </Button>
              )}
              {review.status !== "REJECTED" && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  disabled={updateMutation.isPending}
                  onClick={() => handleSetStatus("REJECTED")}
                >
                  <X className="h-4 w-4 mr-2" /> Từ chối
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader><CardTitle>Thông tin</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Bệnh nhân</p>
                <p className="font-medium">{patientName}</p>
                {patientPhone && <p className="text-xs text-gray-500">{patientPhone}</p>}
              </div>
              <div>
                <p className="text-gray-500">Bác sĩ được đánh giá</p>
                <p className="font-medium">{doctorName}</p>
              </div>
              <div>
                <p className="text-gray-500">Khu khám</p>
                <p className="font-medium">{review.exam_area?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Mã lịch hẹn</p>
                <p className="font-mono text-primary-600 break-all">{review.appointment_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Nguồn</p>
                <p>{review.source ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày gửi</p>
                <p>{formatDateTime(review.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
