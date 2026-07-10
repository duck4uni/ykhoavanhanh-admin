"use client";

import { useRouter } from "next/navigation";
import { doctorsHooks, type CreateDoctorPayload } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { DoctorForm, createInitialDoctorForm, type DoctorFormValues } from "../_components/DoctorForm";

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

export default function NewDoctorPage() {
  const router = useRouter();
  const createMutation = doctorsHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo bác sĩ thành công");
      router.push("/doctors");
    },
    onError: (err) => toast.error(err.message || "Tạo bác sĩ thất bại"),
  });

  function handleSubmit(form: DoctorFormValues) {
    if (!form.doctorid.trim() || !form.doctorname.trim()) {
      toast.error("Vui lòng nhập mã và tên bác sĩ");
      return;
    }
    createMutation.mutate(toPayload(form));
  }

  return (
    <DoctorForm
      title="Thêm bác sĩ"
      subtitle="Tạo mới bác sĩ, gán chuyên khoa và thiết lập thông tin đặt khám."
      submitLabel="Tạo bác sĩ"
      initialForm={createInitialDoctorForm()}
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
