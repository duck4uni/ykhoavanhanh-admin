import { Spinner } from "@/components/ui/Spinner";

export interface PickerItem {
  id: string;
  /** Nhãn chính hiển thị đậm. */
  title: string;
  /** Dòng phụ (vd mã dịch vụ) hiển thị mờ bên dưới — không bắt buộc. */
  subtitle?: string;
}

interface PickerListProps {
  items: PickerItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  isFetching?: boolean;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  emptyText: string;
  loadingText: string;
  maxHeightClass?: string;
}

/** Danh sách checkbox tái sử dụng cho chuyên khoa / dịch vụ của phòng khám. */
export function PickerList({
  items,
  selectedIds,
  onToggle,
  isFetching,
  onScroll,
  emptyText,
  loadingText,
  maxHeightClass = "max-h-48",
}: PickerListProps) {
  return (
    <div
      onScroll={onScroll}
      className={`mt-2 ${maxHeightClass} space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3`}
    >
      {items.length === 0 && !isFetching ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        items.map((item) => {
          const checked = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                checked
                  ? "border-primary-200 bg-primary-50 text-primary-700"
                  : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="min-w-0">
                <span className="block font-medium">{item.title}</span>
                {item.subtitle && (
                  <span className="block font-mono text-xs text-muted-foreground">{item.subtitle}</span>
                )}
              </span>
            </label>
          );
        })
      )}
      {isFetching && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Spinner size="sm" /> {loadingText}
        </div>
      )}
    </div>
  );
}
