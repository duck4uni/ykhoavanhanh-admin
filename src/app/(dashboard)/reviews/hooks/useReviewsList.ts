import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { appointmentReviewsHooks, type AppointmentReview } from "@/api/appointmentReviewsApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { useDebounce } from "@/hooks/useApiHelpers";
import { REVIEWS_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang danh sách đánh giá. */
export function useReviewsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Sieve filter string (BE: sequelize-api-paginate) — gộp comment search và
  // khoảng ngày vào cùng `filters` để lọc + đếm tổng đều chạy trên server,
  // tránh lệch với `rows` đang hiển thị (trước đây lọc fromDate/toDate ở
  // client SAU khi đã phân trang, khiến totalPages/totalItems không khớp
  // với số dòng thực sự hiển thị).
  const filterClauses: string[] = [];
  if (debouncedSearch.trim()) filterClauses.push(`comment@=${debouncedSearch.trim()}`);
  if (fromDate) filterClauses.push(`created_at>=${fromDate}`);
  // Cộng thêm giờ cuối ngày để không bỏ sót các bản ghi tạo trong ngày
  // `toDate` (created_at là timestamp, "<= 2024-01-05" mặc định hiểu là
  // 00:00:00 nên sẽ loại hết record trong ngày đó nếu không thêm giờ).
  if (toDate) filterClauses.push(`created_at<=${toDate}T23:59:59`);
  const serverFilters = filterClauses.length > 0 ? filterClauses.join(",") : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, fromDate, toDate]);

  const { data, isLoading } = appointmentReviewsHooks.useList({
    // BE (sequelize-api-paginate) đọc `currentPage`, không phải `page` — gửi
    // `page` khiến BE luôn mặc định về trang 1 bất kể người dùng bấm chuyển
    // trang, làm phân trang trông như bị "đứng" (danh sách không đổi).
    currentPage: page,
    pageSize: REVIEWS_PAGE_SIZE,
    sortField: "created_at",
    sortOrder: "DESC",
    filters: serverFilters,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(doctorFilter ? { doctor_id: doctorFilter } : {}),
    ...(areaFilter ? { exam_area_id: areaFilter } : {}),
    ...(ratingFilter ? { min_rating: Number(ratingFilter), max_rating: Number(ratingFilter) } : {}),
  });

  const { data: doctors } = doctorsHooks.useList();
  const doctorList = doctors ?? [];
  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];

  // Duyệt / Ẩn (không duyệt) nhanh ngay trên danh sách — chỉ gửi `status`,
  // đúng allowlist field mà vai trò administrator được phép sửa qua
  // PUT /appointment-reviews/:id.
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const updateStatusMutation = appointmentReviewsHooks.useUpdate({
    onSuccess: () => toast.success("Cập nhật trạng thái đánh giá thành công"),
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái đánh giá thất bại"),
    onSettled: () => setTogglingId(null),
  });

  function setReviewStatus(id: string, status: AppointmentReview["status"]) {
    setTogglingId(id);
    updateStatusMutation.mutate({ id, data: { status } });
  }

  // fromDate/toDate giờ lọc ở server (qua `filters` phía trên) nên rows hiển
  // thị chính là trang dữ liệu server trả về — không lọc lại lần nữa ở
  // client để totalPages/totalItems luôn khớp với số dòng đang hiển thị.
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const serverRows = rows;

  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.count ?? 0;

  const stats = useMemo(() => {
    const avgRating =
      serverRows.length > 0
        ? (serverRows.reduce((sum, review) => sum + review.overall_rating, 0) / serverRows.length).toFixed(1)
        : "0";
    const pendingCount = serverRows.filter((r) => r.status === "PENDING").length;
    const lowRatingCount = serverRows.filter((r) => r.overall_rating <= 2).length;
    const repliedCount = serverRows.filter((r) => r.admin_reply).length;
    return { avgRating, pendingCount, lowRatingCount, repliedCount };
  }, [serverRows]);

  function resetFilters() {
    setSearch("");
    setRatingFilter("");
    setStatusFilter("");
    setDoctorFilter("");
    setAreaFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return {
    rows,
    isLoading,
    page,
    setPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    ratingFilter,
    setRatingFilter,
    statusFilter,
    setStatusFilter,
    doctorFilter,
    setDoctorFilter,
    areaFilter,
    setAreaFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    doctorList,
    examAreas,
    stats,
    resetFilters,
    setReviewStatus,
    togglingId,
  };
}
