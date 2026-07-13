import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import { medicalRecordsHooks } from "@/api/medicalRecordsApi";
import { useGetPatientById, useInfinitePatients } from "@/api/patientApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { Patient, SearchPatientParams } from "@/types/patient";
import {
  PATIENT_PAGE_SIZE,
  buildPatientSearchParams,
  createInitialForm,
} from "../types";

/** Toàn bộ state + logic cho trang "Tạo hồ sơ bệnh án". */
export function useNewMedicalRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetPatientId = searchParams.get("patientId");

  // ─── Chọn bệnh nhân ────────────────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [committedSearch, setCommittedSearch] = useState<SearchPatientParams>({});

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
  const [form, setForm] = useState(createInitialForm);

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

  return {
    router,
    // patient picker
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
    // form
    form,
    setForm,
    handleChange,
    handleSubmit,
    specialtyOptions,
    // doctor dropdown
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
    // submit state
    isSaving: createMutation.isPending,
  };
}

export type NewMedicalRecordController = ReturnType<typeof useNewMedicalRecordForm>;
