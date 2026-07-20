import { useEffect, useMemo, useState } from "react";
import { appointmentBookingsHooks, type AppointmentBookingListParams } from "@/api/appointmentBookingsApi";
import { BOOKING_PAGE_SIZE, initialFilters, pruneEmptyFilters, type BookingFilters } from "../types";

/** State + dữ liệu cho trang danh sách lịch đặt khám. */
export function useBookingList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(BOOKING_PAGE_SIZE);
  const [draftFilters, setDraftFilters] = useState<BookingFilters>(initialFilters);
  const [filters, setFilters] = useState<BookingFilters>(initialFilters);

  const params = useMemo<AppointmentBookingListParams>(
    () => ({
      currentPage: page,
      pageSize,
      sortField: "appointment_time",
      sortOrder: "DESC",
      ...pruneEmptyFilters(filters),
    }),
    [filters, page, pageSize],
  );

  const { data, isLoading } = appointmentBookingsHooks.useList(params);

  const bookings = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? page;

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  function handleFilterChange(key: keyof BookingFilters, value: string) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    setFilters(draftFilters);
    setPage(1);
  }

  function resetFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  }

  return {
    isLoading,
    bookings,
    total,
    totalPages,
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    draftFilters,
    handleFilterChange,
    applyFilters,
    resetFilters,
  };
}

export type BookingListController = ReturnType<typeof useBookingList>;
