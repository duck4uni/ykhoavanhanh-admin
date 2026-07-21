import { Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PaginatedCombobox } from "./PaginatedCombobox";
import { formatServiceOptionLabel, scopeControlClass, type ScopeRow } from "../types";
import type { ScheduleEditorController } from "../hooks/useNewScheduleForm";

/** Field dạng label-trái / input-phải cho modal phạm vi. */
function ScopeField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[132px_1fr] items-center gap-3">
      <label className="text-sm font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

/** Modal thêm/sửa phạm vi khám. */
export function ScopeModal({ ctrl }: { ctrl: ScheduleEditorController }) {
  const {
    scopeModalOpen,
    setScopeModalOpen,
    editingScopeId,
    scopeDraft,
    setScopeDraft,
    saveScope,
    specialtyPicker,
    areaPicker,
    roomPicker,
    servicePicker,
    draftRoomOptions,
    draftServiceOptions,
    specialtyName,
    areaName,
    roomName,
    serviceOptionLabel,
    rememberLabel,
    onDraftServiceChange,
  } = ctrl;

  return (
    <Modal
      isOpen={scopeModalOpen}
      onClose={() => setScopeModalOpen(false)}
      title={editingScopeId ? "Sửa phạm vi khám" : "Thêm phạm vi khám"}
      size="xl"
      minHeightClassName="min-h-[640px]"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setScopeModalOpen(false)}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={saveScope}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {editingScopeId ? "Lưu thay đổi" : "Thêm phạm vi"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <ScopeField label="Khu vực / phòng" required>
          <div className="grid grid-cols-2 gap-2">
            <PaginatedCombobox
              value={scopeDraft.area_id}
              selectedLabel={scopeDraft.area_id ? areaName(scopeDraft.area_id) : undefined}
              options={areaPicker.rows.map((a) => ({ value: a.id, label: a.name }))}
              search={areaPicker.search}
              isLoading={areaPicker.isFetching}
              hasMore={areaPicker.hasMore}
              placeholder="Chọn khu vực"
              searchPlaceholder="Tìm khu vực..."
              onSearchChange={areaPicker.setSearch}
              onLoadMore={areaPicker.loadMore}
              onChange={(value) => {
                const item = areaPicker.rows.find((a) => a.id === value);
                rememberLabel(value, item?.name ?? "");
                setScopeDraft((p) => ({ ...p, area_id: value, room_id: "" }));
              }}
              onClear={() => setScopeDraft((p) => ({ ...p, area_id: "", room_id: "" }))}
            />
            <PaginatedCombobox
              value={scopeDraft.room_id}
              selectedLabel={scopeDraft.room_id ? roomName(scopeDraft.room_id) : undefined}
              options={draftRoomOptions.map((r) => ({ value: r.id, label: r.roomname }))}
              search={roomPicker.search}
              isLoading={roomPicker.isFetching}
              hasMore={roomPicker.hasMore}
              placeholder="Chọn phòng"
              searchPlaceholder="Tìm phòng..."
              onSearchChange={roomPicker.setSearch}
              onLoadMore={roomPicker.loadMore}
              onChange={(value) => {
                const item = draftRoomOptions.find((r) => r.id === value);
                rememberLabel(value, item?.roomname ?? "");
                setScopeDraft((p) => ({ ...p, room_id: value }));
              }}
              onClear={() => setScopeDraft((p) => ({ ...p, room_id: "" }))}
            />
          </div>
        </ScopeField>

        <ScopeField label="Chuyên khoa" required>
          <PaginatedCombobox
            value={scopeDraft.specialty_id}
            selectedLabel={scopeDraft.specialty_id ? specialtyName(scopeDraft.specialty_id) : undefined}
            options={specialtyPicker.rows.map((s) => ({ value: s.id, label: s.name }))}
            search={specialtyPicker.search}
            isLoading={specialtyPicker.isFetching}
            hasMore={specialtyPicker.hasMore}
            placeholder="Chọn chuyên khoa"
            searchPlaceholder="Tìm chuyên khoa..."
            onSearchChange={specialtyPicker.setSearch}
            onLoadMore={specialtyPicker.loadMore}
            onChange={(value) => {
              const item = specialtyPicker.rows.find((s) => s.id === value);
              rememberLabel(value, item?.name ?? "");
              setScopeDraft((p) => ({ ...p, specialty_id: value, service_id: "" }));
            }}
            onClear={() => setScopeDraft((p) => ({ ...p, specialty_id: "", service_id: "" }))}
          />
        </ScopeField>

        <ScopeField label="Dịch vụ khám" required>
          <PaginatedCombobox
            value={scopeDraft.service_id}
            selectedLabel={scopeDraft.service_id ? serviceOptionLabel(scopeDraft.service_id) : undefined}
            options={draftServiceOptions.map((s) => ({ value: s.id, label: formatServiceOptionLabel(s) }))}
            search={servicePicker.search}
            isLoading={servicePicker.isFetching}
            hasMore={servicePicker.hasMore}
            placeholder="Chọn dịch vụ khám"
            searchPlaceholder="Tìm dịch vụ khám..."
            onSearchChange={servicePicker.setSearch}
            onLoadMore={servicePicker.loadMore}
            onChange={(value) => {
              const item = draftServiceOptions.find((s) => s.id === value);
              rememberLabel(value, item?.servicename ?? "");
              onDraftServiceChange(value);
            }}
            onClear={() => onDraftServiceChange("")}
          />
        </ScopeField>

        {/* <ScopeField label="Phí khám (VND)" required>
          <div className="flex h-10 items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
            <input
              type="number"
              min={0}
              value={scopeDraft.fee}
              onChange={(e) => setScopeDraft((p) => ({ ...p, fee: Number(e.target.value) || 0 }))}
              placeholder="Nhập phí khám"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            />
            <span className="flex h-full items-center border-l border-slate-200 px-3 text-xs font-medium text-slate-400">VND</span>
          </div>
        </ScopeField> */}

        <ScopeField label="Trạng thái">
          <select
            value={scopeDraft.status}
            onChange={(e) => setScopeDraft((p) => ({ ...p, status: e.target.value as ScopeRow["status"] }))}
            className={scopeControlClass}
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm tắt</option>
          </select>
        </ScopeField>

        <ScopeField label="Ghi chú">
          <input
            value={scopeDraft.note}
            onChange={(e) => setScopeDraft((p) => ({ ...p, note: e.target.value }))}
            placeholder="Nhập ghi chú (không bắt buộc)"
            className={scopeControlClass}
          />
        </ScopeField>

        <div className="flex items-start gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2.5 text-xs text-primary-700">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
          <span>Mỗi phạm vi khám xác định chuyên khoa, khu vực/phòng và dịch vụ bác sĩ được phép khám trong lịch này.</span>
        </div>
      </div>
    </Modal>
  );
}
