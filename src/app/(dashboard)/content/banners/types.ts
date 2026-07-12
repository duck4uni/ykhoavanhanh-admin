export const BANNER_PAGE_SIZE = 10;

export type BannerFormValues = {
  name: string;
  code: string;
  content: string; // Đường dẫn ảnh banner trả về từ API upload file (/images/...)
};

export const EMPTY_BANNER_FORM: BannerFormValues = {
  name: "",
  code: "",
  content: "",
};

export function slugifyCode(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function isImagePath(path: string | null): path is string {
  return !!path && path.trim().length > 0;
}

export function getImageSrc(path: string | null): string | null {
  if (!isImagePath(path)) return null;
  const value = path.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${value.startsWith("/") ? value : `/${value}`}`;
}

export function bannerFormToPayload(form: BannerFormValues) {
  return {
    name: form.name.trim(),
    code: form.code.trim() || slugifyCode(form.name),
    content: form.content.trim() || undefined,
  };
}
