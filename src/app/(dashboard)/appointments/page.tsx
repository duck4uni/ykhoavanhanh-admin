"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { doctorWorkSchedulesHooks, type DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useAppointmentScheduleList } from "./hooks/useAppointmentScheduleList";
import { AppointmentStatsCards } from "./_components/AppointmentStatsCards";
import { AppointmentFilters } from "./_components/AppointmentFilters";
import { AppointmentScheduleTable } from "./_components/AppointmentScheduleTable";
import { AppointmentScheduleModal } from "./_components/AppointmentScheduleModal";
import {
  addMinutes,
  createDefaultSlots,
  createInitialScheduleForm,
  createSlotFromForm,
  createSlotId,
  getScheduleSlots,
  mapScheduleToForm,
  scheduleFormToPayload,
  type ScheduleFormValues,
  type WorkTimeSlot,
} from "./types";

export default function AppointmentsPage() {
  const schedules = useAppointmentScheduleList();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormValues>(createInitialScheduleForm);
  const [workSlots, setWorkSlots] = useState<WorkTimeSlot[]>(createDefaultSlots);

  const updateMutation = doctorWorkSchedulesHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật lịch khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật lịch khám thất bại"),
  });

  function openEdit(item: DoctorWorkSchedule) {
    setEditingId(item.id);
    setForm(mapScheduleToForm(item));
    setWorkSlots(getScheduleSlots(item));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(createInitialScheduleForm());
    setWorkSlots(createDefaultSlots());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.doctor_id || !form.exam_area_id || !form.schedule_date) {
      toast.error("Vui lòng chọn bác sĩ, khu khám và ngày khám");
      return;
    }
    if (workSlots.length === 0) {
      toast.error("Vui lòng thêm ít nhất một khung giờ làm việc");
      return;
    }

    try {
      if (!editingId) return;
      await updateMutation.mutateAsync({ id: editingId, data: scheduleFormToPayload(form, workSlots) });
    } catch {
      // onError của mutation đã hiển thị toast.
    }
  }

  function updateSlot(id: string, patch: Partial<WorkTimeSlot>) {
    setWorkSlots((slots) => slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    setWorkSlots((slots) => {
      const start = slots[slots.length - 1]?.end ?? form.start_time;
      return [...slots, { id: createSlotId(), start, end: addMinutes(start, 30), max_appointments: form.max_appointments }];
    });
  }

  function autoGenerateSlots() {
    const slots: WorkTimeSlot[] = [];
    let cursor = form.start_time;
    while (cursor < form.end_time) {
      const end = addMinutes(cursor, 30);
      slots.push({ id: createSlotId(), start: cursor, end: end > form.end_time ? form.end_time : end, max_appointments: form.max_appointments });
      cursor = end;
    }
    setWorkSlots(slots.length > 0 ? slots : [createSlotFromForm(form)]);
  }

  function removeSlot(id: string) {
    setWorkSlots((slots) => slots.filter((slot) => slot.id !== id));
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý lịch làm việc, khung giờ và số lượng slot khám của bác sĩ.
          </p>
        </div>
        <Link
          href="/appointments/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm lịch khám
        </Link>
      </div>

      <AppointmentStatsCards stats={schedules.stats} />

      <AppointmentFilters
        search={schedules.search}
        onSearchChange={(value) => {
          schedules.setSearch(value);
          schedules.setPage(1);
        }}
        dateFilter={schedules.dateFilter}
        onDateFilterChange={(value) => {
          schedules.setDateFilter(value);
          schedules.setPage(1);
        }}
        shiftFilter={schedules.shiftFilter}
        onShiftFilterChange={(value) => {
          schedules.setShiftFilter(value);
          schedules.setPage(1);
        }}
        statusFilter={schedules.statusFilter}
        onStatusFilterChange={(value) => {
          schedules.setStatusFilter(value);
          schedules.setPage(1);
        }}
        onApply={() => schedules.setPage(1)}
        onReset={schedules.resetFilters}
      />

      <AppointmentScheduleTable
        rows={schedules.rows}
        isLoading={schedules.isLoading}
        page={schedules.page}
        totalPages={schedules.totalPages}
        filteredCount={schedules.filteredCount}
        isDeleting={schedules.isDeleting}
        onPageChange={schedules.setPage}
        onEdit={openEdit}
        onDelete={schedules.openConfirmDelete}
      />

      <AppointmentScheduleModal
        open={modalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        workSlots={workSlots}
        examAreas={schedules.examAreas}
        doctorList={schedules.doctorList}
        isLoadingDoctors={schedules.isLoadingDoctors}
        isSubmitting={updateMutation.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onUpdateSlot={updateSlot}
        onAddSlot={addSlot}
        onAutoGenerateSlots={autoGenerateSlots}
        onRemoveSlot={removeSlot}
      />

      <ConfirmDialog
        open={schedules.confirmOpen}
        onOpenChange={schedules.setConfirmOpen}
        variant="delete"
        title="Xóa lịch khám"
        description="Bạn có chắc muốn xóa lịch khám này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={schedules.isDeleting}
        onConfirm={schedules.handleConfirmDelete}
      />
    </div>
  );
}
