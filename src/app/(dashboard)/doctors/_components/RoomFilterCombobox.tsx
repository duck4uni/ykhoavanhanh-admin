import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { roomsHooks } from "@/api/roomsApi";

const PAGE_SIZE = 10;

type RoomFilterComboboxProps = {
  /** Tên phòng khám đang chọn, rỗng nghĩa là "Tất cả phòng khám". */
  value: string;
  onChange: (roomName: string) => void;
};

/** Dropdown lọc theo phòng khám: tìm kiếm + cuộn tải thêm 10 mục mỗi lần. */
export function RoomFilterCombobox({ value, onChange }: RoomFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<{ id: string; name: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isFetching } = roomsHooks.usePaginatedList(
    {
      currentPage: page,
      pageSize: PAGE_SIZE,
      sortField: "room_name",
      sortOrder: "ASC",
      filters: debouncedSearch ? `room_name@=${debouncedSearch}` : undefined,
    },
    { enabled: open },
  );

  useEffect(() => {
    if (!data) return;
    setAccumulated((current) => {
      const rows = data.rows.map((r) => ({ id: r.id, name: r.roomname }));
      const next = page === 1 ? rows : [...current, ...rows];
      return Array.from(new Map(next.map((item) => [item.id, item])).values());
    });
  }, [data, page]);

  const hasMore = (data?.currentPage ?? page) < (data?.totalPages ?? 1);

  const selectedRoom = useMemo(
    () => accumulated.find((r) => r.name === value),
    [accumulated, value],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-left text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
      >
        <span className={value ? "truncate text-foreground" : "truncate text-muted-foreground"}>
          {value ? selectedRoom?.name ?? value : "Tất cả phòng khám"}
        </span>
        {value ? (
          <FiX
            className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
          />
        ) : (
          <FiChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phòng khám..."
              className="h-9 w-full rounded-lg border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none focus:border-primary-500 focus:bg-white"
            />
          </div>
          <div
            className="max-h-64 overflow-y-auto py-1"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (hasMore && !isFetching && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                setPage((current) => current + 1);
              }
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${!value ? "bg-primary-100 text-primary-700" : "text-slate-700"}`}
            >
              Tất cả phòng khám
            </button>
            {accumulated.length === 0 && !isFetching ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">Không tìm thấy phòng khám phù hợp.</div>
            ) : (
              accumulated.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    onChange(room.name);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${
                    room.name === value ? "bg-primary-100 text-primary-700" : "text-slate-700"
                  }`}
                >
                  {room.name}
                </button>
              ))
            )}
            {isFetching && <div className="px-4 py-3 text-center text-sm text-muted-foreground">{page === 1 ? "Đang tải..." : "Đang tải thêm..."}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
