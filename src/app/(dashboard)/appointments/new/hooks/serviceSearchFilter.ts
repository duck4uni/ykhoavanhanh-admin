export function buildServiceSearchFilter(search: string): string | undefined {
  const keyword = search.trim();
  if (!keyword) return undefined;

  return /^\d+$/.test(keyword) ? `service_id@=${keyword}` : `service_name@=${keyword}`;
}
