"use client";

import { useState } from "react";
import { useBookingList } from "./hooks/useBookingList";
import { BookingFiltersBar } from "./_components/BookingFiltersBar";
import { BookingTable } from "./_components/BookingTable";
import { BookingDetailModal } from "./_components/BookingDetailModal";
import type { AppointmentBooking } from "@/api/appointmentBookingsApi";

export default function PatientAppointmentBookingsPage() {
  const ctrl = useBookingList();
  const [selectedBooking, setSelectedBooking] = useState<AppointmentBooking | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Danh sách lịch khám</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý lịch đặt khám của bệnh nhân</p>
      </div>

      <BookingFiltersBar ctrl={ctrl} />
      <BookingTable ctrl={ctrl} onViewDetail={setSelectedBooking} />

      <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}
