"use client";

import { useRouter } from "next/navigation";
import {
  hisServicesHooks,
  type HisService,
  type UpdateHisServicePayload,
} from "@/api/hisServicesApi";
import { toast } from "@/components/ui/Toast";
import { LoadingSection } from "@/components/ui/Spinner";
import {
  ServiceForm,
  getDefaultPrice,
  getInsuranceTypes,
  mapPriceLevelsToForm,
  parseInsuranceTypes,
  serializePriceLevels,
  type ServiceFormValues,
} from "../../_components/ServiceForm";

function mapServiceToForm(service: HisService): ServiceFormValues {
  return {
    service_id: service.serviceid ?? "",
    service_name: service.servicename === "—" ? "" : service.servicename ?? "",
    service_type: service.servicetype === "—" ? "" : service.servicetype ?? "",
    // Dịch vụ cũ (chỉ có 1 giá + chuỗi insurancetype) → mỗi loại bảo hiểm một dòng giá.
    price_levels: mapPriceLevelsToForm(
      service.price_levels,
      service.price ? String(service.price) : "",
      parseInsuranceTypes(service.insurancetype === "—" ? "" : service.insurancetype)
    ),
    exam_area_id: service.exam_area_id ?? "",
    specialty_id: service.specialty_id ?? "",
    description: service.description ?? "",
    booking_note: service.booking_note ?? "",
    display_group: service.display_group?.toString() ?? "",
    display_priority: service.display_priority?.toString() ?? "",
    room_visit_instruction: service.room_visit_instruction ?? "",
    detail: service.detail ?? "",
  };
}

export default function EditExamServicePage({
  params,
}: {
  params: { serviceId: string };
}) {
  const { serviceId } = params;
  const router = useRouter();

  const { data: service, isLoading, isError } = hisServicesHooks.useDetail(serviceId);

  const updateMutation = hisServicesHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật dịch vụ thành công");
      router.push("/exam-services");
    },
    onError: (err) => toast.error(err.message || "Cập nhật dịch vụ thất bại"),
  });

  function handleSubmit(form: ServiceFormValues) {
    // PUT /his-services/{id}: service_id, service_name, price, specialty_id,
    // exam_area_id là cột thật; field lạ (servicetype/insurancetype/description/
    // price_levels) được backend merge vào raw_data (giữ key cũ, đè key trùng).
    // exam_area_id/specialty_id để trống → gửi null để gỡ ràng buộc cũ.
    const payload: UpdateHisServicePayload = {
      service_name: form.service_name.trim(),
      // Cột `price` giữ mức giá mặc định; các mức còn lại nằm ở raw_data.price_levels.
      price: getDefaultPrice(form.price_levels),
      price_levels: serializePriceLevels(form.price_levels),
      exam_area_id: form.exam_area_id || null,
      specialty_id: form.specialty_id || null,
      booking_note: form.booking_note.trim() || null,
      display_group: form.display_group.trim() ? Number(form.display_group) : null,
      display_priority: form.display_priority.trim() ? Number(form.display_priority) : null,
      room_visit_instruction: form.room_visit_instruction.trim() || null,
      detail: form.detail.trim() || null,
      servicetype: form.service_type.trim() || undefined,
      insurancetype: getInsuranceTypes(form.price_levels) || undefined,
      description: form.description.trim() || undefined,
    };

    updateMutation.mutate({ id: serviceId, data: payload });
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSection text="Đang tải dịch vụ khám..." />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <p className="text-sm text-muted-foreground">Không tìm thấy dịch vụ khám.</p>
          <button
            onClick={() => router.push("/exam-services")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <ServiceForm
      title="Chỉnh sửa dịch vụ khám"
      subtitle="Cập nhật thông tin dịch vụ khám và mức giá theo từng loại bảo hiểm (BHYT, Khám thường, Khám VIP)."
      submitLabel="Lưu thay đổi"
      initialForm={mapServiceToForm(service)}
      isSubmitting={updateMutation.isPending}
      lockServiceId
      onSubmit={handleSubmit}
    />
  );
}
