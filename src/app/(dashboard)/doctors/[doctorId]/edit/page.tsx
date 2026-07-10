"use client";

import { useParams, useRouter } from "next/navigation";
import { doctorsHooks, type CreateDoctorPayload } from "@/api/doctorsApi";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { DoctorForm, createInitialDoctorForm, mapDoctorToForm, type DoctorFormValues } from "../../_components/DoctorForm";

function toPayload(form: DoctorFormValues): CreateDoctorPayload {
  return {
    doctor_id: form.doctorid.trim(),
    doctor_name: form.doctorname.trim(),
    specialty_id: form.specialty_id || undefined,
    description: form.description.trim() || null,
    avatar_url: form.avatar_url.trim() || null,
    academic_degree: form.academic_degree.trim() || null,
    academic_title: form.academic_title.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    gender: form.gender || null,
    date_of_birth: form.date_of_birth || null,
    booking_note: form.booking_note.trim() || null,
    booking_group: form.booking_group.trim() || null,
    status: form.status || "ACTIVE",
    display_group: form.display_group.trim() ? Number(form.display_group) : null,
    display_priority: form.display_priority.trim() ? Number(form.display_priority) : null,
  };
}

export default function EditDoctorPage() {
  const router = useRouter();
  const params = useParams<{ doctorId: string }>();
  const doctorId = params.doctorId;
  const { data: doctor, isLoading } = doctorsHooks.useDetail(doctorId);

  const updateMutation = doctorsHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật bác sĩ thành công");
      router.push("/doctors");
    },
    onError: (err) => toast.error(err.message || "Cập nhật bác sĩ thất bại"),
  });

  function handleSubmit(form: DoctorFormValues) {
    if (!form.doctorid.trim() || !form.doctorname.trim()) {
      toast.error("Vui lòng nhập mã và tên bác sĩ");
      return;
    }
    updateMutation.mutate({ id: doctorId, data: toPayload(form) });
  }

  if (isLoading) {
    return <LoadingSection text="Đang tải thông tin bác sĩ..." />;
  }

  return (
    <DoctorForm
      title="Chỉnh sửa bác sĩ"
      subtitle="Cập nhật thông tin bác sĩ, chuyên khoa và thông tin đặt khám."
      submitLabel="Lưu thay đổi"
      initialForm={doctor ? mapDoctorToForm(doctor) : createInitialDoctorForm()}
      isSubmitting={updateMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
