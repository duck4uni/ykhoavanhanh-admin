"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, RefreshCw } from "lucide-react";

interface PatientRowMenuProps {
  onSyncToHis: () => void;
  isSyncing: boolean;
}

const MENU_WIDTH = 176; // w-44
const MENU_HEIGHT = 56; // 1 mục

/**
 * Dropdown thao tác thêm cho từng dòng bệnh nhân (hiện chỉ có "Đồng bộ HIS").
 * Dùng portal để tránh bị cắt bởi `overflow-x-auto` của bảng, theo pattern
 * `exam-areas/_components/RowMenu.tsx`.
 */
export function PatientRowMenu({ onSyncToHis, isSyncing }: PatientRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < MENU_HEIGHT ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4;
    const left = Math.max(8, rect.right - MENU_WIDTH);
    setCoords({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      )
        return;
      setOpen(false);
    };
    const handleClose = () => setOpen(false);
    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isSyncing}
        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Thêm thao tác"
      >
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="fixed z-50 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSyncToHis();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-primary-600" /> Đồng bộ HIS
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
