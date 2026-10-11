"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FiEye, FiMoreVertical, FiRefreshCw, FiRotateCcw, FiXCircle } from "react-icons/fi";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface BookingActionsMenuProps {
  onViewDetail: () => void;
  onSyncToHis: () => void;
  syncEnabled: boolean;
  syncReason: string;
  isSyncing: boolean;
  /** Chỉ admin mới có mục hủy/hoàn tiền. */
  showCancelRefund: boolean;
  isCancelled: boolean;
  cancelEnabled: boolean;
  cancelReason: string;
  onCancelRefund: () => void;
}

const ITEM_CLASS =
  "flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-xs outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";

/** Dropdown thao tác của mỗi dòng lịch khám: Chi tiết / Đồng bộ HIS / Hủy & hoàn tiền (hoặc Hoàn tiền). */
export function BookingActionsMenu({
  onViewDetail,
  onSyncToHis,
  syncEnabled,
  syncReason,
  isSyncing,
  showCancelRefund,
  isCancelled,
  cancelEnabled,
  cancelReason,
  onCancelRefund,
}: BookingActionsMenuProps) {
  const showCancelItem = showCancelRefund && (isCancelled || cancelEnabled);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {/* Dùng <button> thuần: `Button` không forward ref nên Radix không có anchor để đặt menu. */}
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 rounded-lg px-2 text-xs")}
        >
          <FiMoreVertical className="h-3.5 w-3.5" />
          Thao tác
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[190px] rounded-xl border border-border bg-white p-1 shadow-lg"
        >
          <DropdownMenu.Item className={`${ITEM_CLASS} text-primary-600`} onSelect={onViewDetail}>
            <FiEye className="h-3.5 w-3.5" />
            Chi tiết
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={`${ITEM_CLASS} items-start`}
            disabled={!syncEnabled || isSyncing}
            onSelect={onSyncToHis}
          >
            <FiRefreshCw className={`mt-0.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>
              Đồng bộ HIS
              {!syncEnabled && <span className="mt-0.5 block max-w-[170px] text-[11px] text-muted-foreground">{syncReason}</span>}
            </span>
          </DropdownMenu.Item>

          {showCancelItem && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className={`${ITEM_CLASS} text-error data-[highlighted]:bg-error-light`}
                title={isCancelled ? "Xem / thực hiện hoàn tiền" : cancelReason}
                onSelect={onCancelRefund}
              >
                {isCancelled ? <FiRotateCcw className="h-3.5 w-3.5" /> : <FiXCircle className="h-3.5 w-3.5" />}
                {isCancelled ? "Hoàn tiền" : "Hủy & hoàn tiền"}
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
