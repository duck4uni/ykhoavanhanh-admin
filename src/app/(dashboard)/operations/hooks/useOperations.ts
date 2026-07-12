import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useHospitalAdminStore } from "@/hooks/useHospitalAdminStore";

/** State + logic cho trang công cụ vận hành khám bệnh (dùng mock store). */
export function useOperations() {
  const toast = useToast();
  const tickets = useHospitalAdminStore((state) => state.tickets);
  const syncJobs = useHospitalAdminStore((state) => state.syncJobs);
  const clinics = useHospitalAdminStore((state) => state.clinics);
  const doctors = useHospitalAdminStore((state) => state.doctors);
  const specialties = useHospitalAdminStore((state) => state.specialties);
  const services = useHospitalAdminStore((state) => state.services);
  const syncTicketPatientCode = useHospitalAdminStore((state) => state.syncTicketPatientCode);
  const reassignTicket = useHospitalAdminStore((state) => state.reassignTicket);
  const refundTicket = useHospitalAdminStore((state) => state.refundTicket);
  const cancelTicket = useHospitalAdminStore((state) => state.cancelTicket);
  const runNightSyncNow = useHospitalAdminStore((state) => state.runNightSyncNow);

  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id ?? "");
  const [patientCode, setPatientCode] = useState("");
  const [reassignClinicId, setReassignClinicId] = useState("");
  const [reassignDoctorId, setReassignDoctorId] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [modalType, setModalType] = useState<"refund" | "cancel" | null>(null);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];

  const refundedOrCancelledTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "refunded" || ticket.status === "cancelled"),
    [tickets]
  );

  const handleSyncPatientCode = () => {
    if (!selectedTicket || !patientCode.trim()) {
      toast.warning("Thiếu dữ liệu", "Chọn phiếu và nhập mã BN cần đồng bộ.");
      return;
    }
    syncTicketPatientCode(selectedTicket.id, patientCode.trim());
    toast.success("Đồng bộ thành công", "Đã cập nhật lại mã BN từ App sang HIS.");
    setPatientCode("");
  };

  const handleReassign = () => {
    if (!selectedTicket || !reassignClinicId || !reassignDoctorId) {
      toast.warning("Thiếu dữ liệu", "Cần chọn phiếu, phòng khám và bác sĩ mới.");
      return;
    }
    reassignTicket(selectedTicket.id, reassignClinicId, reassignDoctorId);
    toast.success("Cập nhật thành công", "Đã đổi phòng khám và bác sĩ cho phiếu đã chọn.");
  };

  const submitTicketAction = () => {
    if (!selectedTicket || !modalType || !actionReason.trim()) {
      toast.warning("Thiếu dữ liệu", "Vui lòng nhập lý do xử lý phiếu.");
      return;
    }

    const result =
      modalType === "refund"
        ? refundTicket(selectedTicket.id, actionReason.trim())
        : cancelTicket(selectedTicket.id, actionReason.trim());

    if (result.ok) {
      toast.success("Thao tác thành công", result.message);
      setModalType(null);
      setActionReason("");
    } else {
      toast.error("Không thể thực hiện", result.message);
    }
  };

  function selectTicket(id: string) {
    setSelectedTicketId(id);
    setPatientCode("");
    setReassignClinicId("");
    setReassignDoctorId("");
  }

  function closeModal() {
    setModalType(null);
    setActionReason("");
  }

  function runSyncNow() {
    runNightSyncNow();
    toast.success("Đã chạy đồng bộ 23h", "Các phiếu chờ đồng bộ đã được đẩy sang trạng thái synced.");
  }

  return {
    // store data
    tickets,
    syncJobs,
    clinics,
    doctors,
    specialties,
    services,
    // selection + derived
    selectedTicketId,
    selectTicket,
    selectedTicket,
    refundedOrCancelledTickets,
    // sync/reassign inputs
    patientCode,
    setPatientCode,
    reassignClinicId,
    setReassignClinicId,
    reassignDoctorId,
    setReassignDoctorId,
    handleSyncPatientCode,
    handleReassign,
    // modal
    modalType,
    setModalType,
    actionReason,
    setActionReason,
    submitTicketAction,
    closeModal,
    // sync jobs
    runSyncNow,
  };
}

export type OperationsController = ReturnType<typeof useOperations>;
