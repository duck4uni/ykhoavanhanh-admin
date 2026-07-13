"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function parseLocalISODate(value?: string): Date | undefined {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function formatLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DatePicker({
  label,
  value,
  onChange,
  min,
  error,
  placeholder = "Chọn ngày",
  required = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(() => parseLocalISODate(value), [value]);
  const minDate = React.useMemo(() => parseLocalISODate(min), [min]);
  const initialMonth = selectedDate ?? minDate ?? new Date();
  const [month, setMonth] = React.useState(() => startOfMonth(initialMonth));
  const fieldId = React.useId();
  const errorId = `${fieldId}-error`;

  React.useEffect(() => {
    if (selectedDate) setMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setMonth(startOfMonth(selectedDate ?? minDate ?? new Date()));
    setOpen(nextOpen);
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onChange(formatLocalISODate(date));
    setOpen(false);
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <div className="relative">
          <Popover.Trigger asChild>
            <button
              id={fieldId}
              type="button"
              disabled={disabled}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                "flex h-9 w-full items-center rounded-md border border-input bg-white px-3 text-left text-sm shadow-xs outline-none transition-[color,box-shadow,border-color]",
                "hover:border-slate-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive focus-visible:ring-destructive/20",
                value && !disabled ? "pr-16" : "pr-9",
              )}
            >
              <span className={cn("min-w-0 flex-1 truncate", !selectedDate && "text-muted-foreground")}>
                {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: vi }) : placeholder}
              </span>
              <CalendarDays className="absolute right-3 size-4 text-slate-500" aria-hidden="true" />
            </button>
          </Popover.Trigger>

          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-9 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              aria-label="Xóa ngày đã chọn"
              title="Xóa ngày đã chọn"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="z-50 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-3 shadow-[0_14px_36px_-12px_rgba(15,23,42,0.28)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              startMonth={minDate ? startOfMonth(minDate) : undefined}
              disabled={minDate ? { before: minDate } : undefined}
              locale={vi}
              weekStartsOn={1}
              showOutsideDays
              fixedWeeks
              autoFocus
              navLayout="around"
              formatters={{
                formatCaption: (date) => `Tháng ${date.getMonth() + 1} ${date.getFullYear()}`,
                formatWeekdayName: (date) => weekdayLabels[date.getDay()],
              }}
              labels={{
                labelNav: () => "Điều hướng tháng",
                labelPrevious: () => "Tháng trước",
                labelNext: () => "Tháng sau",
              }}
              classNames={{
                root: "w-[280px] max-w-full text-slate-800",
                months: "relative",
                month: "relative",
                month_caption: "flex h-8 items-center justify-center px-9",
                caption_label: "text-sm font-semibold capitalize text-slate-900",
                button_previous: "absolute left-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg text-slate-900 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:text-slate-300 aria-disabled:opacity-40",
                button_next: "absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg text-slate-900 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:text-slate-300 aria-disabled:opacity-40",
                chevron: "size-4 fill-current",
                month_grid: "mt-1 w-full table-fixed border-collapse",
                weekdays: "border-b border-slate-100",
                weekday: "h-8 text-center text-[11px] font-semibold text-slate-500",
                week: "mt-1",
                day: "relative size-10 p-0 text-center text-sm",
                day_button: "mx-auto inline-flex size-9 items-center justify-center rounded-lg font-medium text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
                selected: "[&>button]:bg-primary-600 [&>button]:text-white [&>button]:shadow-sm [&>button]:hover:bg-primary-700 [&>button]:hover:text-white",
                today: "[&:not(.rdp-selected)>button]:border [&:not(.rdp-selected)>button]:border-primary-200 [&:not(.rdp-selected)>button]:bg-primary-50 [&:not(.rdp-selected)>button]:font-bold [&:not(.rdp-selected)>button]:text-primary-700",
                outside: "[&>button]:text-slate-300",
                disabled: "[&>button]:cursor-not-allowed [&>button]:text-slate-300 [&>button]:line-through [&>button]:opacity-60 [&>button]:hover:bg-transparent [&>button]:hover:text-slate-300",
                focused: "[&>button]:ring-2 [&>button]:ring-primary-500/50",
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
