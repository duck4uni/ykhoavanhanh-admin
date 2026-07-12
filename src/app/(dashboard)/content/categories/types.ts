import type { PostCategory } from "@/api/postCategoriesApi";

export const CATEGORY_PAGE_SIZE = 10;

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
};

export const EMPTY_CATEGORY_FORM: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  parent_id: "",
  sort_order: 0,
  is_active: true,
};

export type SortOrder = "asc" | "desc";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Số bài viết của danh mục — đọc mềm nếu backend có trả field. */
export function getPostCount(category: PostCategory): number | null {
  const record = category as unknown as Record<string, unknown>;
  const value = record.post_count ?? record.posts_count ?? record.postCount ?? record.total_posts;
  return typeof value === "number" ? value : null;
}

export function mapCategoryToForm(category: PostCategory): CategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parent_id: category.parent_id ?? "",
    sort_order: category.sort_order ?? 0,
    is_active: category.is_active ?? true,
  };
}

export function categoryFormToPayload(form: CategoryFormValues) {
  return {
    ...form,
    slug: form.slug.trim() || slugify(form.name),
    parent_id: form.parent_id || undefined,
    sort_order: Number(form.sort_order) || 0,
  };
}
