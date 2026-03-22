"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface DatePickerProps {
  value?: string; // "YYYY-MM-DD"
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disablePast?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Cell = {
  day: number;
  month: "prev" | "current" | "next";
  date: Date;
};

function buildCalendarCells(year: number, month: number): Cell[] {
  const cells: Cell[] = [];
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({ day: d, month: "prev", date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: "current", date: new Date(year, month, d) });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: "next", date: new Date(year, month + 1, d) });
  }

  return cells;
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  disablePast = true,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getInitialView = () => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(getInitialView);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildCalendarCells(year, month);

  const isToday = (d: Date) => toDateStr(d) === toDateStr(today);
  const isSelected = (d: Date) => toDateStr(d) === value;
  const isPast = (d: Date) => d < today;

  const handleSelect = (cell: Cell) => {
    if (disablePast && isPast(cell.date)) return;
    onChange?.(toDateStr(cell.date));
    setOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-xl border border-input bg-background px-3 text-sm",
            "transition-colors hover:border-slate-300 dark:hover:border-slate-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <IconCalendar size={15} className="shrink-0 text-muted-foreground" />
          <span>{value ? formatDisplay(value) : placeholder}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-4 shadow-xl"
        align="start"
        sideOffset={6}
      >
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <IconChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold tabular-nums">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <IconChevronRight size={15} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="flex h-8 w-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const past = disablePast && isPast(cell.date);
            const sel = isSelected(cell.date);
            const today_ = isToday(cell.date);
            const otherMonth = cell.month !== "current";

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(cell)}
                disabled={past}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                  sel &&
                    "bg-gradient-to-br from-blue-500 to-violet-600 font-semibold text-white shadow-sm",
                  !sel &&
                    today_ &&
                    "font-semibold ring-1 ring-blue-400/60 text-blue-600 dark:text-blue-400 dark:ring-blue-400/40",
                  !sel &&
                    !past &&
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                  otherMonth && !sel && "text-muted-foreground/35",
                  !otherMonth && !sel && !past && "text-foreground",
                  past && "cursor-not-allowed text-muted-foreground/25",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        {/* Selected date summary */}
        {value && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-center text-xs text-muted-foreground">
              {formatDisplay(value)}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
