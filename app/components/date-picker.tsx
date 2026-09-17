import { useState, useEffect, useRef, useMemo } from "react";
import { CalendarIcon } from "./icons";

export interface DatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function formatIsoToDisplay(isoDate?: string): string {
  if (!isoDate || isoDate.length < 10) return "";
  const clean = isoDate.trim();
  if (clean.includes("T")) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  const parts = clean.slice(0, 10).split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function parseDisplayToIso(displayStr: string): string | null {
  const clean = displayStr.trim();
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2100) return null;

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function DatePicker({
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "dd/mm/yyyy",
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() => formatIsoToDisplay(value));
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal input display when external value changes
  useEffect(() => {
    setInputValue(formatIsoToDisplay(value));
  }, [value]);

  // Current view in Calendar (year & month)
  const [viewYear, setViewYear] = useState(() => {
    if (value && value.length >= 4) {
      const y = parseInt(value.slice(0, 4), 10);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (value && value.length >= 7) {
      const m = parseInt(value.slice(5, 7), 10) - 1;
      if (!isNaN(m) && m >= 0 && m <= 11) return m;
    }
    return new Date().getMonth();
  });

  // When value changes, update view year & month if valid
  useEffect(() => {
    if (value && value.length >= 10) {
      const y = parseInt(value.slice(0, 4), 10);
      const m = parseInt(value.slice(5, 7), 10) - 1;
      if (!isNaN(y)) setViewYear(y);
      if (!isNaN(m) && m >= 0 && m <= 11) setViewMonth(m);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format typing with auto-slash mask (DD/MM/YYYY)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!raw) {
      setInputValue("");
      onChange("");
      return;
    }

    // Tối đa 8 chữ số (2 số ngày + 2 số tháng + 4 số năm)
    const digits = raw.replace(/\D/g, "").slice(0, 8);

    // Luôn tự động format thành DD/MM/YYYY
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    // Cho phép hiển thị dấu "/" khi người dùng chủ động gõ dấu "/" sau ngày (2 số) hoặc sau tháng (4 số)
    if (raw.endsWith("/") && (digits.length === 2 || digits.length === 4)) {
      formatted += "/";
    }

    setInputValue(formatted);

    // Khi đã nhập đủ 8 chữ số (chuỗi DD/MM/YYYY)
    if (digits.length === 8) {
      const iso = parseDisplayToIso(formatted);
      if (iso) {
        onChange(iso);
      }
    }
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      onChange("");
      return;
    }
    const iso = parseDisplayToIso(inputValue);
    if (iso) {
      onChange(iso);
      setInputValue(formatIsoToDisplay(iso));
    } else {
      // Revert to current valid value
      setInputValue(formatIsoToDisplay(value));
    }
  };

  // Calendar Grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
    const totalDaysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; month: number; year: number }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({ day: d, isCurrentMonth: false, month: prevM, year: prevY });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInCurrentMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, month: viewMonth, year: viewYear });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({ day: d, isCurrentMonth: false, month: nextM, year: nextY });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleSelectDay = (day: number, month: number, year: number) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const isoString = `${year}-${pad(month + 1)}-${pad(day)}`;
    onChange(isoString);
    setInputValue(formatIsoToDisplay(isoString));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectToday = () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const isoString = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    onChange(isoString);
    setInputValue(formatIsoToDisplay(isoString));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setInputValue("");
    setIsOpen(false);
  };

  // Generate Year options (1940 to 2040)
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = 2035; y >= 1940; y--) {
      list.push(y);
    }
    return list;
  }, []);

  const todayStr = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  }, []);

  return (
    <div ref={containerRef} className={`relative block ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 pr-11 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400 transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-3.5 text-slate-400 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400 cursor-pointer transition-colors p-1"
          title="Chọn ngày từ lịch"
        >
          <CalendarIcon size={18} />
        </button>
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
          {/* Header Controls: Month & Year selection */}
          <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="grid size-8 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer transition-colors"
              title="Tháng trước"
            >
              ‹
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="grid size-8 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer transition-colors"
              title="Tháng sau"
            >
              ›
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {calendarDays.map((item, index) => {
              const pad = (n: number) => n.toString().padStart(2, "0");
              const currentIso = `${item.year}-${pad(item.month + 1)}-${pad(item.day)}`;
              const isSelected = value === currentIso;
              const isToday = todayStr === currentIso;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDay(item.day, item.month, item.year)}
                  className={`size-8 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-cyan-500 text-white font-bold shadow-xs scale-105"
                      : isToday
                      ? "border border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50/50 dark:bg-cyan-950/20"
                      : item.isCurrentMonth
                      ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                      : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-2.5 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-medium cursor-pointer transition-colors"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
