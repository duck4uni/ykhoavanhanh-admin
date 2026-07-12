import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetPatientById } from "@/api/patientApi";
import { medicalRecordsHooks } from "@/api/medicalRecordsApi";
import { appointmentReviewsHooks } from "@/api/appointmentReviewsApi";
import { appointmentBookingsHooks } from "@/api/appointmentBookingsApi";
import { toNumber, type TabKey } from "../types";

/** Toàn bộ dữ liệu + state cho trang chi tiết bệnh nhân. */
export function usePatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: patient, isLoading } = useGetPatientById(patientId);

  const appointmentBookingParams = useMemo(
    () => ({
      patient_id: patient?.id ?? patientId,
      currentPage: 1,
      pageSize: 10,
      sortField: "appointment_time",
      sortOrder: "DESC" as const,
    }),
    [patient?.id, patientId],
  );
  const { data: bookingsData, isLoading: bookingsLoading } =
    appointmentBookingsHooks.useList(appointmentBookingParams, {
      enabled: Boolean(patient?.id ?? patientId),
    });
  const { data: recordsData, isLoading: recordsLoading } =
    medicalRecordsHooks.useList(
      {
        patient_id: patientId,
        currentPage: 1,
        pageSize: 5,
        sortField: "examined_at",
        sortOrder: "DESC",
      },
      { enabled: Boolean(patientId) },
    );
  const { data: reviewsData } = appointmentReviewsHooks.useList(
    {
      patient_id: patientId,
      currentPage: 1,
      pageSize: 1,
      sortField: "created_at",
      sortOrder: "DESC",
    },
    { enabled: Boolean(patientId) },
  );

  const bookings = useMemo(() => bookingsData?.rows ?? [], [bookingsData]);
  const records = useMemo(() => recordsData?.rows ?? [], [recordsData]);
  const totalPaid = records.reduce(
    (sum, r) => sum + toNumber(r.paid_amount || r.total_amount),
    0,
  );

  return {
    patientId,
    router,
    activeTab,
    setActiveTab,
    patient,
    isLoading,
    bookings,
    bookingsLoading,
    bookingsCount: bookingsData?.count ?? 0,
    records,
    recordsLoading,
    recordsCount: recordsData?.count ?? 0,
    latestBooking: bookings[0],
    latestReview: reviewsData?.rows?.[0],
    totalPaid,
  };
}

export type PatientDetailController = ReturnType<typeof usePatientDetail>;
export type BookingRow = PatientDetailController["bookings"][number];
export type RecordRow = PatientDetailController["records"][number];
export type ReviewRow = NonNullable<PatientDetailController["latestReview"]>;
