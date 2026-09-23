import { CalendarDays, RotateCcw, Search } from "lucide-react";
import type { PaymentGatewayFilter, PaymentListController, PaymentStatusFilter } from "../hooks/usePaymentList";

const selectClass =
  "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 xl:w-44";

/** Thanh lọc giao dịch thanh toán. */
export function PaymentFilters({ ctrl }: { ctrl: PaymentListController }) {
  const { search, setSearch, status, setStatus, gateway, setGateway, fromDate, setFromDate, toDate, setToDate, resetFilters } = ctrl;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã GD hoặc Mã lịch hẹn..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatusFilter)} className={selectClass}>
          <option value="">Trạng thái: Tất cả</option>
          <option value="PENDING">Chờ thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
        </select>

        <select value={gateway} onChange={(e) => setGateway(e.target.value as PaymentGatewayFilter)} className={selectClass}>
          <option value="">Cổng thanh toán: Tất cả</option>
          <option value="MOMO">MoMo</option>
          <option value="VCB">VietcomBank</option>
        </select>

        <div className="relative xl:w-40">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
        </div>

        <div className="relative xl:w-40">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
        </div>

        <button
          onClick={resetFilters}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
        >
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
