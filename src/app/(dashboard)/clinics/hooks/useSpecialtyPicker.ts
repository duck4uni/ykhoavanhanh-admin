import { useEffect, useState } from "react";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { useDebounce } from "@/hooks/useApiHelpers";
import { SPECIALTY_PAGE_SIZE } from "../types";

interface UseSpecialtyPickerOptions {
  /**
   * Danh sách chuyên khoa đã gán sẵn (dùng cho trang chỉnh sửa) để hiển thị/tick
   * ngay cả khi chưa xuất hiện trong trang tải đầu tiên. Cần giữ ổn định
   * (memo hoá ở caller) để tránh seed lặp.
   */
  initialSelected?: AdminSpecialty[];
  /** Các id đang được chọn — giữ lại chuyên khoa đã chọn khi tải lại trang 1. */
  selectedIds: string[];
}

/**
 * Quản lý ô tìm kiếm + danh sách chuyên khoa có infinite scroll, dùng chung cho
 * trang thêm và chỉnh sửa phòng khám.
 */
export function useSpecialtyPicker({ initialSelected, selectedIds }: UseSpecialtyPickerOptions) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [specialties, setSpecialties] = useState<AdminSpecialty[]>(initialSelected ?? []);
  const debouncedSearch = useDebounce(search, 400);

  const filters = debouncedSearch.trim() ? `name@=${debouncedSearch.trim()}` : undefined;
  const { data, isFetching } = specialtiesHooks.useList({
    currentPage: page,
    pageSize: SPECIALTY_PAGE_SIZE,
    filters,
  });
  const hasMore = page < (data?.totalPages ?? 1);

  // Seed các chuyên khoa đã gán (chạy khi initialSelected thay đổi, vd sau khi
  // detail phòng khám tải xong).
  useEffect(() => {
    if (!initialSelected || initialSelected.length === 0) return;
    setSpecialties((current) => {
      const next = [...current];
      for (const specialty of initialSelected) {
        if (!next.some((item) => item.id === specialty.id)) next.push(specialty);
      }
      return next;
    });
  }, [initialSelected]);

  // Reset về trang 1 khi từ khoá tìm kiếm đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Gộp dữ liệu trang mới; ở trang 1 giữ lại các chuyên khoa đang được chọn mà
  // trang hiện tại không trả về (để không mất tick).
  useEffect(() => {
    const rows = data?.rows ?? [];
    setSpecialties((current) => {
      const next =
        page === 1
          ? current.filter(
              (item) => selectedIds.includes(item.id) && !rows.some((row) => row.id === item.id)
            )
          : [...current];
      for (const specialty of rows) {
        if (!next.some((item) => item.id === specialty.id)) next.push(specialty);
      }
      return next;
    });
  }, [page, data, selectedIds]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 48 && hasMore && !isFetching) {
      setPage((current) => current + 1);
    }
  }

  return { search, setSearch, specialties, isFetching, handleScroll };
}
