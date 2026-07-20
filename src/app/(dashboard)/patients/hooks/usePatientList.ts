import { useEffect, useMemo, useState } from "react";
import { useSearchPatients } from "@/api/patientApi";
import { useDebounce } from "@/hooks/useApiHelpers";
import { PATIENT_PAGE_SIZE, buildSearchParams, getSource, getSyncStatus } from "../helpers";

/** State + dữ liệu cho trang danh sách bệnh nhân. */
export function usePatientList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PATIENT_PAGE_SIZE);
  const [searchValue, setSearchValue] = useState("");
  const [gender, setGender] = useState("all");
  const [source, setSource] = useState("all");
  const [syncStatus, setSyncStatus] = useState("all");
  const debouncedSearch = useDebounce(searchValue, 400);

  const searchParams = useMemo(() => buildSearchParams(debouncedSearch), [debouncedSearch]);
  const genderFilters = gender === "Nam" ? "sex==MALE" : gender === "Nữ" ? "sex==FEMALE" : undefined;

  const { data: patientsData, isLoading } = useSearchPatients({
    ...searchParams,
    currentPage: page,
    pageSize,
    filters: genderFilters,
  });

  const patients = useMemo(() => patientsData?.rows ?? [], [patientsData]);
  const total = patientsData?.count ?? 0;
  const totalPages = patientsData?.totalPages ?? 1;
  const currentPage = patientsData?.currentPage ?? page;

  useEffect(() => {
    setPage(1);
  }, [pageSize, gender, debouncedSearch]);

  // Nguồn tạo hồ sơ / trạng thái đồng bộ suy ra từ dữ liệu, API chưa có field lọc trực tiếp — lọc phía client.
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchSource = source === "all" || getSource(p).label === source;
      const matchSync = syncStatus === "all" || getSyncStatus(p).label === syncStatus;
      return matchSource && matchSync;
    });
  }, [patients, source, syncStatus]);

  // ─── Số liệu thẻ thống kê (tính từ dữ liệu thật) ───────────────────────────
  const withInsurance = patients.filter((p) => p.insurance_number).length;
  const pendingSync = patients.filter((p) => getSyncStatus(p).label !== "Đã đồng bộ").length;
  const insurancePct = total > 0 ? Math.round((withInsurance / total) * 100) : 0;

  function resetFilters() {
    setSearchValue("");
    setGender("all");
    setSource("all");
    setSyncStatus("all");
    setPage(1);
  }

  return {
    isLoading,
    filtered,
    total,
    totalPages,
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    // filters
    searchValue,
    setSearchValue,
    gender,
    setGender,
    source,
    setSource,
    syncStatus,
    setSyncStatus,
    resetFilters,
    // stats
    stats: { total, withInsurance, insurancePct, pendingSync },
  };
}

export type PatientListController = ReturnType<typeof usePatientList>;
