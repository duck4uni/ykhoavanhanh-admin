"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { useSearchPatients } from "@/api/patientApi";
import { formatDateTime } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import {
  FiUsers,
  FiShield,
  FiCopy,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiRotateCcw,
  FiPlus,
  FiEye,
  FiChevronDown,
  FiDownload,
  FiGrid,
} from "react-icons/fi";

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFullName(p: Patient): string {
  return p.patient_full_name || "—";
}

function getGender(p: Patient): "Nam" | "Nữ" | "—" {
  if (!p.sex) return "—";
  const s = p.sex.toLowerCase();
  if (s === "nam" || s === "male" || s === "1") return "Nam";
  if (s === "nữ" || s === "nu" || s === "female" || s === "0") return "Nữ";
  return "—";
}

function getBirthday(p: Patient): string {
  return p.birthday || p.birth_year || "—";
}

// Nguồn tạo hồ sơ — suy ra từ dữ liệu thật (HIS nếu có his_patient_id + synced_at)
function getSource(p: Patient): { label: string; className: string } {
  if (p.his_patient_id && p.synced_at) return { label: "HIS", className: "bg-primary-100 text-primary-600" };
  return { label: "Admin", className: "bg-purple-100 text-purple-600" };
}

// Trạng thái đồng bộ HIS — suy ra từ synced_at / his_updated_at
function getSyncStatus(p: Patient): { label: string; className: string } {
  if (p.synced_at) return { label: "Đã đồng bộ", className: "bg-success-light text-success" };
  if (p.his_patient_id) return { label: "Chờ đồng bộ", className: "bg-warning-light text-warning" };
  return { label: "Chưa đồng bộ", className: "bg-error-light text-error" };
}

export default function PatientsPage() {
  const [, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [gender, setGender] = useState("all");
  const [source, setSource] = useState("all");
  const [syncStatus, setSyncStatus] = useState("all");
  const [searchParams, setSearchParams] = useState<{ patientcode?: string; patientphonenumber?: string }>({});

  const { data: patientsData, isLoading } = useSearchPatients(searchParams);

  const patients = useMemo(() => patientsData?.rows ?? [], [patientsData]);
  const total = patientsData?.count ?? 0;
  const totalPages = patientsData?.totalPages ?? 1;
  const currentPage = patientsData?.currentPage ?? 1;

  // Áp bộ lọc phía client (giới tính / nguồn / trạng thái)
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchGender = gender === "all" || getGender(p) === gender;
      const matchSource = source === "all" || getSource(p).label === source;
      const matchSync = syncStatus === "all" || getSyncStatus(p).label === syncStatus;
      return matchGender && matchSource && matchSync;
    });
  }, [patients, gender, source, syncStatus]);

  // ─── Stat cards (tính từ dữ liệu thật) ─────────────────────────────────────
  const withInsurance = patients.filter((p) => p.insurance_number).length;
  const pendingSync = patients.filter((p) => getSyncStatus(p).label !== "Đã đồng bộ").length;
  const insurancePct = total > 0 ? Math.round((withInsurance / total) * 100) : 0;

  const stats = [
    { label: "Tổng bệnh nhân", value: total, sub: "Tất cả hồ sơ trong hệ thống", icon: FiUsers, tone: "bg-primary-100 text-primary-600" },
    { label: "Có BHYT", value: withInsurance, sub: `${insurancePct}% tổng số bệnh nhân`, icon: FiShield, tone: "bg-success-light text-success" },
    { label: "Hồ sơ trùng", value: 0, sub: "Cần kiểm tra & gộp", icon: FiCopy, tone: "bg-warning-light text-warning" },
    { label: "Chờ đồng bộ HIS", value: pendingSync, sub: "Chưa đồng bộ thông tin", icon: FiRefreshCw, tone: "bg-purple-100 text-purple-600" },
  ];

  function handleSearch() {
    const trimmed = searchValue.trim();
    const isPhone = /^\d+$/.test(trimmed);
    setSearchParams(
      trimmed ? (isPhone ? { patientphonenumber: trimmed } : { patientcode: trimmed }) : {}
    );
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bệnh nhân</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý hồ sơ bệnh nhân, đồng bộ HIS và thông tin đặt khám
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/patients/merge">
            <Button variant="outline" className="gap-2">
              <FiCopy className="h-4 w-4" /> Gộp bệnh nhân
            </Button>
          </Link>
          <Link href="/patients/new">
            <Button variant="primary" className="gap-2">
              <FiPlus className="h-4 w-4" /> Thêm bệnh nhân
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Tìm theo mã BN, họ tên, số điện thoại, BHYT..."
                className="h-11 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nguồn tạo hồ sơ</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="HIS">HIS</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái hồ sơ</label>
            <select
              value={syncStatus}
              onChange={(e) => setSyncStatus(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="Đã đồng bộ">Đã đồng bộ</option>
              <option value="Chờ đồng bộ">Chờ đồng bộ</option>
              <option value="Chưa đồng bộ">Chưa đồng bộ</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={handleSearch}>
              <FiSliders className="h-4 w-4" /> Bộ lọc nâng cao
            </Button>
            <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={resetFilters}>
              <FiRotateCcw className="h-4 w-4" /> Đặt lại
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Danh sách bệnh nhân</h2>
          <div className="flex items-center gap-1.5">
            <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface-secondary" aria-label="Bố cục">
              <FiGrid className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface-secondary" aria-label="Tải xuống">
              <FiDownload className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSection text="Đang tải danh sách bệnh nhân..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3.5">Mã BN</th>
                    <th className="px-5 py-3.5">Họ tên</th>
                    <th className="px-5 py-3.5">Ngày sinh</th>
                    <th className="px-5 py-3.5">Giới tính</th>
                    <th className="px-5 py-3.5">Điện thoại</th>
                    <th className="px-5 py-3.5">BHYT</th>
                    <th className="px-5 py-3.5">Nguồn</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Cập nhật lần cuối</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                        Không tìm thấy bệnh nhân phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const src = getSource(p);
                      const sync = getSyncStatus(p);
                      const g = getGender(p);
                      return (
                        <tr key={p.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                          <td className="px-5 py-4 font-mono font-medium text-primary-600">{p.his_patient_id ?? "—"}</td>
                          <td className="px-5 py-4 font-semibold text-foreground">{getFullName(p)}</td>
                          <td className="px-5 py-4 text-muted-foreground">{getBirthday(p)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 ${g === "Nam" ? "text-primary-600" : g === "Nữ" ? "text-rose-500" : "text-muted-foreground"}`}>
                              {g !== "—" && <span aria-hidden>{g === "Nam" ? "♂" : "♀"}</span>}
                              {g}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{p.phone_number ?? "—"}</td>
                          <td className="px-5 py-4 text-muted-foreground">{p.insurance_number ?? "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${src.className}`}>
                              {src.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${sync.className}`}>
                              {sync.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {p.updated_at ? formatDateTime(p.updated_at) : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/patients/${p.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-primary-600">
                                  <FiEye className="h-3.5 w-3.5" /> Chi tiết
                                </Button>
                              </Link>
                              <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-surface-secondary" aria-label="Thêm thao tác">
                                <FiChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={total}
                pageSize={PAGE_SIZE}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
