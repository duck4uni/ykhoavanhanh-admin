export const REVIEWS_PAGE_SIZE = 10;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts[0]?.[0] ?? "";
  return (parts.length === 1 ? first : `${last}${first}`).toUpperCase().slice(0, 2);
}

/** Che số điện thoại: 0901234567 → 09xx xxx 567 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 2)}xx xxx ${digits.slice(-3)}`;
}
