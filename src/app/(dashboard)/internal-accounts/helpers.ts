export const INTERNAL_ACCOUNTS_PAGE_SIZE = 10;

export function getRoleTone(role: string): string {
  const lower = role.toLowerCase();
  if (lower.includes("tiếp") || lower.includes("reception")) return "bg-primary-100 text-primary-600";
  if (lower.includes("admin")) return "bg-purple-100 text-purple-600";
  if (lower.includes("kế") || lower.includes("account")) return "bg-warning-light text-warning";
  if (lower.includes("cskh") || lower.includes("customer")) return "bg-success-light text-success";
  return "bg-slate-100 text-slate-600";
}

export function getInitials(name?: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1]?.[0] ?? "?";
  const prev = parts.length > 1 ? parts[parts.length - 2]?.[0] ?? "" : "";
  return `${prev}${last}`.toUpperCase();
}
