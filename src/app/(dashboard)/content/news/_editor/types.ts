export type NewsStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";

export type NewsForm = {
  name: string;
  description: string;
  content: string;
  thumbnail_path: string;
  category_id: string;
  slug: string;
  status: NewsStatus;
  is_featured: boolean;
};

export const createInitialNewsForm = (): NewsForm => ({
  name: "",
  description: "",
  content: "",
  thumbnail_path: "",
  category_id: "",
  slug: "",
  status: "DRAFT",
  is_featured: false,
});

export const NEWS_STATUS_KEYS: NewsStatus[] = ["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
