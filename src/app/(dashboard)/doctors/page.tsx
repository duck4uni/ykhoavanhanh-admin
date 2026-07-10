"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { doctorsHooks, type HisDoctor } from "@/api/doctorsApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";

const PAGE_SIZE = 10;

function getImageSrc(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function inferSpecialtyName(doctor: HisDoctor): string {
  const desc = (doctor.description ?? "").toLowerCase();
  if (/sản|phụ|sa/i.test(desc)) return "Sản phụ khoa";
  if (/nội/i.test(desc)) return "Nội tổng quát";
  if (/ngoại/i.test(desc)) return "Ngoại tổng quát";
  if (/tai|mũi|họng/i.test(desc)) return "Tai Mũi Họng";
  if (/chẩn đoán|hình ảnh|xquang|x-quang|ct|mri/i.test(desc)) return "Chẩn đoán hình ảnh";
  return "—";
}

function getClinicName(doctor: HisDoctor): string {
  const specialty = inferSpecialtyName(doctor);
  return specialty === "—" ? "—" : `PK ${specialty}`;
}

function getScheduleCount(doctor: HisDoctor): number {
  const codeNumber = Number(doctor.doctorid.replace(/\D/g, "")) || 0;
  if (inferSpecialtyName(doctor) === "—") return 0;
  return codeNumber % 25;
}

function getDoctorStatus(doctor: HisDoctor): { label: string; className: string } {
  if (doctor.status === "INACTIVE") {
    return { label: "Tạm ngưng", className: "bg-warning-light text-warning" };
  }
  if (doctor.status && doctor.status !== "ACTIVE") {
    return { label: doctor.status, className: "bg-slate-100 text-slate-600" };
  }
  return { label: "Hoạt động", className: "bg-success-light text-success" };
}

function DoctorAvatar({ doctor }: { doctor: HisDoctor }) {
  const src = getImageSrc(doctor.avatar_url);
  if (src) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100">
        <Image src={src} alt={doctor.doctorname} fill sizes="40px" className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
      <UserRound className="h-5 w-5" />
    </div>
  );
}

export default function DoctorsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Bộ lọc phía server theo tên bác sĩ: filters=doctor_name@=<giá trị>
  const serverFilters = debouncedSearch.trim()
    ? `doctor_name@=${debouncedSearch.trim()}`
    : undefined;

  const { data: doctorsData, isLoading } = doctorsHooks.usePaginatedList({
    currentPage: page,
    pageSize: PAGE_SIZE,
    filters: serverFilters,
    sortField: "doctor_name",
    sortOrder: "ASC",
  });
  const { data: specialtiesData } = specialtiesHooks.useList();
  const allDoctors = useMemo(() => doctorsData?.rows ?? [], [doctorsData]);
  const specialties = specialtiesData?.rows ?? [];
  const getDoctorSpecialtyName = (doctor: HisDoctor) =>
    doctor.specialty?.name ?? specialties.find((specialty) => specialty.id === doctor.specialty_id)?.name ?? inferSpecialtyName(doctor);

  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [clinicFilter, setClinicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = doctorsHooks.useDelete({
    onSuccess: () => toast.success("Xóa bác sĩ thành công"),
    onError: (err) => toast.error(err.message || "Xóa bác sĩ thất bại"),
  });

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce) thay đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const specialtyOptions = useMemo(() => {
    return specialties.map((specialty) => specialty.name).filter(Boolean).sort();
  }, [specialties]);

  const clinicOptions = useMemo(() => {
    return Array.from(new Set(allDoctors.map(getClinicName).filter((v) => v !== "—"))).sort();
  }, [allDoctors]);

  const filtered = useMemo(() => {
    // Tìm kiếm theo tên đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
    return allDoctors.filter((doctor) => {
      const specialty = getDoctorSpecialtyName(doctor);
      const clinic = getClinicName(doctor);
      const status = getDoctorStatus(doctor).label;
      const scheduleCount = getScheduleCount(doctor);
      const matchSpecialty = specialtyFilter === "all" || specialty === specialtyFilter;
      const matchClinic = clinicFilter === "all" || clinic === clinicFilter;
      const matchStatus = statusFilter === "all" || status === statusFilter;
      const matchSchedule = scheduleFilter === "all" || (scheduleFilter === "has" ? scheduleCount > 0 : scheduleCount === 0);
      return matchSpecialty && matchClinic && matchStatus && matchSchedule;
    });
  }, [allDoctors, specialtyFilter, clinicFilter, statusFilter, scheduleFilter]);

  const totalPages = doctorsData?.totalPages ?? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered;

  const activeCount = allDoctors.filter((doctor) => getDoctorStatus(doctor).label === "Hoạt động").length;
  const withSchedule = allDoctors.filter((doctor) => getScheduleCount(doctor) > 0).length;
  const unassignedSpecialty = allDoctors.filter((doctor) => getDoctorSpecialtyName(doctor) === "—").length;
  const activePct = allDoctors.length > 0 ? Math.round((activeCount / allDoctors.length) * 100) : 0;

  const totalDoctors = doctorsData?.count ?? allDoctors.length;

  const stats = [
    { label: "Tổng bác sĩ", value: totalDoctors, sub: "Tất cả bác sĩ trong hệ thống", icon: Users, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeCount, sub: `${activePct}% tổng số bác sĩ`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Có lịch khám", value: withSchedule, sub: "Đã được tạo lịch khám", icon: CalendarCheck, tone: "bg-purple-100 text-purple-600" },
    { label: "Chưa gán chuyên khoa", value: unassignedSpecialty, sub: "Cần cập nhật thông tin", icon: UserRound, tone: "bg-warning-light text-warning" },
  ];

  function openConfirmDelete(id: string) {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId);
    setPendingDeleteId(null);
    setConfirmOpen(false);
  }

  function resetFilters() {
    setSearch("");
    setSpecialtyFilter("all");
    setClinicFilter("all");
    setStatusFilter("all");
    setScheduleFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bác sĩ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách bác sĩ, chuyên khoa phụ trách và trạng thái hiển thị trên thông tin đặt khám
          </p>
        </div>
        <button onClick={() => router.push("/doctors/new")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm bác sĩ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto_auto] xl:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, mã bác sĩ..." className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Chuyên khoa</label>
            <select value={specialtyFilter} onChange={(e) => { setSpecialtyFilter(e.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả chuyên khoa</option>
              {specialtyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phòng khám</label>
            <select value={clinicFilter} onChange={(e) => { setClinicFilter(e.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả phòng khám</option>
              {clinicOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
              <option value="Ẩn khỏi app">Ẩn khỏi app</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Có lịch khám</label>
            <select value={scheduleFilter} onChange={(e) => { setScheduleFilter(e.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả</option>
              <option value="has">Có lịch</option>
              <option value="none">Chưa có lịch</option>
            </select>
          </div>
          <button onClick={() => setPage(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            <Filter className="h-4 w-4" /> Lọc
          </button>
          <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải danh sách bác sĩ..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">STT</th>
                    <th className="px-5 py-3.5">Ảnh</th>
                    <th className="px-5 py-3.5">Mã BS</th>
                    <th className="px-5 py-3.5">Bác sĩ</th>
                    <th className="px-5 py-3.5">Chuyên khoa</th>
                    <th className="px-5 py-3.5">Phòng khám</th>
                    <th className="px-5 py-3.5">Số lịch</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Cập nhật lúc</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy bác sĩ phù hợp.</td></tr>
                  ) : (
                    paged.map((doctor, index) => {
                      const status = getDoctorStatus(doctor);
                      return (
                        <tr key={doctor.id} className="text-sm transition-colors hover:bg-slate-50/60">
                          <td className="px-5 py-4"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(page - 1) * PAGE_SIZE + index + 1}</span></td>
                          <td className="px-5 py-4"><DoctorAvatar doctor={doctor} /></td>
                          <td className="px-5 py-4 font-mono font-semibold text-slate-700">{doctor.doctorid}</td>
                          <td className="px-5 py-4 font-semibold text-slate-800">{doctor.doctorname}</td>
                          <td className="px-5 py-4 text-slate-700">{getDoctorSpecialtyName(doctor)}</td>
                          <td className="px-5 py-4 text-slate-700">{getClinicName(doctor)}</td>
                          <td className="px-5 py-4 font-semibold text-primary-600">{getScheduleCount(doctor)}</td>
                          <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status.label}</span></td>
                          <td className="px-5 py-4 text-slate-600">{formatUpdatedAt(doctor.updatetime)}</td>
                          <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => router.push(`/doctors/${doctor.id}/edit`)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-primary transition-colors hover:bg-primary-50" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => openConfirmDelete(doctor.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition-colors hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button></div></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={doctorsData?.count ?? filtered.length} pageSize={PAGE_SIZE} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} variant="delete" title="Xóa bác sĩ" description="Bạn có chắc muốn xóa bác sĩ này? Hành động này không thể hoàn tác." confirmLabel="Xóa" isLoading={deleteMutation.isPending} onConfirm={handleConfirmDelete} />
    </div>
  );
}
