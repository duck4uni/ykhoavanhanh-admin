import { ScheduleEditorPage } from "../../new/_components/ScheduleEditorPage";

export default function EditAppointmentSchedulePage({ params }: { params: { appointmentId: string } }) {
  return <ScheduleEditorPage mode="edit" scheduleId={params.appointmentId} />;
}
