"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { medicalRecordsHooks } from "@/api/medicalRecordsApi";
import { useGetPatientById, useInfinitePatients } from "@/api/patientApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { Patient, SearchPatientParams } from "@/types/patient";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  IdCard,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  X,
  ChevronDown,
} from "lucide-react";

function patientFullName(p: Patient): string {
  return (
    p.patient_full_name ||
    [p.patient_last_name, p.patient_first_name].filter(Boolean).join(" ") ||
    "—"
  );
}

const PATIENT_PAGE_SIZE = 8;

/** Suy ra param tìm kiếm: SĐT (bắt đầu "0", 10–11 số) vs mã BN (số/chữ) vs tên. */
function buildPatientSearchParams(trimmed: string): SearchPatientParams {
  if (!trimmed) return {};
  if (/^\d+$/.test(trimmed)) {
    const isPhone = trimmed.startsWith("0") && trimmed.length >= 10 && trimmed.length <= 11;
    return isPhone ? { patientphonenumber: trimmed } : { patientcode: trimmed };
  }
  if (!/\s/.test(trimmed) && /\d/.test(trimmed)) return { patientcode: trimmed };
  return { patientname: trimmed };
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-3 text-lg text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
          {step}
        </span>
        {title}
      </CardTitle>
    </CardHeader>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_120px_10px_1fr] items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

const inputClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";
const selectClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetPatientId = searchParams.get("patientId");

  // ─── Chọn bệnh nhân ────────────────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [committedSearch, setCommittedSearch] = useState<SearchPatientParams>({});

  // Luôn gọi API lấy danh sách bệnh nhân; cuộn xuống để tải thêm (infinite scroll).
  const {
    patients: patientResults,
    isLoading: isPatientsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePatients(committedSearch, { pageSize: PATIENT_PAGE_SIZE });

  // Sentinel để phát hiện cuộn tới cuối danh sách
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || selectedPatient) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedPatient, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefill bệnh nhân khi mở từ profile (?patientId=)
  const { data: presetPatient } = useGetPatientById(presetPatientId ?? undefined);
  const appliedPreset = useRef(false);
  useEffect(() => {
    if (presetPatient && !appliedPreset.current) {
      appliedPreset.current = true;
      setSelectedPatient(presetPatient);
    }
  }, [presetPatient]);

  function handleSearch() {
    setCommittedSearch(buildPatientSearchParams(searchValue.trim()));
  }

  // ─── Thông tin hồ sơ khám ──────────────────────────────────────────────
  const [form, setForm] = useState({
    examined_at: "",
    doctor_id: "",
    specialty_id: "",
    chief_complaint: "",
    diagnosis: "",
    conclusion: "",
    treatment_plan: "",
    doctor_note: "",
    total_amount: "",
    payment_status: "UNPAID",
    record_status: "COMPLETED",
  });

  // Trạng thái chọn Bác sĩ (Infinite Scroll + Search)
  const [doctorSearchValue, setDoctorSearchValue] = useState("");
  const [committedDoctorSearch, setCommittedDoctorSearch] = useState("");
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const doctorDropdownRef = useRef<HTMLDivElement | null>(null);

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctorPage,
    hasNextPage: hasNextDoctorPage,
    isFetchingNextPage: isFetchingNextDoctorPage,
    isLoading: isDoctorsLoading,
  } = doctorsHooks.useInfiniteList(
    { filters: committedDoctorSearch ? `doctorname@=${committedDoctorSearch}` : undefined },
    { pageSize: 10 }
  );

  const doctorsList = useMemo(
    () => doctorsInfiniteData?.pages.flatMap((p) => p.rows) ?? [],
    [doctorsInfiniteData]
  );

  // Sentinel để tự động tải thêm bác sĩ khi cuộn xuống cuối
  const loadMoreDoctorsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreDoctorsRef.current;
    if (!el || !isDoctorDropdownOpen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextDoctorPage && !isFetchingNextDoctorPage) {
          fetchNextDoctorPage();
        }
      },
      { rootMargin: "60px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDoctorDropdownOpen, hasNextDoctorPage, isFetchingNextDoctorPage, fetchNextDoctorPage]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
        setIsDoctorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: specialtiesData } = specialtiesHooks.useList();

  const specialtyOptions = useMemo(
    () => (specialtiesData?.rows ?? []).map((s) => ({ value: s.id, label: s.name })),
    [specialtiesData]
  );

  const createMutation = medicalRecordsHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo hồ sơ bệnh án thành công!");
      router.push("/medical-records");
    },
    onError: (err: Error) => toast.error(err.message || "Tạo hồ sơ bệnh án thất bại"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error("Vui lòng chọn bệnh nhân từ danh sách.");
      return;
    }
    if (!selectedPatient.facility_id) {
      toast.error("Bệnh nhân chưa gắn cơ sở y tế (facility_id).");
      return;
    }
    if (!form.examined_at) {
      toast.error("Vui lòng chọn thời điểm khám.");
      return;
    }
    if (!form.specialty_id) {
      toast.error("Vui lòng chọn chuyên khoa.");
      return;
    }
    if (!form.doctor_id) {
      toast.error("Vui lòng chọn bác sĩ khám.");
      return;
    }

    createMutation.mutate({
      facility_id: selectedPatient.facility_id,
      patient_id: selectedPatient.id,
      examined_at: new Date(form.examined_at).toISOString(),
      doctor_id: form.doctor_id || undefined,
      specialty_id: form.specialty_id || undefined,
      chief_complaint: form.chief_complaint.trim() || undefined,
      diagnosis: form.diagnosis.trim() || undefined,
      conclusion: form.conclusion.trim() || undefined,
      treatment_plan: form.treatment_plan.trim() || undefined,
      doctor_note: form.doctor_note.trim() || undefined,
      total_amount: form.total_amount ? Number(form.total_amount) : undefined,
      payment_status: form.payment_status || undefined,
      record_status: form.record_status || undefined,
    });
  };

  const loading = createMutation.isPending;
  const results = patientResults;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" className="h-10 gap-2 text-primary-700 hover:bg-primary-50" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tạo hồ sơ bệnh án</h1>
            <p className="mt-1 text-sm text-muted-foreground">Chọn bệnh nhân có sẵn và tạo hồ sơ khám bệnh</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {/* Bước 1: chọn bệnh nhân */}
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
                    ) : results.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Không tìm thấy bệnh nhân phù hợp.
                      </p>
                    ) : (
                      <>
                        <ul className="divide-y divide-slate-100">
                          {results.map((p) => (
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

          {/* Bước 2: thông tin khám */}
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
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            Không tìm thấy bác sĩ nào.
                          </p>
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
                                      {d.doctorid && (
                                        <p className="text-xs text-muted-foreground">Mã BS: {d.doctorid}</p>
                                      )}
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

          {/* Bước 3: nội dung y khoa */}
          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={3} title="Nội dung khám bệnh" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4">
                <TextArea label="Triệu chứng chính" name="chief_complaint" value={form.chief_complaint} onChange={handleChange} placeholder="Lý do khám / triệu chứng chính" />
                <TextArea label="Chẩn đoán" name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="Chẩn đoán của bác sĩ" />
                <TextArea label="Kết luận" name="conclusion" value={form.conclusion} onChange={handleChange} placeholder="Kết luận" />
                <TextArea label="Kế hoạch điều trị" name="treatment_plan" value={form.treatment_plan} onChange={handleChange} placeholder="Hướng điều trị, kê đơn..." />
                <TextArea label="Ghi chú của bác sĩ" name="doctor_note" value={form.doctor_note} onChange={handleChange} placeholder="Ghi chú thêm" />
              </div>
            </CardContent>
          </Card>

          {/* Bước 4: chi phí */}
          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={4} title="Chi phí & trạng thái" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  className={inputClass}
                  label="Tổng chi phí (VNĐ)"
                  name="total_amount"
                  inputMode="numeric"
                  value={form.total_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_amount: e.target.value.replace(/\D/g, "") }))}
                  placeholder="0"
                />
                <Select
                  label="Trạng thái thanh toán"
                  value={form.payment_status}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, payment_status: val }))}
                  options={[
                    { value: "UNPAID", label: "Chờ thanh toán" },
                    { value: "PAID", label: "Đã thanh toán" },
                    { value: "PARTIAL", label: "Thanh toán 1 phần" },
                  ]}
                  className={selectClass}
                />
                <Select
                  label="Trạng thái hồ sơ"
                  value={form.record_status}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, record_status: val }))}
                  options={[
                    { value: "COMPLETED", label: "Hoàn tất" },
                    { value: "DRAFT", label: "Nháp" },
                    { value: "CANCELLED", label: "Đã hủy" },
                  ]}
                  className={selectClass}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tóm tắt */}
        <div className="space-y-5">
          <Card className="sticky top-6 rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <ClipboardList className="h-5 w-5 text-primary-600" /> Tóm tắt hồ sơ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4 border-b border-slate-100 pb-5">
                <SummaryRow icon={UserRound} label="Bệnh nhân" value={selectedPatient ? patientFullName(selectedPatient) : "Chưa chọn"} />
                <SummaryRow icon={IdCard} label="Mã BN" value={selectedPatient?.his_patient_id ?? "—"} />
                <SummaryRow icon={Phone} label="SĐT" value={selectedPatient?.phone_number ?? "—"} />
                <SummaryRow icon={ShieldCheck} label="BHYT" value={selectedPatient?.insurance_number ?? "—"} />
                <SummaryRow icon={CalendarDays} label="Ngày khám" value={form.examined_at ? new Date(form.examined_at).toLocaleString("vi-VN") : "Chưa chọn"} />
              </div>

              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
                <p className="font-medium">Hồ sơ bệnh án được tạo cho bệnh nhân đã chọn.</p>
                <p className="mt-1 text-primary-700">Muốn thêm bệnh nhân mới, vào mục Bệnh nhân › Thêm bệnh nhân.</p>
              </div>

              <div className="grid grid-cols-[1fr_2fr] gap-3 pt-1">
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => router.back()}>Hủy</Button>
                <Button type="submit" variant="primary" className="h-11 rounded-xl" disabled={loading || !selectedPatient}>
                  {loading ? <><Spinner size="sm" className="mr-2" />Đang lưu...</> : "Tạo hồ sơ"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
      />
    </div>
  );
}
