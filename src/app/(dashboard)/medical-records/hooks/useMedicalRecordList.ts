import { useEffect, useMemo, useState } from "react";
import { medicalRecordsHooks, useMedicalRecordStats } from "@/api/medicalRecordsApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { useDebounce } from "@/hooks/useApiHelpers";
import { MEDICAL_RECORD_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang danh sách hồ sơ bệnh án. */
export function useMedicalRecordList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MEDICAL_RECORD_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const serverFilters = debouncedSearch.trim() ? `record_code@=${debouncedSearch.trim()}` : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading } = medicalRecordsHooks.useList({
    currentPage: page,
    pageSize,
    sortField: "examined_at",
    sortOrder: "DESC",
    filters: serverFilters,
    ...(paymentStatus ? { payment_status: paymentStatus } : {}),
  });

  const { data: stats } = useMedicalRecordStats();
  const { data: specialtiesData } = specialtiesHooks.useList();
  const specialties = specialtiesData?.rows ?? [];

  const serverRows = useMemo(() => data?.rows ?? [], [data]);
  const totalItems = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const rows = useMemo(() => {
    return serverRows.filter((record) => {
      const day = record.examined_at?.slice(0, 10) ?? "";
      const matchFrom = !fromDate || day >= fromDate;
      const matchTo = !toDate || day <= toDate;
      const matchSpecialty = !specialtyId || record.specialty_id === specialtyId;
      return matchFrom && matchTo && matchSpecialty;
    });
  }, [serverRows, fromDate, toDate, specialtyId]);

  function resetFilters() {
    setSearch("");
    setSpecialtyId("");
    setPaymentStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return {
    rows,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    specialtyId,
    setSpecialtyId,
    paymentStatus,
    setPaymentStatus,
    specialties,
    stats,
    resetFilters,
  };
}
