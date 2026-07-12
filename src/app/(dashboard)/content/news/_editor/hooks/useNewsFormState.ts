import { useState } from "react";
import { postCategoriesHooks } from "@/api/postCategoriesApi";
import { createInitialNewsForm, type NewsForm } from "../types";

/** State dùng chung cho trang tạo & sửa tin tức (form + thumbnail + trạng thái upload). */
export function useNewsFormState() {
  const [form, setForm] = useState<NewsForm>(createInitialNewsForm);
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditorUploading, setIsEditorUploading] = useState(false);

  const { data: categoriesData } = postCategoriesHooks.useList({ currentPage: 1, pageSize: 100 } as Record<string, unknown>);
  const categoryOptions = (categoriesData?.rows ?? [])
    .filter((c) => c.is_active)
    .map((c) => ({ value: c.id, label: c.name }));

  return {
    form,
    setForm,
    pendingThumbnail,
    setPendingThumbnail,
    isUploading,
    setIsUploading,
    isEditorUploading,
    setIsEditorUploading,
    categoryOptions,
  };
}
