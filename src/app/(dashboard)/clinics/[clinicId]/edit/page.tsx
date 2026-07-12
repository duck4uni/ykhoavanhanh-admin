"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { roomsHooks, type UpdateRoomPayload } from "@/api/roomsApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { ClinicForm } from "../../_components/ClinicForm";
import type { PickerItem } from "../../_components/PickerList";
import { EMPTY_CLINIC_FORM, mapRoomToClinicForm, type ClinicFormValues } from "../../types";

export default function EditClinicPage() {
  const router = useRouter();
  const params = useParams<{ clinicId: string }>();
  const clinicId = params.clinicId;

  const { data: room, isLoading } = roomsHooks.useDetail(clinicId);
  const { data: services = [] } = hisServicesHooks.useList();

  const updateMutation = roomsHooks.useUpdate({
    onError: (err) => toast.error(err.message || "Cập nhật phòng khám thất bại"),
  });
  const assignServicesMutation = roomsHooks.useAssignServices({
    onError: (err) => toast.error(err.message || "Gán dịch vụ cho phòng khám thất bại"),
  });
  const unassignServiceMutation = roomsHooks.useUnassignService({
    onError: (err) => toast.error(err.message || "Bỏ gán dịch vụ khỏi phòng khám thất bại"),
  });
  const assignSpecialtiesMutation = roomsHooks.useAssignSpecialties({
    onError: (err) => toast.error(err.message || "Gán chuyên khoa cho phòng khám thất bại"),
  });
  const unassignSpecialtyMutation = roomsHooks.useUnassignSpecialty({
    onError: (err) => toast.error(err.message || "Bỏ gán chuyên khoa khỏi phòng khám thất bại"),
  });

  const initialForm = useMemo(() => (room ? mapRoomToClinicForm(room) : EMPTY_CLINIC_FORM), [room]);

  // Chuyên khoa đã gán sẵn để seed danh sách + preview (memo theo id phòng để không seed lặp).
  const initialSelectedSpecialties: AdminSpecialty[] = useMemo(() => {
    return (room?.his_room_specialties ?? [])
      .map((item) => item.specialty)
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ id: s.id, name: s.name, description: s.description ?? null } as AdminSpecialty));
  }, [room]);

  const serviceItems: PickerItem[] = useMemo(
    () => services.map((s) => ({ id: s.id, title: s.servicename, subtitle: s.serviceid })),
    [services]
  );

  const isSubmitting =
    updateMutation.isPending ||
    assignServicesMutation.isPending ||
    unassignServiceMutation.isPending ||
    assignSpecialtiesMutation.isPending ||
    unassignSpecialtyMutation.isPending;

  async function handleSubmit(form: ClinicFormValues) {
    if (!clinicId) return;
    if (!form.room_id.trim() || !form.room_name.trim()) {
      toast.error("Vui lòng nhập mã phòng và tên phòng khám");
      return;
    }

    const payload: UpdateRoomPayload = {
      room_id: form.room_id.trim(),
      room_name: form.room_name.trim(),
      description: form.description.trim() || null,
      exam_area_description: form.exam_area_description.trim() || null,
      visit_instruction: form.visit_instruction.trim() || null,
      clinic_type: form.clinic_type.trim() || null,
      exam_area_id: form.exam_area_id.trim() || null,
    };

    await updateMutation.mutateAsync({ id: clinicId, data: payload });

    const currentServiceIds = room?.his_room_services?.map((item) => item.service_id) ?? [];
    const serviceIdsToAssign = form.service_ids.filter((id) => !currentServiceIds.includes(id));
    const serviceIdsToUnassign = currentServiceIds.filter((id) => !form.service_ids.includes(id));

    if (serviceIdsToAssign.length > 0) {
      await assignServicesMutation.mutateAsync({ id: clinicId, serviceIds: serviceIdsToAssign });
    }
    for (const serviceId of serviceIdsToUnassign) {
      await unassignServiceMutation.mutateAsync({ id: clinicId, serviceId });
    }

    const currentSpecialtyIds = room?.his_room_specialties?.map((item) => item.specialty_id) ?? [];
    const specialtyIdsToAssign = form.specialty_ids.filter((id) => !currentSpecialtyIds.includes(id));
    const specialtyIdsToUnassign = currentSpecialtyIds.filter((id) => !form.specialty_ids.includes(id));

    if (specialtyIdsToAssign.length > 0) {
      await assignSpecialtiesMutation.mutateAsync({ id: clinicId, specialtyIds: specialtyIdsToAssign });
    }
    for (const specialtyId of specialtyIdsToUnassign) {
      await unassignSpecialtyMutation.mutateAsync({ id: clinicId, specialtyId });
    }

    toast.success("Cập nhật phòng khám thành công");
    router.push("/clinics");
  }

  if (isLoading || !room) {
    return <LoadingSection text="Đang tải thông tin phòng khám..." />;
  }

  return (
    <ClinicForm
      title="Chỉnh sửa phòng khám"
      subtitle="Cập nhật thông tin phòng khám, khu khám bệnh và loại phòng."
      submitLabel="Lưu thay đổi"
      initialForm={initialForm}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      initialSelectedSpecialties={initialSelectedSpecialties}
      editorResetKey={room.id}
      service={{
        items: serviceItems,
        emptyText: "Chưa có dịch vụ để gán.",
      }}
    />
  );
}
