"use client";

import { useRouter } from "next/navigation";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";
import { SpecialtyForm } from "../_components/SpecialtyForm";
import { buildSpecialtyPayload, type SpecialtyFormValues } from "../types";

export default function NewSpecialtyPage() {
  const router = useRouter();

  const createMutation = specialtiesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo chuyên khoa thành công");
      router.push("/specialties");
    },
    onError: (err) => toast.error(err.message || "Tạo chuyên khoa thất bại"),
  });

  function handleSubmit(form: SpecialtyFormValues) {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên khoa");
      return;
    }
    createMutation.mutate(buildSpecialtyPayload(form) as Partial<AdminSpecialty>);
  }

  return (
    <SpecialtyForm
      title="Thêm chuyên khoa mới"
      subtitle="Tạo chuyên khoa và cấu hình thông tin đặt khám theo API specialties."
      submitLabel="Tạo chuyên khoa"
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
