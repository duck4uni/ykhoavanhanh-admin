"use client";

import { Button } from "@/components/ui/Button";
import { LoadingSection } from "@/components/ui/Spinner";
import { usePatientDetail } from "./hooks/usePatientDetail";
import { PatientHeader } from "./_components/PatientHeader";
import { PatientTabs } from "./_components/PatientTabs";
import { OverviewTab } from "./_components/OverviewTab";
import {
  AppointmentsTab,
  FamilyTab,
  LogsTab,
  PaymentsTab,
  RecordsTab,
  ReviewsTab,
} from "./_components/DetailTabs";

export default function PatientDetailPage() {
  const ctrl = usePatientDetail();
  const { patient, isLoading, activeTab } = ctrl;

  if (isLoading) return <LoadingSection text="Đang tải thông tin bệnh nhân..." />;

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Không tìm thấy bệnh nhân.</p>
        <Button variant="outline" className="mt-4" onClick={() => ctrl.router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PatientHeader
        patient={patient}
        patientId={ctrl.patientId}
        bookingsCount={ctrl.bookingsCount}
        onBack={() => ctrl.router.back()}
      />

      <PatientTabs activeTab={activeTab} onChange={ctrl.setActiveTab} />

      {activeTab === "overview" ? (
        <OverviewTab
          patient={patient}
          records={ctrl.records}
          recordsLoading={ctrl.recordsLoading}
          bookingsCount={ctrl.bookingsCount}
          latestBooking={ctrl.latestBooking}
          totalPaid={ctrl.totalPaid}
          latestReview={ctrl.latestReview}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          {activeTab === "appointments" && (
            <AppointmentsTab
              bookings={ctrl.bookings}
              bookingsLoading={ctrl.bookingsLoading}
              bookingsCount={ctrl.bookingsCount}
            />
          )}
          {activeTab === "records" && (
            <RecordsTab
              records={ctrl.records}
              recordsLoading={ctrl.recordsLoading}
              recordsCount={ctrl.recordsCount}
            />
          )}
          {activeTab === "payments" && (
            <PaymentsTab records={ctrl.records} recordsLoading={ctrl.recordsLoading} />
          )}
          {activeTab === "reviews" && <ReviewsTab latestReview={ctrl.latestReview} />}
          {activeTab === "family" && <FamilyTab />}
          {activeTab === "logs" && <LogsTab patient={patient} />}
        </div>
      )}
    </div>
  );
}
