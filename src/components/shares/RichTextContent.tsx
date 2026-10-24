"use client";

import { useEffect, useMemo, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

type RichTextContentProps = {
  html: string | null | undefined;
  className?: string;
};

/**
 * Hiển thị HTML do trình soạn thảo sinh ra (mô tả bác sĩ, hướng dẫn vào khám...) sau khi đã
 * làm sạch. Dùng component này thay cho `dangerouslySetInnerHTML` trực tiếp — nội dung đến từ
 * API nên người sửa bản ghi có thể chèn script chạy trong phiên của người khác (stored XSS).
 *
 * Chỉ render sau khi mount: `sanitizeHtml` dùng DOMParser ở client và nhánh regex thắt chặt hơn
 * ở server, hai kết quả có thể khác nhau -> render thẳng ở server sẽ gây lệch hydration. Khối
 * này là xem trước trong form (không cần SEO, không cần có sẵn trong HTML đầu tiên) nên chờ
 * mount là đánh đổi đúng.
 */
export function RichTextContent({ html, className }: RichTextContentProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const safeHtml = useMemo(() => (mounted ? sanitizeHtml(html) : ""), [mounted, html]);

  if (!mounted) return <div className={className} />;
  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
