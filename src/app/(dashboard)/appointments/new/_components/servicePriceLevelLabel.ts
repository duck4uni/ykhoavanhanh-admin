type ServiceLabelSource = {
  servicename?: string | null;
  serviceid?: string | null;
};

type PriceLevelLabelSource = {
  label?: string | null;
  price: number;
};

export function formatServicePriceLevelOptionLabel(
  service: ServiceLabelSource,
  level: PriceLevelLabelSource
): string {
  const price = `${level.price.toLocaleString("vi-VN")}đ`;
  return `${service.servicename || "—"} - ${level.label || "—"} - ${price} - (${service.serviceid || "—"})`;
}
