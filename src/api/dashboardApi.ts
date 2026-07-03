/**
 * Dashboard API - Dashboard statistics and ticket ratios
 */

import { apiGet } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalRefund: number;
  netRevenue: number;
  totalTickets: number;
  paidTickets: number;
  cancelledTickets: number;
  totalDoctors: number;
  totalContents: number;
  totalReviews: number;
  avgRating: number;
}

export interface TicketRatio {
  ticketStatus: string;
  totalCount: number;
  ratioPercent: number;
}

export interface RecentTicket {
  bookingId: string;
  facilityId: string;
  facilityName: string | null;
  hisBookingId: string | null;
  hisMavaovien: string | null;
  requestStt: string | null;
  confirmedStt: string | null;
  appointmentTime: string | null;
  localStatus: string | null;
  hisStatus: string | null;
  patientId: string | null;
  hisPatientId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  doctorCode: string | null;
  doctorName: string | null;
  roomCode: string | null;
  roomName: string | null;
  serviceCode: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  paymentAmount: number | null;
  paymentStatus: string | null;
  paidAmount: number | null;
  refundedAmount: number | null;
  netRevenue: number | null;
  createdAt: string;
}

export interface UpcomingSchedule {
  scheduleId: string;
  facilityId: string;
  facilityName: string | null;
  doctorId: string;
  doctorCode: string | null;
  doctorName: string | null;
  examAreaId: string | null;
  examAreaCode: string | null;
  examAreaName: string | null;
  examAreaShortName: string | null;
  specialtyId: string | null;
  specialtyName: string | null;
  roomId: string | null;
  roomCode: string | null;
  roomName: string | null;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  shiftCode: string | null;
  maxAppointments: number | null;
  bookedCount: number;
  availableCount: number;
  examFee: string | null;
  allowBooking: boolean;
  status: string;
  note: string | null;
  hisScheduleId: string | null;
  syncedAt: string | null;
}

/** Bộ lọc thời gian/cơ sở dùng chung cho stats & ticket-ratios. */
export interface DashboardFilter {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  facilityId?: string;
}

export interface RevenueByDay {
  date: string; // YYYY-MM-DD
  revenue: number;
}

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const dashboardKeys = {
  stats: (filter?: DashboardFilter) => ["dashboard", "stats", filter ?? {}] as const,
  ticketRatios: (filter?: DashboardFilter) => ["dashboard", "ticket-ratios", filter ?? {}] as const,
  revenueByDay: (filter?: DashboardFilter) => ["dashboard", "revenue-by-day", filter ?? {}] as const,
  recentTickets: (params?: { limit?: number; facilityId?: string }) =>
    ["dashboard", "recent-tickets", params ?? {}] as const,
  upcomingSchedules: (params?: { scheduleDate?: string; facilityId?: string }) =>
    ["dashboard", "upcoming-schedules", params ?? {}] as const,
};

// ─── Service Functions ─────────────────────────────────────────────────────

async function fetchDashboardStats(filter?: DashboardFilter): Promise<DashboardStats> {
  const res = await apiGet<DashboardStats>("/dashboard/stats", { params: filter });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Khong the lay thong ke dashboard");
}

async function fetchTicketRatios(filter?: DashboardFilter): Promise<TicketRatio[]> {
  const res = await apiGet<TicketRatio[]>("/dashboard/ticket-ratios", { params: filter });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Khong the lay ty le phieu kham");
}

async function fetchRevenueByDay(filter?: DashboardFilter): Promise<RevenueByDay[]> {
  const res = await apiGet<RevenueByDay[]>("/dashboard/revenue-by-day", { params: filter });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Khong the lay doanh thu theo ngay");
}

async function fetchRecentTickets(params?: {
  limit?: number;
  facilityId?: string;
}): Promise<RecentTicket[]> {
  const res = await apiGet<RecentTicket[]>("/dashboard/recent-tickets", { params });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Khong the lay danh sach phieu gan day");
}

async function fetchUpcomingSchedules(params?: {
  scheduleDate?: string;
  facilityId?: string;
}): Promise<UpcomingSchedule[]> {
  const res = await apiGet<UpcomingSchedule[]>("/dashboard/upcoming-schedules", { params });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Khong the lay lich kham sap toi");
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useDashboardStats(filter?: DashboardFilter) {
  return useQuery({
    queryKey: dashboardKeys.stats(filter),
    queryFn: () => fetchDashboardStats(filter),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTicketRatios(filter?: DashboardFilter) {
  return useQuery({
    queryKey: dashboardKeys.ticketRatios(filter),
    queryFn: () => fetchTicketRatios(filter),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRevenueByDay(filter?: DashboardFilter) {
  return useQuery({
    queryKey: dashboardKeys.revenueByDay(filter),
    queryFn: () => fetchRevenueByDay(filter),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecentTickets(params?: { limit?: number; facilityId?: string }) {
  return useQuery({
    queryKey: dashboardKeys.recentTickets(params),
    queryFn: () => fetchRecentTickets(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpcomingSchedules(params?: { scheduleDate?: string; facilityId?: string }) {
  return useQuery({
    queryKey: dashboardKeys.upcomingSchedules(params),
    queryFn: () => fetchUpcomingSchedules(params),
    staleTime: 1000 * 60 * 2,
  });
}