"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconClock } from "@tabler/icons-react";

interface TimePickerProps {
  value?: string; // "HH:mm" 24h
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type Step = "hours" | "minutes";

const SIZE = 244;
const CENTER = SIZE / 2;
const OUTER_R = 90;
const INNER_R = 62;

function getPos(index: number, total: number, r: number) {
  const a = (index / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

const OUTER_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const INNER_HOURS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] as const;
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function TimePicker({
  value = "",
  onChange,
  placeholder = "Select time",
  disabled,
  className,
}: TimePickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("hours");

  const parsed = value.match(/^(\d{1,2}):(\d{2})$/);
  const [tempHour, setTempHour] = useState<number | null>(
    parsed ? +parsed[1] : null,
  );
  const [tempMinute, setTempMinute] = useState<number | null>(
    parsed ? +parsed[2] : null,
  );

  const onOpenChange = (v: boolean) => {
    if (v) {
      const p = value.match(/^(\d{1,2}):(\d{2})$/);
      setTempHour(p ? +p[1] : null);
      setTempMinute(p ? +p[2] : null);
      setStep("hours");
    }
    setOpen(v);
  };

  const applyPointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>, commit: boolean) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * SIZE - CENTER;
      const y = ((e.clientY - rect.top) / rect.height) * SIZE - CENTER;
      const angle = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
      const snap = Math.round(angle / 30) % 12;

      if (step === "hours") {
        const inner = Math.hypot(x, y) < (OUTER_R + INNER_R) / 2;
        const hour = inner
          ? snap === 0
            ? 0
            : snap + 12
          : snap === 0
            ? 12
            : snap;
        setTempHour(hour);
        if (commit) setTimeout(() => setStep("minutes"), 100);
      } else {
        const min = (snap * 5) % 60;
        setTempMinute(min);
        if (commit) {
          const h = tempHour ?? 0;
          onChange?.(
            `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
          );
          setOpen(false);
        }
      }
    },
    [step, tempHour, onChange],
  );

  const handEnd = (() => {
    if (step === "hours" && tempHour !== null) {
      const inner = tempHour === 0 || tempHour >= 13;
      const idx = inner
        ? tempHour === 0
          ? 0
          : tempHour - 12
        : tempHour === 12
          ? 0
          : tempHour;
      return getPos(idx, 12, inner ? INNER_R : OUTER_R);
    }
    if (step === "minutes" && tempMinute !== null) {
      return getPos(tempMinute / 5, 12, OUTER_R);
    }
    return null;
  })();

  const dH = tempHour !== null ? String(tempHour).padStart(2, "0") : "--";
  const dM = tempMinute !== null ? String(tempMinute).padStart(2, "0") : "--";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex cursor-pointer h-10 w-full items-center gap-2.5 rounded-xl border border-input bg-background px-3 text-sm",
            "transition-colors hover:border-slate-300 dark:hover:border-slate-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <IconClock size={15} className="shrink-0 text-muted-foreground" />
          <span>{value || placeholder}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-5 shadow-xl"
        align="start"
        sideOffset={6}
      >
        {/* Time display */}
        <div className="mb-4 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setStep("hours")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-4xl font-bold tracking-tight transition-all duration-150",
              step === "hours"
                ? "bg-gradient-to-br from-blue-200 to-blue-600 text-white"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {dH}
          </button>
          <span className="pb-0.5 text-3xl font-bold text-muted-foreground/25">
            :
          </span>
          <button
            type="button"
            onClick={() => {
              if (tempHour !== null) setStep("minutes");
            }}
            disabled={tempHour === null}
            className={cn(
              "rounded-lg px-3 py-1.5 text-4xl font-bold tracking-tight transition-all duration-150",
              step === "minutes"
                ? "bg-gradient-to-br from-blue-200 to-blue-600 text-white"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              tempHour === null && "cursor-not-allowed opacity-40",
            )}
          >
            {dM}
          </button>
        </div>

        {/* Step progress */}
        <div className="mb-4 flex justify-center gap-1.5">
          {(["hours", "minutes"] as Step[]).map((s) => (
            <div
              key={s}
              className={cn(
                "h-[3px] rounded-full transition-all duration-300",
                step === s
                  ? "w-6 bg-gradient-to-r from-blue-200 to-blue-600"
                  : "w-3 bg-muted-foreground/20",
              )}
            />
          ))}
        </div>

        {/* Clock face */}
        <svg
          ref={svgRef}
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="touch-none select-none cursor-pointer"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            applyPointer(e, false);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            applyPointer(e, false);
          }}
          onPointerUp={(e) => {
            applyPointer(e, true);
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        >
          <defs>
            <radialGradient id="tp-sel" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a3b3ff" />
              <stop offset="100%" stopColor="#155dfc" />
            </radialGradient>
          </defs>

          {/* Face */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={CENTER - 4}
            style={{ fill: "var(--muted)" }}
          />

          {/* Hand */}
          {handEnd && (
            <>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={handEnd.x}
                y2={handEnd.y}
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeOpacity={0.5}
              />
              <circle cx={CENTER} cy={CENTER} r={3} fill="#3b82f6" />
            </>
          )}

          {/* Hour numbers */}
          {step === "hours" && (
            <>
              {OUTER_HOURS.map((h, i) => {
                const p = getPos(i, 12, OUTER_R);
                const sel = tempHour === h;
                return (
                  <g key={`oh-${h}`}>
                    {sel && (
                      <circle cx={p.x} cy={p.y} r={17} fill="url(#tp-sel)" />
                    )}
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={sel ? 600 : 400}
                      fill={sel ? "white" : "currentColor"}
                      fillOpacity={sel ? 1 : 0.85}
                    >
                      {h}
                    </text>
                  </g>
                );
              })}
              {INNER_HOURS.map((h, i) => {
                const p = getPos(i, 12, INNER_R);
                const sel = tempHour === h;
                return (
                  <g key={`ih-${h}`}>
                    {sel && (
                      <circle cx={p.x} cy={p.y} r={15} fill="url(#tp-sel)" />
                    )}
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10}
                      fontWeight={sel ? 600 : 400}
                      fill={sel ? "white" : "currentColor"}
                      fillOpacity={sel ? 1 : 0.5}
                    >
                      {String(h).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Minute numbers */}
          {step === "minutes" &&
            MINUTES.map((m, i) => {
              const p = getPos(i, 12, OUTER_R);
              const sel = tempMinute === m;
              return (
                <g key={`m-${m}`}>
                  {sel && (
                    <circle cx={p.x} cy={p.y} r={17} fill="url(#tp-sel)" />
                  )}
                  <text
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={13}
                    fontWeight={sel ? 600 : 400}
                    fill={sel ? "white" : "currentColor"}
                    fillOpacity={sel ? 1 : 0.85}
                  >
                    {String(m).padStart(2, "0")}
                  </text>
                </g>
              );
            })}
        </svg>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {step === "hours" ? "Select hour" : "Select minute"}
        </p>
      </PopoverContent>
    </Popover>
  );
}
