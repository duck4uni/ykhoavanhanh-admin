import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useApiHelpers";

/**
 * State dùng chung cho một combobox phân trang có tìm kiếm:
 * quản lý `search` (debounce 400ms), `page`, và tự reset trang khi từ khóa đổi.
 */
export function usePickerState() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => setPage(1), [debouncedSearch]);
  return {
    search,
    setSearch,
    page,
    setPage,
    debouncedSearch,
    loadMore: () => setPage((current) => current + 1),
  };
}
