import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { PickerOption } from "../types";

type PaginatedComboboxProps = {
  value: string;
  selectedLabel?: string;
  options: PickerOption[];
  search: string;
  isLoading: boolean;
  hasMore: boolean;
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
};

/** Combobox phân trang có search + scroll load-more (dùng chung). */
export function PaginatedCombobox({
  value,
  selectedLabel,
  options,
  search,
  isLoading,
  hasMore,
  placeholder,
  searchPlaceholder,
  onChange,
  onSearchChange,
  onLoadMore,
}: PaginatedComboboxProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const label = selectedLabel || options.find((o) => o.value === value)?.label || "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
      >
        <span className={label ? "truncate text-slate-800" : "text-slate-400"}>{label || placeholder}</span>
        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              autoFocus
            />
          </div>
          <div
            className="max-h-60 overflow-y-auto py-1"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (hasMore && !isLoading && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                onLoadMore();
              }
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${opt.value === value ? "bg-primary-100 text-primary-700" : "text-slate-700"}`}
              >
                {opt.label}
              </button>
            ))}
            {isLoading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải...</div>}
            {!isLoading && options.length === 0 && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Không có kết quả phù hợp.</div>}
            {!isLoading && hasMore && (
              <button type="button" onClick={onLoadMore} className="w-full px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50">
                Tải thêm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
