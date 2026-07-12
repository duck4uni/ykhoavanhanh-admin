import { useEffect, useRef, useState } from "react";

/** Tích lũy các trang đã tải; page===1 thì thay mới, khác thì nối thêm & khử trùng. */
export function useAccumulatedRows<T>(rows: T[], page: number, keyOf: (item: T) => string): T[] {
  const [list, setList] = useState<T[]>([]);
  const keyRef = useRef(keyOf);
  keyRef.current = keyOf;
  useEffect(() => {
    setList((current) => {
      const next = page === 1 ? rows : [...current, ...rows];
      return Array.from(new Map(next.map((item) => [keyRef.current(item), item])).values());
    });
  }, [rows, page]);
  return list;
}
