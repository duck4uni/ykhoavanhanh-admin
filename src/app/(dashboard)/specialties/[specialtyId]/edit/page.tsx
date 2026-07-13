"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { specialtiesHooks, assignSpecialtyExamAreas } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { SpecialtyForm } from "../../_components/SpecialtyForm";
import { buildSpecialtyPayload, mapSpecialtyToForm, type SpecialtyFormValues } from "../../types";

export default function EditSpecialtyPage() {
  const router = useRouter();
  const params = useParams<{ specialtyId: string }>();
  const specialtyId = params.specialtyId;
  const { data: specialty, isLoading } = specialtiesHooks.useDetail(specialtyId);

  const [isAssigning, setIsAssigning] = useState(false);
  const updateMutation = specialtiesHooks.useUpdate({
    onError: (err) => toast.error(err.message || "Cập nhật chuyên khoa thất bại"),
  });

  async function handleSubmit(form: SpecialtyFormValues) {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên khoa");
      return;
    }
    try {
      // B1: cập nhật thông tin chuyên khoa.
      await updateMutation.mutateAsync({ id: specialtyId, data: buildSpecialtyPayload(form) as Partial<AdminSpecialty> });
      // B2: nếu có chọn thêm khu vực khám thì gán vào chuyên khoa.
      if (form.exam_area_ids.length > 0) {
        setIsAssigning(true);
        await assignSpecialtyExamAreas(specialtyId, form.exam_area_ids);
      }
      toast.success("Cập nhật chuyên khoa thành công");
      router.push("/specialties");
    } catch (err) {
      toast.error((err as Error).message || "Gán khu vực khám thất bại");
    } finally {
      setIsAssigning(false);
    }
  }

  if (isLoading) {
    return <LoadingSection text="Đang tải thông tin chuyên khoa..." />;
  }

  return (
    <SpecialtyForm
      title="Chỉnh sửa chuyên khoa"
      subtitle="Cập nhật thông tin chuyên khoa và gán khu vực khám."
      submitLabel="Lưu thay đổi"
      initialForm={specialty ? mapSpecialtyToForm(specialty) : undefined}
      isSubmitting={updateMutation.isPending || isAssigning}
      onSubmit={handleSubmit}
    />
  );
}
