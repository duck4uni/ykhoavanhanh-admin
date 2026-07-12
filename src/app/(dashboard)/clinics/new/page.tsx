"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { roomsHooks, type CreateRoomPayload } from "@/api/roomsApi";
import { toast } from "@/components/ui/Toast";
import { ClinicForm } from "../_components/ClinicForm";
import type { PickerItem } from "../_components/PickerList";
import { useServicePicker } from "../hooks/useServicePicker";
import { EMPTY_CLINIC_FORM, type ClinicFormValues } from "../types";

export default function NewClinicPage() {
  const router = useRouter();
  const servicePicker = useServicePicker();

  const createMutation = roomsHooks.useCreate({
    onError: (err) => toast.error(err.message || "Tạo phòng khám thất bại"),
  });
  const assignServicesMutation = roomsHooks.useAssignServices({
    onError: (err) => toast.error(err.message || "Gán dịch vụ cho phòng khám thất bại"),
  });
  const assignSpecialtiesMutation = roomsHooks.useAssignSpecialties({
    onError: (err) => toast.error(err.message || "Gán chuyên khoa cho phòng khám thất bại"),
  });

  const serviceItems: PickerItem[] = useMemo(
    () => servicePicker.services.map((s) => ({ id: s.id, title: s.servicename, subtitle: s.serviceid })),
    [servicePicker.services]
  );

  const isSubmitting =
    createMutation.isPending || assignServicesMutation.isPending || assignSpecialtiesMutation.isPending;

  async function handleSubmit(form: ClinicFormValues) {
    if (!form.room_id.trim() || !form.room_name.trim()) {
      toast.error("Vui lòng nhập mã phòng và tên phòng khám");
      return;
    }

    const payload: CreateRoomPayload = {
      room_id: form.room_id.trim(),
      room_name: form.room_name.trim(),
      description: form.description.trim() || null,
      exam_area_description: form.exam_area_description.trim() || null,
      visit_instruction: form.visit_instruction.trim() || null,
      clinic_type: form.clinic_type.trim() || null,
      exam_area_id: form.exam_area_id.trim() || null,
    };

    const createdRoom = await createMutation.mutateAsync(payload);
    if (form.specialty_ids.length > 0) {
      await assignSpecialtiesMutation.mutateAsync({ id: createdRoom.id, specialtyIds: form.specialty_ids });
    }
    if (form.service_ids.length > 0) {
      await assignServicesMutation.mutateAsync({ id: createdRoom.id, serviceIds: form.service_ids });
    }
    toast.success("Tạo phòng khám thành công");
    router.push("/clinics");
  }

  return (
    <ClinicForm
      title="Thêm phòng khám"
      subtitle="Tạo mới phòng khám, gán khu khám bệnh và loại phòng."
      submitLabel="Tạo phòng khám"
      initialForm={EMPTY_CLINIC_FORM}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      service={{
        items: serviceItems,
        isFetching: servicePicker.isFetching,
        search: servicePicker.search,
        onSearchChange: servicePicker.setSearch,
        onScroll: servicePicker.handleScroll,
        emptyText: "Không tìm thấy dịch vụ phù hợp.",
      }}
    />
  );
}
