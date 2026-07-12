import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DoorOpen, Eye, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import type { ExamArea } from "@/api/examAreasApi";

interface RowMenuProps {
  item: ExamArea;
  onView: () => void;
  onEdit: () => void;
  onViewRooms: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 176; // w-44
const MENU_HEIGHT = 232; // ước lượng chiều cao menu

export function RowMenu({ item, onView, onEdit, onViewRooms, onToggle, onDelete }: RowMenuProps) {
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
    <div className="flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
        aria-label="Thao tác"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="fixed z-50 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
          >
            <button onClick={() => { setOpen(false); onView(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Eye className="h-4 w-4" /> Chi tiết
            </button>
            <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Pencil className="h-4 w-4" /> Chỉnh sửa
            </button>
            <button onClick={() => { setOpen(false); onViewRooms(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <DoorOpen className="h-4 w-4" /> Xem phòng khám
            </button>
            <button onClick={() => { setOpen(false); onToggle(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Power className="h-4 w-4" /> {item.status === "ACTIVE" ? "Tạm tắt" : "Kích hoạt"}
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Xóa
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
