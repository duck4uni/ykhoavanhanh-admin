/** Dropdown chọn giờ theo khung 24h (00–23 giờ Việt Nam) + phút, thay cho input type="time" của trình duyệt. */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 0..23
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map(Number);
  return { hour: Number.isFinite(h) ? h : 0, minute: Number.isFinite(m) ? m : 0 };
}

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeSelect({ value, onChange, className }: TimeSelectProps) {
  const { hour, minute } = parseTime(value);
  const selectClass =
    className ??
    "h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

  function emit(nextHour: number, nextMinute: number) {
    onChange(`${pad(nextHour)}:${pad(nextMinute)}`);
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <select
        value={value ? hour : ""}
        onChange={(e) => emit(Number(e.target.value), minute)}
        className={selectClass}
      >
        <option value="" disabled>
          Giờ
        </option>
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {pad(h)} giờ
          </option>
        ))}
      </select>
      <span className="text-slate-400">:</span>
      <select
        value={value ? minute : ""}
        onChange={(e) => emit(hour, Number(e.target.value))}
        className={selectClass}
      >
        <option value="" disabled>
          Phút
        </option>
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {pad(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
