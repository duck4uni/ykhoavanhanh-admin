import { useEffect, useState } from "react";
import { hisServicesHooks, type HisService } from "@/api/hisServicesApi";
import { useDebounce } from "@/hooks/useApiHelpers";
import { SERVICE_PAGE_SIZE } from "../types";

/**
 * Quản lý ô tìm kiếm + danh sách dịch vụ có infinite scroll (dùng cho trang
 * thêm phòng khám).
 */
export function useServicePicker() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [services, setServices] = useState<HisService[]>([]);
  const debouncedSearch = useDebounce(search, 400);

  const filters = debouncedSearch.trim() ? `service_name@=${debouncedSearch.trim()}` : undefined;
  const { data, isFetching } = hisServicesHooks.usePaginatedList({
    currentPage: page,
    pageSize: SERVICE_PAGE_SIZE,
    filters,
  });
  const hasMore = page < (data?.totalPages ?? 1);

  useEffect(() => {
    setPage(1);
    setServices([]);
  }, [debouncedSearch]);

  useEffect(() => {
    const rows = data?.rows ?? [];
    setServices((current) => {
      const next = page === 1 ? [] : [...current];
      for (const service of rows) {
        if (!next.some((item) => item.id === service.id)) next.push(service);
      }
      return next;
    });
  }, [page, data]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 48 && hasMore && !isFetching) {
      setPage((current) => current + 1);
    }
  }

  return { search, setSearch, services, isFetching, handleScroll };
}
