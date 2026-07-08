"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import {
  appointmentBookingsHooks,
  type AppointmentBookingListParams,
} from "@/api/appointmentBookingsApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { formatDateTime } from "@/lib/utils";
import { FiChevronDown, FiRotateCcw, FiSliders, FiX } from "react-icons/fi";

// const PAGE_SIZE_OPTIONS = [10, 20, 50];

type BookingFilters = {
  facility_id: string;
  patient_id: string;
  his_patient_id: string;
  doctor_id: string;
  room_id: string;
  service_id: string;
  status: string;
  source: string;
  from_date: string;
  to_date: string;
};

const initialFilters: BookingFilters = {
  facility_id: "",
  patient_id: "",
  his_patient_id: "",
  doctor_id: "",
  room_id: "",
  service_id: "",
  status: "",
  source: "",
  from_date: "",
  to_date: "",
};

function formatBookingStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const labels: Record<string, string> = {
    HIS_SYNCED: "Đã đồng bộ HIS",
    CONFIRMED: "Đã xác nhận",
    PAID: "Đã thanh toán",
    CANCELED: "Đã hủy",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    COMPLETED: "Hoàn tất",
  };
  return labels[status] ?? status;
}

function pruneEmptyFilters(filters: BookingFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value.trim() !== ""),
  ) as Partial<BookingFilters>;
}

type DoctorFilterComboboxProps = {
  /** Mã HIS bác sĩ (doctorid) đang chọn — dùng làm filter doctor_id. */
  value: string;
  onChange: (doctorId: string) => void;
};

function DoctorFilterCombobox({ value, onChange }: DoctorFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: doctors = [], isLoading } = doctorsHooks.useList(
    { doctorname: debouncedSearch || undefined, pageSize: 20 },
    { enabled: open },
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.doctorid === value),
    [doctors, value],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayLabel = value
    ? selectedDoctor
      ? `${selectedDoctor.doctorname} (${selectedDoctor.doctorid})`
      : value
    : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface-secondary px-3 text-left text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
      >
        <span
          className={displayLabel ? "truncate text-foreground" : "truncate text-muted-foreground"}
        >
          {displayLabel || "Tìm theo tên bác sĩ"}
        </span>
        {value ? (
          <FiX
            className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
          />
        ) : (
          <FiChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập tên bác sĩ..."
              className="h-9 w-full rounded-lg border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none focus:border-primary-500 focus:bg-white"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                Đang tải...
              </div>
            ) : doctors.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                Không tìm thấy bác sĩ phù hợp.
              </div>
            ) : (
              doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => {
                    onChange(doctor.doctorid);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${
                    doctor.doctorid === value
                      ? "bg-primary-100 text-primary-700"
                      : "text-slate-700"
                  }`}
                >
                  {doctor.doctorid
                    ? `${doctor.doctorname} (${doctor.doctorid})`
                    : doctor.doctorname}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientAppointmentBookingsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [draftFilters, setDraftFilters] =
    useState<BookingFilters>(initialFilters);
  const [filters, setFilters] = useState<BookingFilters>(initialFilters);

  const params = useMemo<AppointmentBookingListParams>(
    () => ({
      page,
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Danh sách lịch khám
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý lịch đặt khám của bệnh nhân 
        </p>
      </div>

      <Card className="overflow-visible p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Mã cơ sở
            </label>
            <input
              value={draftFilters.facility_id}
              onChange={(e) => handleFilterChange("facility_id", e.target.value)}
              placeholder="facility_id"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div> */}
          {/* <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Mã bệnh nhân
            </label>
            <input
              value={draftFilters.patient_id}
              onChange={(e) => handleFilterChange("patient_id", e.target.value)}
              placeholder="patient_id"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div> */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Mã BN HIS
            </label>
            <input
              value={draftFilters.his_patient_id}
              onChange={(e) => handleFilterChange("his_patient_id", e.target.value)}
              placeholder="his_patient_id"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Trạng thái
            </label>
            <select
              value={draftFilters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="">Tất cả</option>
              <option value="HIS_SYNCED">Đã đồng bộ HIS</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELED">Đã hủy</option>
              <option value="PENDING">Đang chờ</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Bác sĩ
            </label>
            <DoctorFilterCombobox
              value={draftFilters.doctor_id}
              onChange={(doctorId) => handleFilterChange("doctor_id", doctorId)}
            />
          </div>
          {/* <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Phòng
            </label>
            <input
              value={draftFilters.room_id}
              onChange={(e) => handleFilterChange("room_id", e.target.value)}
              placeholder="room_id"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div> */}
          {/* <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Dịch vụ
            </label>
            <input
              value={draftFilters.service_id}
              onChange={(e) => handleFilterChange("service_id", e.target.value)}
              placeholder="service_id"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div> */}
          {/* <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nguồn
            </label>
            <input
              value={draftFilters.source}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              placeholder="APP / WEB / PORTAL"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div> */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Từ ngày
            </label>
            <input
              type="date"
              value={draftFilters.from_date}
              onChange={(e) => handleFilterChange("from_date", e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Đến ngày
            </label>
            <input
              type="date"
              value={draftFilters.to_date}
              onChange={(e) => handleFilterChange("to_date", e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          {/* <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Số dòng/trang
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div> */}
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              className="h-11 gap-2 rounded-xl"
              onClick={applyFilters}
            >
              <FiSliders className="h-4 w-4" /> Lọc
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2 rounded-xl"
              onClick={resetFilters}
            >
              <FiRotateCcw className="h-4 w-4" /> Đặt lại
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Danh sách lịch khám
            </h2>
            {/* <p className="text-sm text-muted-foreground">
              Gọi /appointment-bookings với page, pageSize và các filter theo tài liệu API.
            </p> */}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {total} lịch khám
          </span>
        </div>

        {isLoading ? (
          <LoadingSection text="Đang tải danh sách lịch khám..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3.5">Thời gian hẹn</th>
                    <th className="px-5 py-3.5">Bệnh nhân</th>
                    <th className="px-5 py-3.5">Mã BN HIS</th>
                    <th className="px-5 py-3.5">Mã đặt khám</th>
                    <th className="px-5 py-3.5">Cơ sở</th>
                    <th className="px-5 py-3.5">Bác sĩ</th>
                    <th className="px-5 py-3.5">Phòng</th>
                    <th className="px-5 py-3.5">Dịch vụ</th>
                    <th className="px-5 py-3.5">Nguồn</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-5 py-12 text-center text-muted-foreground"
                      >
                        Không tìm thấy lịch khám phù hợp.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40"
                      >
                        <td className="px-5 py-4 font-medium text-foreground">
                          {booking.appointment_time
                            ? formatDateTime(booking.appointment_time)
                            : "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.patient?.patient_full_name ??
                            booking.patient_id ??
                            "—"}
                        </td>
                        <td className="px-5 py-4 font-mono text-primary-600">
                          {booking.his_patient_id ??
                            booking.patient?.his_patient_id ??
                            "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.his_booking_id ??
                            booking.request_booking_id ??
                            booking.id}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.facility?.facility_name ??
                            booking.facility_id ??
                            "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.doctor?.doctor_name ??
                            booking.doctor_id ??
                            "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.room?.room_name ?? booking.room_id ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.service?.service_name ??
                            booking.service_id ??
                            "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {booking.source ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                            {formatBookingStatus(booking.local_status)}
                          </span>
                        </td>
                      </tr>
                    ))
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
                pageSize={pageSize}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
