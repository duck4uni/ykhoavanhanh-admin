"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, DoorOpen, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { roomsHooks, type UpdateRoomPayload } from "@/api/roomsApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { useDebounce } from "@/hooks/useApiHelpers";

type ClinicFormValues = {
  room_id: string;
  room_name: string;
  description: string;
  exam_area_description: string;
  visit_instruction: string;
  clinic_type: string;
  exam_area_id: string;
  specialty_ids: string[];
  service_ids: string[];
};

const SPECIALTY_PAGE_SIZE = 20;
const EMPTY_FORM: ClinicFormValues = {
  room_id: "",
  room_name: "",
  description: "",
  exam_area_description: "",
  visit_instruction: "",
  clinic_type: "",
  exam_area_id: "",
  specialty_ids: [],
  service_ids: [],
};

export default function EditClinicPage() {
  const router = useRouter();
  const params = useParams<{ clinicId: string }>();
  const clinicId = params.clinicId;
  const [form, setForm] = useState<ClinicFormValues>(EMPTY_FORM);
  const [isFormReady, setIsFormReady] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [specialtyPage, setSpecialtyPage] = useState(1);
  const [specialties, setSpecialties] = useState<AdminSpecialty[]>([]);
  const debouncedSpecialtySearch = useDebounce(specialtySearch, 400);

  const { data: room, isLoading } = roomsHooks.useDetail(clinicId);
  const { data: examAreasData } = examAreasHooks.useList({ pageSize: 100 });
  const examAreas = examAreasData?.rows ?? [];
  const { data: services = [] } = hisServicesHooks.useList();

  const specialtyFilters = debouncedSpecialtySearch.trim()
    ? `name@=${debouncedSpecialtySearch.trim()}`
    : undefined;
  const { data: specialtiesData, isFetching: isFetchingSpecialties } = specialtiesHooks.useList({
    currentPage: specialtyPage,
    pageSize: SPECIALTY_PAGE_SIZE,
    filters: specialtyFilters,
  });
  const hasMoreSpecialties = specialtyPage < (specialtiesData?.totalPages ?? 1);

  useEffect(() => {
    if (!room) return;
    const assignedSpecialtyIds = (room.his_room_specialties ?? [])
      .map((item) => item.specialty_id || item.specialty?.id)
      .filter((id): id is string => Boolean(id));

    setForm({
      room_id: room.roomid,
      room_name: room.roomname,
      description: room.description ?? "",
      exam_area_description: room.exam_area_description ?? "",
      visit_instruction: room.visit_instruction ?? "",
      clinic_type: room.clinic_type ?? "",
      exam_area_id: room.exam_area_id ?? "",
      specialty_ids: assignedSpecialtyIds,
      service_ids: room.his_room_services?.map((item) => item.service_id) ?? [],
    });
    setIsFormReady(true);
  }, [room]);

  useEffect(() => {
    setSpecialtyPage(1);
  }, [debouncedSpecialtySearch]);

  useEffect(() => {
    const rows = specialtiesData?.rows ?? [];
    const assigned = (room?.his_room_specialties ?? [])
      .map((item) => item.specialty)
      .filter((specialty): specialty is NonNullable<typeof specialty> => Boolean(specialty))
      .map((specialty) => ({
        id: specialty.id,
        name: specialty.name,
        description: specialty.description ?? null,
      } as AdminSpecialty));

    setSpecialties((current) => {
      const next = specialtyPage === 1
        ? [...assigned]
        : [...current];
      for (const specialty of rows) {
        if (!next.some((item) => item.id === specialty.id)) {
          next.push(specialty);
        }
      }
      return next;
    });
  }, [specialtyPage, specialtiesData, room]);

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

  function toggleService(serviceId: string) {
    setForm((current) => ({
      ...current,
      service_ids: current.service_ids.includes(serviceId)
        ? current.service_ids.filter((id) => id !== serviceId)
        : [...current.service_ids, serviceId],
    }));
  }

  function toggleSpecialty(specialtyId: string) {
    setForm((current) => ({
      ...current,
      specialty_ids: current.specialty_ids.includes(specialtyId)
        ? current.specialty_ids.filter((id) => id !== specialtyId)
        : [...current.specialty_ids, specialtyId],
    }));
  }

  function handleSpecialtiesScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 48 && hasMoreSpecialties && !isFetchingSpecialties) {
      setSpecialtyPage((current) => current + 1);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!clinicId) return;
    if (!form.room_id.trim() || !form.room_name.trim()) {
      toast.error("Vui lòng nhập mã phòng và tên phòng khám");
      return;
    }

    // PUT /rooms/{id} chỉ cập nhật thông tin phòng; quan hệ chuyên khoa/dịch vụ
    // dùng endpoint riêng. Chỉ PUT field thực sự đổi để tránh chặn việc cập nhật
    // quan hệ khi người dùng chỉ sửa chuyên khoa hoặc dịch vụ.
    const payload: UpdateRoomPayload = {};
    const roomId = form.room_id.trim();
    const roomName = form.room_name.trim();
    const description = form.description.trim() || null;
    const examAreaDescription = form.exam_area_description.trim() || null;
    const visitInstruction = form.visit_instruction.trim() || null;
    const clinicType = form.clinic_type.trim() || null;
    const examAreaId = form.exam_area_id.trim() || null;

    if (roomId !== room?.roomid) payload.room_id = roomId;
    if (roomName !== room?.roomname) payload.room_name = roomName;
    if (description !== (room?.description ?? null)) payload.description = description;
    if (examAreaDescription !== (room?.exam_area_description ?? null)) payload.exam_area_description = examAreaDescription;
    if (visitInstruction !== (room?.visit_instruction ?? null)) payload.visit_instruction = visitInstruction;
    if (clinicType !== (room?.clinic_type ?? null)) payload.clinic_type = clinicType;
    if (examAreaId !== (room?.exam_area_id ?? null)) payload.exam_area_id = examAreaId;

    if (Object.keys(payload).length > 0) {
      await updateMutation.mutateAsync({ id: clinicId, data: payload });
    }

    const currentServiceIds = room?.his_room_services?.map((item) => item.service_id) ?? [];
    const serviceIdsToAssign = form.service_ids.filter((id) => !currentServiceIds.includes(id));
    const serviceIdsToUnassign = currentServiceIds.filter((id) => !form.service_ids.includes(id));

    if (serviceIdsToAssign.length > 0) {
      await assignServicesMutation.mutateAsync({ id: clinicId, serviceIds: serviceIdsToAssign });
    }
    for (const serviceId of serviceIdsToUnassign) {
      await unassignServiceMutation.mutateAsync({ id: clinicId, serviceId });
    }

    const currentSpecialtyIds = (room?.his_room_specialties ?? [])
      .map((item) => item.specialty_id || item.specialty?.id)
      .filter((id): id is string => Boolean(id));
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/clinics")}
            className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-500 shadow-sm transition-colors hover:bg-surface-secondary"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chỉnh sửa phòng khám</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cập nhật thông tin phòng khám, khu khám bệnh và loại phòng.
            </p>
          </div>
        </div>
      </div>

      {isLoading || !isFormReady ? (
        <LoadingSection text="Đang tải thông tin phòng khám..." />
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          {/* Form */}
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Mã phòng *"
                  value={form.room_id}
                  onChange={(e) => setForm((p) => ({ ...p, room_id: e.target.value }))}
                  placeholder="VD: PK01"
                />
                <Input
                  label="Tên phòng khám *"
                  value={form.room_name}
                  onChange={(e) => setForm((p) => ({ ...p, room_name: e.target.value }))}
                  placeholder="VD: Phòng khám Nội tổng quát"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Khu khám bệnh</label>
                  <select
                    value={form.exam_area_id}
                    onChange={(e) => setForm((p) => ({ ...p, exam_area_id: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option value="">-- Chọn khu khám bệnh --</option>
                    {examAreas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Loại phòng khám"
                  value={form.clinic_type}
                  onChange={(e) => setForm((p) => ({ ...p, clinic_type: e.target.value }))}
                  placeholder="VD: OUTPATIENT"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Chuyên khoa của phòng khám</label>
                <Input
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                  placeholder="Tìm theo tên chuyên khoa..."
                />
                <div
                  onScroll={handleSpecialtiesScroll}
                  className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3"
                >
                  {specialties.length === 0 && !isFetchingSpecialties ? (
                    <p className="text-sm text-muted-foreground">Không tìm thấy chuyên khoa phù hợp.</p>
                  ) : (
                    specialties.map((specialty) => {
                      const checked = form.specialty_ids.includes(specialty.id);
                      return (
                        <label
                          key={specialty.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? "border-primary-200 bg-primary-50 text-primary-700"
                              : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSpecialty(specialty.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium">{specialty.name}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                  {isFetchingSpecialties && (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                      <Spinner size="sm" /> Đang tải chuyên khoa...
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Có thể chọn nhiều chuyên khoa cho cùng một phòng khám. Cuộn xuống để tải thêm.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Dịch vụ của phòng khám</label>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có dịch vụ để gán.</p>
                  ) : (
                    services.map((service) => {
                      const checked = form.service_ids.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? "border-primary-200 bg-primary-50 text-primary-700"
                              : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium">{service.servicename}</span>
                            <span className="block font-mono text-xs text-muted-foreground">{service.serviceid}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Có thể chọn nhiều dịch vụ cho cùng một phòng khám.</p>
              </div>

              <Input
                label="Mô tả khu khám"
                value={form.exam_area_description}
                onChange={(e) => setForm((p) => ({ ...p, exam_area_description: e.target.value }))}
                placeholder="VD: Khu khám tầng 2"
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Hướng dẫn vào khám</label>
                <div className="clinic-instruction-editor min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                  <TextEditor
                    key={room?.id}
                    content={form.visit_instruction}
                    onChangeContent={(content) => setForm((p) => ({ ...p, visit_instruction: content }))}
                    contentClassName="min-h-[180px] [overflow-wrap:anywhere]"
                  />
                </div>
              </div>
              <Input
                label="Mô tả"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Nhập mô tả phòng khám (không bắt buộc)"
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending || assignServicesMutation.isPending || unassignServiceMutation.isPending || assignSpecialtiesMutation.isPending || unassignSpecialtyMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {(updateMutation.isPending || assignServicesMutation.isPending || unassignServiceMutation.isPending || assignSpecialtiesMutation.isPending || unassignSpecialtyMutation.isPending) && <Spinner size="sm" />}Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/clinics")}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>

          {/* Xem trước */}
          <div className="min-w-0 lg:sticky lg:top-6">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-sm font-semibold text-slate-700">Xem trước</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Thông tin phòng khám sẽ hiển thị như bên dưới.
                </p>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-800">
                      {form.room_name.trim() || "Tên phòng khám"}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-primary-600">
                      {form.room_id.trim() || "Mã phòng"}
                    </p>
                  </div>
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> Khu khám bệnh
                    </dt>
                    <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                      {examAreas.find((a) => a.id === form.exam_area_id)?.name || room?.exam_area?.name || "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" /> Loại phòng khám
                    </dt>
                    <dd className="font-medium text-slate-700">
                      {form.clinic_type.trim() || "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" /> Chuyên khoa
                    </dt>
                    <dd className="max-w-[60%] text-right font-medium text-slate-700">
                      {form.specialty_ids.length > 0
                        ? form.specialty_ids
                            .map((id) => specialties.find((specialty) => specialty.id === id)?.name)
                            .filter(Boolean)
                            .join(", ")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <DoorOpen className="h-4 w-4" /> Mô tả khu khám
                    </dt>
                    <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                      {form.exam_area_description.trim() || "—"}
                    </dd>
                  </div>
                </dl>

                {form.visit_instruction.trim() && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-muted-foreground">Hướng dẫn vào khám</p>
                    <div
                      className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]"
                      dangerouslySetInnerHTML={{ __html: form.visit_instruction }}
                    />
                  </div>
                )}

                {form.description.trim() && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-muted-foreground">Mô tả</p>
                    <p className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]">{form.description.trim()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
