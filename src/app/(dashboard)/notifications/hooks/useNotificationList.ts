import { useMemo, useState } from "react";
import { notificationsHooks, type NotificationCategory } from "@/api/notificationsApi";
import { NOTIFICATIONS_PAGE_SIZE } from "../helpers";

/** State + dữ liệu cho trang danh sách thông báo. */
export function useNotificationList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"ALL" | NotificationCategory>("ALL");
  const [filterRead, setFilterRead] = useState<"ALL" | "READ" | "UNREAD">("ALL");

  const params = useMemo(() => {
    const p: Record<string, unknown> = { currentPage: page, pageSize: NOTIFICATIONS_PAGE_SIZE };
    if (filterCategory !== "ALL") p.filters = JSON.stringify({ category: filterCategory });
    return p;
  }, [page, filterCategory]);

  const { data, isFetching } = notificationsHooks.useList(params);
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const unreadCount = rows.filter((r) => !r.has_user_read).length;

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q));
    }
    if (filterRead === "READ") result = result.filter((r) => r.has_user_read);
    if (filterRead === "UNREAD") result = result.filter((r) => !r.has_user_read);
    return result;
  }, [rows, search, filterRead]);

  const markAllMutation = notificationsHooks.useMarkAsReadAll({
    onSuccess: () => {
      // toast nếu có toast hook
    },
  });
  const markOneMutation = notificationsHooks.useMarkAsReadById();

  const activeFilterCount = (filterCategory !== "ALL" ? 1 : 0) + (filterRead !== "ALL" ? 1 : 0);

  function clearFilters() {
    setFilterCategory("ALL");
    setFilterRead("ALL");
    setPage(1);
  }

  return {
    page,
    setPage,
    total,
    totalPages,
    isFetching,
    rows,
    filteredRows,
    unreadCount,
    // filters
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    filterRead,
    setFilterRead,
    activeFilterCount,
    clearFilters,
    // mutations
    markAllMutation,
    markOneMutation,
  };
}

export type NotificationListController = ReturnType<typeof useNotificationList>;
