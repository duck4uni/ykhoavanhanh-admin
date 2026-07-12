import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { HisDoctor } from "@/api/doctorsApi";

type DoctorComboboxProps = {
  value: string;
  doctors: HisDoctor[];
  search: string;
  isLoading: boolean;
  hasMore: boolean;
  onChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
};

export function DoctorCombobox({
  value,
  doctors,
  search,
  isLoading,
  hasMore,
  onChange,
  onSearchChange,
  onLoadMore,
}: DoctorComboboxProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDoctor = doctors.find((doctor) => doctor.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="mb-1 block text-sm font-medium text-foreground">
        Bác sĩ <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={selectedDoctor ? "text-slate-900" : "text-muted-foreground"}>
          {selectedDoctor
            ? selectedDoctor.doctorid
              ? `${selectedDoctor.doctorname} (${selectedDoctor.doctorid})`
              : selectedDoctor.doctorname
            : "-- Chọn bác sĩ --"}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm tên hoặc mã bác sĩ..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              autoFocus
            />
          </div>
          <div
            className="max-h-72 overflow-y-auto py-1"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (hasMore && !isLoading && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                onLoadMore();
              }
            }}
          >
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => {
                  onChange(doctor.id);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${doctor.id === value ? "bg-primary-100 text-primary-700" : "text-slate-700"}`}
              >
                {doctor.doctorid ? `${doctor.doctorname} (${doctor.doctorid})` : doctor.doctorname}
              </button>
            ))}
            {isLoading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải bác sĩ...</div>}
            {!isLoading && doctors.length === 0 && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Không tìm thấy bác sĩ phù hợp.</div>}
            {!isLoading && hasMore && (
              <button type="button" onClick={onLoadMore} className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50">
                Tải thêm bác sĩ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
