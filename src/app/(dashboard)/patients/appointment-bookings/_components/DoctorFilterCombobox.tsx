import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { doctorsHooks } from "@/api/doctorsApi";

type DoctorFilterComboboxProps = {
  /** Mã HIS bác sĩ (doctorid) đang chọn — dùng làm filter doctor_id. */
  value: string;
  onChange: (doctorId: string) => void;
};

export function DoctorFilterCombobox({ value, onChange }: DoctorFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: doctorsPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = doctorsHooks.useInfiniteList(
    {
      filters: debouncedSearch ? `doctor_name@=${debouncedSearch}` : undefined,
      sortField: "doctor_name",
      sortOrder: "ASC",
    },
    { enabled: open, pageSize: 10 },
  );

  const doctors = useMemo(() => doctorsPages?.pages.flatMap((p) => p.rows) ?? [], [doctorsPages]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.doctorid === value),
    [doctors, value],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        <span className={displayLabel ? "truncate text-foreground" : "truncate text-muted-foreground"}>
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
          <div
            className="max-h-64 overflow-y-auto py-1"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (hasNextPage && !isFetchingNextPage && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                fetchNextPage();
              }
            }}
          >
            {isLoading ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải...</div>
            ) : doctors.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">Không tìm thấy bác sĩ phù hợp.</div>
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
                    doctor.doctorid === value ? "bg-primary-100 text-primary-700" : "text-slate-700"
                  }`}
                >
                  {doctor.doctorid ? `${doctor.doctorname} (${doctor.doctorid})` : doctor.doctorname}
                </button>
              ))
            )}
            {!isLoading && isFetchingNextPage && (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải thêm...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
