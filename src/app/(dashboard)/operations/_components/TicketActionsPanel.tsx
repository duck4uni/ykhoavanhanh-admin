import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  getClinicName,
  getDoctorName,
  getServiceName,
  getSpecialtyName,
  getSyncVariant,
  getTicketStatusVariant,
  ticketStatusLabels,
} from "@/lib/hospital-admin";
import type { OperationsController } from "../hooks/useOperations";

/** Card trái: chọn phiếu + chi tiết + đồng bộ mã BN / đổi phòng-bác sĩ / hoàn-hủy. */
export function TicketActionsPanel({ ctrl }: { ctrl: OperationsController }) {
  const {
    tickets, clinics, doctors, specialties, services,
    selectedTicketId, selectTicket, selectedTicket,
    patientCode, setPatientCode, reassignClinicId, setReassignClinicId, reassignDoctorId, setReassignDoctorId,
    handleSyncPatientCode, handleReassign, setModalType,
  } = ctrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phiếu khám và thao tác admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          label="Chọn phiếu khám"
          value={selectedTicketId}
          onChange={(event) => selectTicket(event.target.value)}
          options={tickets.map((ticket) => ({
            value: ticket.id,
            label: `${ticket.ticket_number} - ${ticket.patient_name}`,
          }))}
        />

        {selectedTicket && (
          <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Bệnh nhân:</span> {selectedTicket.patient_name}</p>
              <p><span className="font-medium">Mã BN:</span> {selectedTicket.patient_code}</p>
              <p><span className="font-medium">Mã App:</span> {selectedTicket.app_patient_code}</p>
              <p><span className="font-medium">Chuyên khoa:</span> {getSpecialtyName(specialties, selectedTicket.specialty_id)}</p>
              <p><span className="font-medium">Phòng khám:</span> {getClinicName(clinics, selectedTicket.clinic_id)}</p>
              <p><span className="font-medium">Bác sĩ:</span> {getDoctorName(doctors, selectedTicket.doctor_id)}</p>
              <p><span className="font-medium">Dịch vụ:</span> {getServiceName(services, selectedTicket.service_id)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={getTicketStatusVariant(selectedTicket.status)}>
                  {ticketStatusLabels[selectedTicket.status]}
                </Badge>
                <Badge variant={getSyncVariant(selectedTicket)}>
                  HIS: {selectedTicket.his_sync_status}
                </Badge>
              </div>
              <p><span className="font-medium">Ngày khám:</span> {selectedTicket.exam_date}</p>
              <p><span className="font-medium">Nhóm đặt khám:</span> {selectedTicket.booking_group}</p>
              <p><span className="font-medium">Nguồn:</span> {selectedTicket.source}</p>
              <p><span className="font-medium">Đăng ký nhiều phòng:</span> {selectedTicket.booked_clinic_ids.length} phòng</p>
              <p className="text-gray-500">{selectedTicket.note}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Đồng bộ lại mã BN từ App sang HIS</h3>
            <Input label="Mã BN mới" value={patientCode} onChange={(event) => setPatientCode(event.target.value)} placeholder="VD: BN000999" />
            <Button variant="primary" onClick={handleSyncPatientCode}>Cập nhật mã BN</Button>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Cập nhật lại phòng khám / bác sĩ</h3>
            <Select
              label="Phòng khám mới"
              value={reassignClinicId}
              onChange={(event) => setReassignClinicId(event.target.value)}
              options={clinics.map((clinic) => ({ value: clinic.id, label: clinic.name }))}
              placeholder="Chọn phòng khám"
            />
            <Select
              label="Bác sĩ mới"
              value={reassignDoctorId}
              onChange={(event) => setReassignDoctorId(event.target.value)}
              options={doctors.map((doctor) => ({ value: doctor.id, label: doctor.name }))}
              placeholder="Chọn bác sĩ"
            />
            <Button variant="primary" onClick={handleReassign}>Cập nhật đăng ký</Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Hoàn / hủy phiếu</h3>
          <p className="text-sm text-gray-500">
            Hệ thống sẽ chặn nếu đây là phòng khám đầu của trường hợp đăng ký 2 phòng khám để tránh sai logic khuyến mãi giảm 50%.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setModalType("cancel")}>Hủy phiếu</Button>
            <Button variant="danger" onClick={() => setModalType("refund")}>Hoàn phiếu</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
