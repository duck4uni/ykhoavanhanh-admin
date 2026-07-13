"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { specialtiesHooks, assignSpecialtyExamAreas } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";
import { SpecialtyForm } from "../_components/SpecialtyForm";
import { buildSpecialtyPayload, type SpecialtyFormValues } from "../types";

export default function NewSpecialtyPage() {
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);

  const createMutation = specialtiesHooks.useCreate({
    onError: (err) => toast.error(err.message || "Tạo chuyên khoa thất bại"),
  });

  async function handleSubmit(form: SpecialtyFormValues) {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên khoa");
      return;
    }
    try {
      // B1: tạo chuyên khoa trước để lấy id.
      const created = await createMutation.mutateAsync(buildSpecialtyPayload(form) as Partial<AdminSpecialty>);
      // B2: nếu có chọn khu vực khám thì gán vào chuyên khoa vừa tạo.
      if (form.exam_area_ids.length > 0) {
        setIsAssigning(true);
        await assignSpecialtyExamAreas(created.id, form.exam_area_ids);
      }
      toast.success("Tạo chuyên khoa thành công");
      router.push("/specialties");
    } catch (err) {
      toast.error((err as Error).message || "Gán khu vực khám thất bại");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <SpecialtyForm
      title="Thêm chuyên khoa mới"
      subtitle="Tạo chuyên khoa và cấu hình thông tin"
      submitLabel="Tạo chuyên khoa"
      isSubmitting={createMutation.isPending || isAssigning}
      onSubmit={handleSubmit}
    />
  );
}
