import { useMemo, useState } from "react";
import { useSearchPatients } from "@/api/patientApi";
import type { SearchPatientParams } from "@/types/patient";
import { PATIENT_PAGE_SIZE, buildSearchParams, getGender, getSource, getSyncStatus } from "../helpers";

/** State + dữ liệu cho trang danh sách bệnh nhân. */
export function usePatientList() {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [gender, setGender] = useState("all");
  const [source, setSource] = useState("all");
  const [syncStatus, setSyncStatus] = useState("all");
  const [searchParams, setSearchParams] = useState<SearchPatientParams>({});

  const { data: patientsData, isLoading } = useSearchPatients({
    ...searchParams,
    currentPage: page,
    pageSize: PATIENT_PAGE_SIZE,
  });

  const patients = useMemo(() => patientsData?.rows ?? [], [patientsData]);
  const total = patientsData?.count ?? 0;
  const totalPages = patientsData?.totalPages ?? 1;
  const currentPage = patientsData?.currentPage ?? page;

  // Áp bộ lọc phía client (giới tính / nguồn / trạng thái) — API chưa hỗ trợ các lọc này
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchGender = gender === "all" || getGender(p) === gender;
      const matchSource = source === "all" || getSource(p).label === source;
      const matchSync = syncStatus === "all" || getSyncStatus(p).label === syncStatus;
      return matchGender && matchSource && matchSync;
    });
  }, [patients, gender, source, syncStatus]);

  // ─── Số liệu thẻ thống kê (tính từ dữ liệu thật) ───────────────────────────
  const withInsurance = patients.filter((p) => p.insurance_number).length;
  const pendingSync = patients.filter((p) => getSyncStatus(p).label !== "Đã đồng bộ").length;
  const insurancePct = total > 0 ? Math.round((withInsurance / total) * 100) : 0;

  function handleSearch() {
    setSearchParams(buildSearchParams(searchValue));
    setPage(1);
  }

  function resetFilters() {
    setSearchValue("");
    setGender("all");
    setSource("all");
    setSyncStatus("all");
    setSearchParams({});
    setPage(1);
  }

  return {
    isLoading,
    filtered,
    total,
    totalPages,
    currentPage,
    setPage,
    // filters
    searchValue,
    setSearchValue,
    gender,
    setGender,
    source,
    setSource,
    syncStatus,
    setSyncStatus,
    handleSearch,
    resetFilters,
    // stats
    stats: { total, withInsurance, insurancePct, pendingSync },
  };
}

export type PatientListController = ReturnType<typeof usePatientList>;
