"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AsyncSearchOption {
  id: string;
  name: string;
}

export interface AsyncSearchFetchResult {
  items: AsyncSearchOption[];
  hasMore: boolean;
}

export interface AsyncSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Nhãn hiển thị khi chưa chọn gì, đồng thời là label cho lựa chọn "Tất cả". */
  placeholder: string;
  searchPlaceholder?: string;
  /** Nhãn của item đang chọn, dùng khi item đó chưa nằm trong trang dữ liệu đã tải. */
  selectedLabel?: string;
  className?: string;
  disabled?: boolean;
  /** Số item tải mỗi trang (mặc định 15, trong khoảng 10-20 theo yêu cầu UX). */
  pageSize?: number;
  fetchPage: (params: { search: string; page: number; pageSize: number }) => Promise<AsyncSearchFetchResult>;
}

/**
 * Dropdown filter có ô tìm kiếm bên trong + cuộn để tải thêm (infinite scroll).
 * Chỉ tải 10-20 item/lần thay vì tải hết danh sách, tránh nặng khi dữ liệu lớn.
 */
export function AsyncSearchSelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Tìm kiếm...",
  selectedLabel,
  className,
  disabled,
  pageSize = 15,
  fetchPage,
}: AsyncSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [items, setItems] = React.useState<AsyncSearchOption[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const requestIdRef = React.useRef(0);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Debounce ô tìm kiếm bên trong dropdown.
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Tải trang đầu tiên mỗi khi mở dropdown hoặc từ khóa tìm kiếm thay đổi.
  React.useEffect(() => {
    if (!open) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setHasMore(true);
    fetchPage({ search: debouncedSearch, page: 1, pageSize })
      .then((res) => {
        if (reqId !== requestIdRef.current) return;
        setItems(res.items);
        setHasMore(res.hasMore);
        setPage(1);
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (reqId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [open, debouncedSearch, pageSize, fetchPage]);

  // Reset ô tìm kiếm khi đóng dropdown.
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  const loadMore = React.useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const reqId = requestIdRef.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchPage({ search: debouncedSearch, page: nextPage, pageSize })
      .then((res) => {
        if (reqId !== requestIdRef.current) return;
        setItems((prev) => [...prev, ...res.items]);
        setHasMore(res.hasMore);
        setPage(nextPage);
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setHasMore(false);
      })
      .finally(() => {
        if (reqId !== requestIdRef.current) return;
        setLoadingMore(false);
      });
  }, [loading, loadingMore, hasMore, page, debouncedSearch, pageSize, fetchPage]);

  // Cuộn tới cuối danh sách → tự động tải thêm trang tiếp theo.
  React.useEffect(() => {
    if (!open) return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "80px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length, hasMore]);

  const selectedItem = items.find((item) => item.id === value);
  const triggerLabel = value ? selectedItem?.name ?? selectedLabel ?? placeholder : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10",
              !value && "text-slate-500",
              value && "pr-8",
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">{triggerLabel}</span>
            <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          </button>
        </Popover.Trigger>

        {value && !disabled && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            className="absolute right-7 top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Xóa lựa chọn"
            title="Xóa lựa chọn"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-[0_14px_36px_-12px_rgba(15,23,42,0.28)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-surface-secondary pl-8 pr-2 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/10"
            />
          </div>

          <div ref={listRef} className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                !value && "bg-primary-50 font-medium text-primary-700",
              )}
            >
              {placeholder}
            </button>

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                  value === item.id && "bg-primary-50 font-medium text-primary-700",
                )}
              >
                <span className="truncate">{item.name}</span>
              </button>
            ))}

            {!loading && items.length === 0 && (
              <p className="px-2.5 py-4 text-center text-sm text-slate-400">Không tìm thấy kết quả</p>
            )}

            {(loading || loadingMore) && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Đang tải...
              </div>
            )}

            <div ref={sentinelRef} className="h-px" />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
