import { CalendarDays, RotateCcw, Search } from "lucide-react";
import type {
  PaymentGatewayFilter,
  PaymentListController,
  PaymentReconcileFilter,
  PaymentStatusFilter,
} from "../hooks/usePaymentList";

const selectClass =
  "h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 xl:w-44";

/** Thanh lọc giao dịch thanh toán. */
export function PaymentFilters({ ctrl }: { ctrl: PaymentListController }) {
  const { search, setSearch, status, setStatus, gateway, setGateway, reconcile, setReconcile, fromDate, setFromDate, toDate, setToDate, resetFilters } = ctrl;

  const impliesStatus = reconcile === "RECONCILED" || reconcile === "UNRECONCILED";

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

        {/* "Đã đối soát" = đã thanh toán, "Chưa đối soát" = chờ thanh toán, nên 2 nhãn
            này đã khoá sẵn trạng thái. Để người dùng chọn tiếp sẽ cho ra giao kèo mâu
            thuẫn (vd Đã thanh toán + Chưa đối soát) và danh sách rỗng không rõ lý do. */}
        <select
          value={impliesStatus ? "" : status}
          onChange={(e) => setStatus(e.target.value as PaymentStatusFilter)}
          disabled={impliesStatus}
          title={impliesStatus ? "Bộ lọc đối soát đang quy định trạng thái thanh toán" : undefined}
          className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <option value="">Trạng thái: Tất cả</option>
          <option value="PENDING">Chờ thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
        </select>

        <select value={gateway} onChange={(e) => setGateway(e.target.value as PaymentGatewayFilter)} className={selectClass}>
          <option value="">Cổng thanh toán: Tất cả</option>
          <option value="MOMO">MoMo</option>
          <option value="VCB">VietcomBank</option>
        </select>

        {/* Lọc thật ở BE (nhãn đối soát không phải một cột trong DB nên BE dịch
            thành điều kiện truy vấn) — nhờ vậy `count` và phân trang vẫn đúng. */}
        <select
          value={reconcile}
          onChange={(e) => setReconcile(e.target.value as PaymentReconcileFilter)}
          className={selectClass}
        >
          <option value="">Đối soát: Tất cả</option>
          <option value="RECONCILED">Đã đối soát</option>
          <option value="UNRECONCILED">Chưa đối soát</option>
          <option value="REFUND_PENDING">Đang xử lý hoàn tiền</option>
          <option value="REFUNDED">Đã hoàn tiền</option>
          <option value="REFUND_FAILED">Hoàn tiền thất bại</option>
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
