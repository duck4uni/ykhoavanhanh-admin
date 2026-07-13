import { CalendarDays, Search } from "lucide-react";
import type { Payment } from "@/types/payment";
import type { PaymentListController } from "../hooks/usePaymentList";

const selectClass =
  "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 xl:w-40";

/** Thanh lọc giao dịch thanh toán. */
export function PaymentFilters({ ctrl }: { ctrl: PaymentListController }) {
  const { search, setSearch, setPage, status, setStatus, method, setMethod, fromDate, setFromDate, toDate, setToDate } = ctrl;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã TT, bệnh nhân, SĐT, mã phiếu khám..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <select value={status} onChange={(e) => { setStatus(e.target.value as "all" | Payment["status"]); setPage(1); }} className={selectClass}>
          <option value="all">Trạng thái: Tất cả</option>
          <option value="paid">Đã thanh toán</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="refunded">Đã hoàn tiền</option>
          <option value="failed">Thất bại</option>
          <option value="expired">Hết hạn</option>
        </select>

        <select value={method} onChange={(e) => { setMethod(e.target.value as "all" | Payment["method"]); setPage(1); }} className={selectClass}>
          <option value="all">Phương thức: Tất cả</option>
          <option value="vcb_qr">QR VCB</option>
          <option value="vcb_transfer">Chuyển khoản VCB</option>
          <option value="vcb_card">Thẻ VCB</option>
          <option value="cash">Tiền mặt</option>
        </select>

        <div className="relative xl:w-40">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
        </div>

        <div className="relative xl:w-40">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
        </div>

        {/* <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50">
          <SlidersHorizontal className="h-4 w-4" /> Bộ lọc nâng cao
        </button> */}
      </div>
    </div>
  );
}
