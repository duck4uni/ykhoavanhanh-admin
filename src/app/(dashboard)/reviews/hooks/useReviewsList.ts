import { useEffect, useMemo, useState } from "react";
import { appointmentReviewsHooks } from "@/api/appointmentReviewsApi";
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

  const serverFilters = debouncedSearch.trim() ? `comment@=${debouncedSearch.trim()}` : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = appointmentReviewsHooks.useList({
    page,
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

  const serverRows = useMemo(() => data?.rows ?? [], [data]);

  const rows = useMemo(() => {
    return serverRows.filter((r) => {
      const created = r.created_at?.slice(0, 10) ?? "";
      const matchFrom = !fromDate || created >= fromDate;
      const matchTo = !toDate || created <= toDate;
      return matchFrom && matchTo;
    });
  }, [serverRows, fromDate, toDate]);

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
  };
}
