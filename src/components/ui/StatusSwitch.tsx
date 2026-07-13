"use client";

/**
 * StatusSwitch – nút gạt bật/tắt trạng thái kiểu iOS dùng chung cho các bảng.
 * Xanh lá = đang hoạt động, xám = tạm ngưng. Kèm nhãn text bên cạnh.
 */
type StatusSwitchProps = {
  /** true = đang hoạt động (xanh), false = tạm ngưng (xám). */
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Đang lưu → khóa nút để tránh double-click. */
  loading?: boolean;
  disabled?: boolean;
  /** Nhãn hiển thị. Mặc định: "Hoạt động" / "Tạm ngưng". */
  activeLabel?: string;
  inactiveLabel?: string;
  /** Ẩn nhãn text, chỉ hiện nút gạt. */
  hideLabel?: boolean;
  title?: string;
};

export function StatusSwitch({
  checked,
  onChange,
  loading = false,
  disabled = false,
  activeLabel = "Hoạt động",
  inactiveLabel = "Tạm ngưng",
  hideLabel = false,
  title = "Bật/tắt trạng thái hoạt động",
}: StatusSwitchProps) {
  const isDisabled = disabled || loading;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={isDisabled}
        onClick={() => onChange(!checked)}
        title={title}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${checked ? "bg-green-500" : "bg-slate-300"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
      {!hideLabel && (
        <span className={`text-xs font-medium ${checked ? "text-success" : "text-slate-500"}`}>
          {checked ? activeLabel : inactiveLabel}
        </span>
      )}
    </div>
  );
}
