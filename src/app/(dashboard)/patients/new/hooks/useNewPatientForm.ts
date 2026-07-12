import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateAdminPatient } from "@/api/adminPatientsApi";
import { useProvinces, useWards } from "@/api/addressesApi";
import { roomsHooks } from "@/api/roomsApi";
import { toast } from "@/components/ui/Toast";
import { FALLBACK_FACILITY_ID, createInitialForm } from "../types";

/** State + logic cho trang "Thêm bệnh nhân mới". */
export function useNewPatientForm() {
  const router = useRouter();
  const [form, setForm] = useState(createInitialForm);

  const { data: rooms } = roomsHooks.useList();
  const { data: provinces } = useProvinces();
  const { data: wards } = useWards(form.province_code || null);

  const facilityId = rooms?.find((r) => r.facility_id)?.facility_id || FALLBACK_FACILITY_ID;

  const createMutation = useCreateAdminPatient({
    onSuccess: () => {
      toast.success("Đã thêm bệnh nhân thành công!");
      router.push("/patients");
    },
    onError: (err) => toast.error(err.message || "Tạo bệnh nhân thất bại"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fullName = useMemo(
    () => [form.patient_last_name, form.patient_first_name].filter(Boolean).join(" ").trim(),
    [form.patient_last_name, form.patient_first_name]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.his_patient_id.trim()) {
      toast.error("Vui lòng nhập mã bệnh nhân (mã HIS).");
      return;
    }
    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên bệnh nhân.");
      return;
    }
    if (form.phone_number && !/^\d{10}$/.test(form.phone_number)) {
      toast.error("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }

    const addressFull = [
      form.address_detail,
      form.address_street,
      form.ward_name,
      form.province_name,
      form.country_name,
    ]
      .filter(Boolean)
      .join(", ");

    createMutation.mutate({
      facility_id: facilityId,
      his_patient_id: form.his_patient_id.trim(),
      patient_full_name: fullName,
      patient_first_name: form.patient_first_name.trim() || undefined,
      patient_last_name: form.patient_last_name.trim() || undefined,
      birthday: form.birthday || undefined,
      birth_year: form.birthday ? form.birthday.slice(0, 4) : undefined,
      sex: form.sex || undefined,
      ethnic_name: form.ethnic_name.trim() || undefined,
      profession_name: form.profession_name.trim() || undefined,
      identity_number: form.identity_number.trim() || undefined,
      insurance_number: form.insurance_number.trim() || undefined,
      insurance_expired_date_text: form.insurance_expired_date_text || undefined,
      phone_number: form.phone_number.trim() || undefined,
      address_detail: form.address_detail.trim() || undefined,
      address_street: form.address_street.trim() || undefined,
      ward_code: form.ward_code || undefined,
      ward_name: form.ward_name || undefined,
      province_code: form.province_code || undefined,
      province_name: form.province_name || undefined,
      country_code: form.country_code || undefined,
      country_name: form.country_name || undefined,
      address_full: addressFull || undefined,
    });
  };

  const isLoadingAddress = !provinces;
  const provinceOptions = provinces?.map((p) => ({ value: p.city, label: p.cityname })) || [];
  const wardOptions = wards?.map((w) => ({ value: w.wardcode, label: w.wardname || w.wardcode })) || [];

  return {
    router,
    form,
    setForm,
    handleChange,
    fullName,
    handleSubmit,
    isSaving: createMutation.isPending,
    rooms,
    provinces,
    wards,
    isLoadingAddress,
    provinceOptions,
    wardOptions,
  };
}

export type NewPatientController = ReturnType<typeof useNewPatientForm>;
