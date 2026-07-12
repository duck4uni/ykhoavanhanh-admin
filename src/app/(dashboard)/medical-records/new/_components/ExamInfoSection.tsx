import { ChevronDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SectionTitle } from "./primitives";
import { inputClass, selectClass } from "../types";
import type { NewMedicalRecordController } from "../hooks/useNewMedicalRecordForm";

/** Bước 2: thông tin khám (thời điểm, chuyên khoa, bác sĩ với dropdown infinite scroll). */
export function ExamInfoSection({ ctrl }: { ctrl: NewMedicalRecordController }) {
  const {
    form,
    setForm,
    handleChange,
    specialtyOptions,
    doctorDropdownRef,
    doctorSearchValue,
    setDoctorSearchValue,
    setCommittedDoctorSearch,
    isDoctorDropdownOpen,
    setIsDoctorDropdownOpen,
    selectedDoctorName,
    setSelectedDoctorName,
    doctorsList,
    isDoctorsLoading,
    hasNextDoctorPage,
    isFetchingNextDoctorPage,
    loadMoreDoctorsRef,
  } = ctrl;

  return (
    <Card className="relative z-20 overflow-visible rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={2} title="Thông tin khám" />
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            className={inputClass}
            label="Thời điểm khám *"
            name="examined_at"
            type="datetime-local"
            value={form.examined_at}
            onChange={handleChange}
            required
          />
          <Select
            label="Chuyên khoa *"
            value={form.specialty_id}
            onValueChange={(val) => setForm((prev) => ({ ...prev, specialty_id: val }))}
            options={specialtyOptions}
            placeholder="Chọn chuyên khoa"
            className={selectClass}
          />
          {/* Bác sĩ khám (Infinite Scroll Dropdown) */}
          <div className="relative" ref={doctorDropdownRef}>
            <label className="mb-1 block text-sm font-medium text-foreground">Bác sĩ khám *</label>
            <button
              type="button"
              onClick={() => setIsDoctorDropdownOpen((prev) => !prev)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-none outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            >
              <span className={selectedDoctorName ? "text-slate-800" : "text-slate-400"}>
                {selectedDoctorName || "Chọn bác sĩ"}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {isDoctorDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <div className="flex gap-2 pb-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={doctorSearchValue}
                      onChange={(e) => setDoctorSearchValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setCommittedDoctorSearch(doctorSearchValue.trim());
                        }
                      }}
                      placeholder="Nhập tên bác sĩ rồi ấn Tìm..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-primary-500"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="h-10 rounded-lg px-3 text-xs"
                    onClick={() => setCommittedDoctorSearch(doctorSearchValue.trim())}
                  >
                    Tìm
                  </Button>
                </div>

                <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-100">
                  {isDoctorsLoading && doctorsList.length === 0 ? (
                    <div className="py-4 text-center">
                      <Spinner size="sm" className="mx-auto" />
                    </div>
                  ) : doctorsList.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Không tìm thấy bác sĩ nào.</p>
                  ) : (
                    <>
                      <ul className="divide-y divide-slate-100">
                        {doctorsList.map((d) => (
                          <li key={d.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, doctor_id: d.id }));
                                setSelectedDoctorName(d.doctorname);
                                setIsDoctorDropdownOpen(false);
                              }}
                              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-surface-secondary/60"
                            >
                              <div>
                                <p className="font-medium text-slate-900">{d.doctorname}</p>
                                {d.doctorid && <p className="text-xs text-muted-foreground">Mã BS: {d.doctorid}</p>}
                              </div>
                              {form.doctor_id === d.id && (
                                <span className="text-xs font-semibold text-primary-600">Đang chọn</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div
                        ref={loadMoreDoctorsRef}
                        className="border-t border-slate-100 py-2.5 text-center text-xs text-muted-foreground"
                      >
                        {isFetchingNextDoctorPage ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Spinner size="sm" /> Đang tải thêm...
                          </span>
                        ) : hasNextDoctorPage ? (
                          "Cuộn xuống để tải thêm"
                        ) : (
                          "Đã tải hết danh sách bác sĩ"
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
