import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SectionTitle } from "./primitives";
import { patientFullName } from "../types";
import type { NewMedicalRecordController } from "../hooks/useNewMedicalRecordForm";

/** Bước 1: chọn bệnh nhân (search + infinite scroll). */
export function PatientPicker({ ctrl }: { ctrl: NewMedicalRecordController }) {
  const {
    selectedPatient,
    setSelectedPatient,
    searchValue,
    setSearchValue,
    handleSearch,
    patientResults,
    isPatientsLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
  } = ctrl;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={1} title="Chọn bệnh nhân" />
      <CardContent className="space-y-4 pt-2">
        {selectedPatient ? (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-primary-100 bg-primary-50 p-4">
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">{patientFullName(selectedPatient)}</p>
              <p className="text-sm text-slate-600">
                Mã BN: <b>{selectedPatient.his_patient_id ?? "—"}</b>
                {selectedPatient.phone_number ? ` • ${selectedPatient.phone_number}` : ""}
              </p>
              {selectedPatient.insurance_number && (
                <p className="text-xs text-slate-500">BHYT: {selectedPatient.insurance_number}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => setSelectedPatient(null)}
            >
              <X className="h-3.5 w-3.5" /> Đổi bệnh nhân
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  placeholder="Tìm theo tên, mã bệnh nhân hoặc số điện thoại"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <Button type="button" variant="primary" className="h-11 gap-2 rounded-xl" onClick={handleSearch}>
                <Search className="h-4 w-4" /> Tìm
              </Button>
            </div>

            <div className="max-h-[440px] overflow-y-auto rounded-xl border border-slate-100">
              {isPatientsLoading ? (
                <div className="py-6">
                  <Spinner size="sm" className="mx-auto" />
                </div>
              ) : patientResults.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy bệnh nhân phù hợp.
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-slate-100">
                    {patientResults.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(p)}
                          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-surface-secondary/60"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{patientFullName(p)}</p>
                            <p className="text-xs text-muted-foreground">
                              Mã BN: {p.his_patient_id ?? "—"}
                              {p.phone_number ? ` • ${p.phone_number}` : ""}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-primary-600">Chọn</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div ref={loadMoreRef} className="border-t border-slate-100 px-4 py-3 text-center text-sm text-muted-foreground">
                    {isFetchingNextPage ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" /> Đang tải thêm bệnh nhân...
                      </span>
                    ) : hasNextPage ? (
                      "Cuộn xuống để tải thêm"
                    ) : (
                      "Đã tải hết danh sách bệnh nhân"
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
