"use client";

import { useRouter } from "next/navigation";
import { hisServicesHooks, type CreateHisServicePayload } from "@/api/hisServicesApi";
import { toast } from "@/components/ui/Toast";
import {
  ServiceForm,
  createInitialServiceForm,
  type ServiceFormValues,
} from "../_components/ServiceForm";

export default function NewExamServicePage() {
  const router = useRouter();

  const createMutation = hisServicesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo dịch vụ thành công");
      router.push("/exam-services");
    },
    onError: (err) => toast.error(err.message || "Tạo dịch vụ thất bại"),
  });

  function handleSubmit(form: ServiceFormValues) {
    if (!form.exam_area_id) {
      toast.error("Vui lòng chọn khu vực khám");
      return;
    }

    // POST /his-services ghi thẳng các cột thật: exam_area_id, service_id,
    // service_name, price, specialty_id, raw_data. Field lạ ở top-level KHÔNG được
    // merge vào raw_data (khác PUT) → mọi field mở rộng (servicetype/insurancetype/
    // description) phải nằm trong raw_data, dùng đúng key normalizeHisService đọc lại.
    const rawData: Record<string, unknown> = {};
    const serviceType = form.service_type.trim();
    const insuranceType = form.insurance_types.join("/");
    const description = form.description.trim();
    if (serviceType) rawData.servicetype = serviceType;
    if (insuranceType) rawData.insurancetype = insuranceType;
    if (description) rawData.description = description;

    const payload: CreateHisServicePayload = {
      // Khu vực khám (exam_area_id) — chọn từ danh sách GET /exam-areas.
      exam_area_id: form.exam_area_id,
      service_id: form.service_id.trim(),
      service_name: form.service_name.trim(),
      price: form.price.trim() ? Number(form.price) : undefined,
      specialty_id: form.specialty_id || undefined,
      booking_note: form.booking_note.trim() || null,
      display_group: form.display_group.trim() ? Number(form.display_group) : null,
      display_priority: form.display_priority.trim() ? Number(form.display_priority) : null,
      room_visit_instruction: form.room_visit_instruction.trim() || null,
      detail: form.detail.trim() || null,
      raw_data: Object.keys(rawData).length > 0 ? rawData : undefined,
    };

    createMutation.mutate(payload);
  }

  return (
    <ServiceForm
      title="Thêm dịch vụ khám"
      subtitle="Tạo mới dịch vụ khám, thiết lập giá, loại bảo hiểm và chuyên khoa."
      submitLabel="Tạo dịch vụ"
      initialForm={createInitialServiceForm()}
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
