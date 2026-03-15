"use client";

import React from "react";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {
  IconCheck,
  IconCalendar,
  IconClock,
  IconVideo,
  IconBuilding,
  IconMail,
  IconX,
  IconAlertTriangle,
  IconPencil,
} from "@tabler/icons-react";
import {type CalendarEvent, type SlotDiff} from "@/app/(protected)/my-schedule/_components/schedule-builder";
import {SESSION_COLORS} from "@/lib/session-colors";

export const getDstChangeInfo = (): {changing: boolean; date?: Date} => {
  const today = new Date();
  const todayOffset = today.getTimezoneOffset();
  for (let i = 1; i <= 7; i++) {
    const future = new Date(today);
    future.setDate(today.getDate() + i);
    if (future.getTimezoneOffset() !== todayOffset) {
      return {changing: true, date: future};
    }
  }
  return {changing: false};
};

interface TimeSlot {
  id: string;
  startTime: string;
  duration: number;
  sessionType: string;
  location: string;
  description?: string;
  color?: string;
  email?: string;
}

interface DaySchedule {
  day: number;
  timeSlots: TimeSlot[];
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SESSION_TYPE_CONFIG = {
  individual: {
    label: "Individual",
    color: SESSION_COLORS.individual,
    lightColor: hexToRgba(SESSION_COLORS.individual, 0.06),
    borderColor: hexToRgba(SESSION_COLORS.individual, 0.18),
  },
  group: {
    label: "Group",
    color: SESSION_COLORS.group,
    lightColor: hexToRgba(SESSION_COLORS.group, 0.06),
    borderColor: hexToRgba(SESSION_COLORS.group, 0.18),
  },
  regular: {
    label: "Regular",
    color: SESSION_COLORS.regular,
    lightColor: hexToRgba(SESSION_COLORS.regular, 0.06),
    borderColor: hexToRgba(SESSION_COLORS.regular, 0.18),
  },
  test: {
    label: "Test",
    color: SESSION_COLORS.test,
    lightColor: hexToRgba(SESSION_COLORS.test, 0.06),
    borderColor: hexToRgba(SESSION_COLORS.test, 0.18),
  },
};

const LOCATION_CONFIG = {
  online: {label: "Online", icon: IconVideo},
  classroom: {label: "Classroom", icon: IconBuilding},
};

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const total = hours * 60 + minutes + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
};

interface ScheduleConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  daySchedules: DaySchedule[];
  totalSlots: number;
  onConfirm: () => void;
  getDayLabel: (dayValue: number) => string;
  diff?: SlotDiff | null;
  confirmedRemovals?: Set<string>;
  onToggleRemoval?: (id: string) => void;
}

export const ScheduleConfirmDialog: React.FC<ScheduleConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  daySchedules,
  totalSlots,
  onConfirm,
  getDayLabel,
  diff,
  confirmedRemovals,
  onToggleRemoval,
}) => {
  const getModifiedFields = (before: CalendarEvent, after: CalendarEvent): string => {
    const changes: string[] = [];
    if (before.dayOfWeek !== after.dayOfWeek)
      changes.push(`${getDayLabel(before.dayOfWeek)} → ${getDayLabel(after.dayOfWeek)}`);
    if (before.startTime !== after.startTime)
      changes.push(`${before.startTime} → ${after.startTime}`);
    if (before.duration !== after.duration)
      changes.push(`${formatDuration(before.duration)} → ${formatDuration(after.duration)}`);
    if (before.sessionType !== after.sessionType)
      changes.push(`${before.sessionType} → ${after.sessionType}`);
    if (before.location !== after.location)
      changes.push(`${before.location} → ${after.location}`);
    return changes.join(" · ") || "updated";
  };

  const dstInfo = getDstChangeInfo();
  const totalDays = daySchedules.length;

  const totalDuration = daySchedules.reduce(
    (acc, day) => acc + day.timeSlots.reduce((a, s) => a + s.duration, 0),
    0
  );

  const sessionTypeCounts = daySchedules.reduce((acc, day) => {
    day.timeSlots.forEach((slot) => {
      acc[slot.sessionType] = (acc[slot.sessionType] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const sessionTypeDurations = daySchedules.reduce((acc, day) => {
    day.timeSlots.forEach((slot) => {
      acc[slot.sessionType] = (acc[slot.sessionType] || 0) + slot.duration;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={`
          ${diff ? "sm:max-w-[980px]" : "sm:max-w-[780px]"} p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden
          flex flex-col sm:flex-row
          max-h-[92vh] sm:h-[700px]
          [&>button:last-child]:hidden
        `}
      >
        <DialogTitle className="sr-only">Schedule Overview</DialogTitle>
        <DialogDescription className="sr-only">Review every slot before confirming</DialogDescription>
        {/* ── LEFT PANEL ── gradient summary */}
        <div
          className="sm:w-[220px] shrink-0 flex flex-col"
          style={{
            background: "linear-gradient(170deg, #2563eb 0%, #7c3aed 55%, #6d28d9 100%)",
          }}
        >
          {/* Icon + heading */}
          <div className="px-6 pt-7 pb-5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-5">
              <IconCalendar className="h-5 w-5 text-white"/>
            </div>
            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Summary
            </p>
            <h2 className="text-white text-xl font-bold leading-snug">
              Schedule<br/>Overview
            </h2>
          </div>

          {/* Big stats */}
          <div className="px-6 flex-1 space-y-5">
            <div>
              <span className="text-[42px] font-extrabold text-white leading-none tabular-nums">
                {totalSlots}
              </span>
              <p className="text-white/55 text-xs mt-1">
                {totalSlots === 1 ? "session" : "sessions"} / week
              </p>
            </div>

            <div className="w-full h-px bg-white/10"/>

            <div className="grid grid-cols-3">
              <div className="col-span-1">
                <span className="text-2xl font-bold text-white tabular-nums">{totalDays}</span>
                <p className="text-white/55 text-[11px] mt-0.5">
                  {totalDays === 1 ? "day" : "days"}
                </p>
              </div>
              <div className="col-span-2 text-end">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {formatDuration(totalDuration)}
                </span>
                <p className="text-white/55 text-end text-[11px] mt-0.5">total time</p>
              </div>
            </div>

            {/* Session type breakdown */}
            <div>
              <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-3">
                By type
              </p>
              <div className="space-y-2">
                {Object.entries(SESSION_TYPE_CONFIG).map(([key, config]) => {
                  const count = sessionTypeCounts[key] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{backgroundColor: "rgba(255,255,255,0.75)"}}
                        />
                        <span className="text-white/65 text-xs flex-1">{config.label}</span>
                        <span className="text-white text-sm font-semibold tabular-nums">{count}</span>
                      </div>
                      <div className="pl-4 flex items-center gap-1">
                        <span className="text-white/35 text-[11px] tabular-nums">
                          {formatDuration(sessionTypeDurations[key] || 0)} total
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-5 pt-4 space-y-2">
            <Button
              onClick={onConfirm}
              type="button"
              className="w-full bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-md"
            >
              <IconCheck className="h-4 w-4 mr-1.5"/>
              Submit Schedule
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              type="button"
              className="w-full text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── session details */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">

          {/* Right header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Session Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review every slot before confirming
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconX className="h-4 w-4"/>
            </button>
          </div>

          {/* DST warning */}
          {dstInfo.changing && dstInfo.date && (
            <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <IconAlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5"/>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Clock change on {dstInfo.date.toLocaleDateString("en-GB", {weekday: "long", month: "long", day: "numeric"})}.</span>{" "}
                Times shown are based on your current UTC offset — sessions may shift by 1 hour after the change.
              </p>
            </div>
          )}

          {/* Scrollable timeline */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-7">
              {daySchedules.map((schedule, dayIdx) => (
                <div key={schedule.day}>

                  {/* Day label row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{background: "linear-gradient(135deg, #3b82f6, #8b5cf6)"}}
                    >
                      {dayIdx + 1}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {getDayLabel(schedule.day)}
                    </span>
                    <div className="flex-1 h-px bg-border/60"/>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {schedule.timeSlots.length}{" "}
                      {schedule.timeSlots.length === 1 ? "session" : "sessions"}
                    </span>
                  </div>

                  {/* Session cards */}
                  <div className="space-y-2 pl-7">
                    {schedule.timeSlots.map((slot) => {
                      const sessionConfig =
                        SESSION_TYPE_CONFIG[slot.sessionType as keyof typeof SESSION_TYPE_CONFIG] ||
                        SESSION_TYPE_CONFIG.individual;
                      const locationConfig =
                        LOCATION_CONFIG[slot.location as keyof typeof LOCATION_CONFIG] ||
                        LOCATION_CONFIG.online;
                      const LocationIcon = locationConfig.icon;
                      const localStart = slot.startTime;
                      const endTime = calculateEndTime(localStart, slot.duration);
                      const slotColor = slot.color || sessionConfig.color;

                      return (
                        <div
                          key={slot.id}
                          className="relative flex items-start gap-3 rounded-l-sm rounded-xl px-4 py-3 transition-shadow hover:shadow-sm"
                          style={{
                            backgroundColor: sessionConfig.lightColor,
                            border: `1px solid ${sessionConfig.borderColor}`,
                          }}
                        >
                          {/* Left accent bar */}
                          <div
                            className="absolute left-0 top-0 bottom-3 w-[3px] rounded-l-full h-full"
                            style={{backgroundColor: slotColor}}
                          />

                          {/* Time column */}
                          <div className="shrink-0 text-right w-[52px]">
                            <div className="text-sm font-bold text-foreground tabular-nums leading-tight">
                              {localStart}
                            </div>
                            <div className="text-[11px] text-muted-foreground tabular-nums leading-tight">
                              {endTime}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="self-stretch w-px bg-border/50 shrink-0 my-0.5"/>

                          {/* Info column */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <IconClock className="h-3 w-3 shrink-0" style={{color: slotColor}}/>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {formatDuration(slot.duration)}
                              </span>
                            </div>
                            {slot.description && (
                              <p className="text-xs text-muted-foreground/80 leading-relaxed truncate">
                                {slot.description}
                              </p>
                            )}
                            {slot.email && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <IconMail className="h-3 w-3 text-muted-foreground/50 shrink-0"/>
                                <span className="text-[11px] text-muted-foreground/70 truncate">
                                  {slot.email}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${slotColor}18`,
                                color: slotColor,
                                border: `1px solid ${slotColor}28`,
                              }}
                            >
                              {sessionConfig.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                              <LocationIcon className="h-3 w-3 shrink-0"/>
                              {locationConfig.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── changes */}
        {diff && (
          <div className="sm:w-[200px] shrink-0 flex flex-col border-l border-border/60 bg-background">
            {/* Header */}
            <div className="px-4 pt-5 pb-4 border-b border-border/60 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Changes
              </p>
              <h3 className="text-sm font-bold text-foreground leading-snug">
                From previous<br/>schedule
              </h3>
              <div className="flex items-center gap-1.5 mt-3">
                {diff.added.length > 0 && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    +{diff.added.length}
                  </span>
                )}
                {diff.removed.length > 0 && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    −{diff.removed.length}
                  </span>
                )}
                {diff.modified.length > 0 && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 flex items-center gap-0.5">
                    <IconPencil className="h-2.5 w-2.5"/>{diff.modified.length}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable change list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {diff.added.map((e) => (
                <div key={e.id} className="px-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">+</span>
                    <span className="text-[11px] font-semibold text-foreground">{getDayLabel(e.dayOfWeek)}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{e.startTime}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground capitalize pl-3.5">
                    {e.sessionType} · {formatDuration(e.duration)}
                  </p>
                </div>
              ))}
              {diff.removed.map((e) => {
                if (e.sessionType === "regular") {
                  const checked = confirmedRemovals?.has(e.id) ?? false;
                  return (
                    <div key={e.id} className="px-4 py-2.5 bg-amber-50/60 dark:bg-amber-950/10 border-l-2 border-amber-400 dark:border-amber-600">
                      <div className="flex items-start gap-1.5">
                        <IconAlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[11px] font-semibold text-foreground">{getDayLabel(e.dayOfWeek)}</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">{e.startTime}</span>
                          </div>
                          {e.email && (
                            <p className="text-[11px] text-muted-foreground truncate mb-1.5">{e.email}</p>
                          )}
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleRemoval?.(e.id)}
                              className="w-3 h-3 accent-amber-500 cursor-pointer"
                            />
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 group-hover:text-amber-900 dark:group-hover:text-amber-300 leading-tight">
                              Notify student &amp; end recurring
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={e.id} className="px-4 py-2.5 bg-red-50/50 dark:bg-red-950/10">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400">−</span>
                      <span className="text-[11px] font-semibold text-foreground">{getDayLabel(e.dayOfWeek)}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{e.startTime}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground capitalize pl-3.5">
                      {e.sessionType} · {formatDuration(e.duration)}
                    </p>
                  </div>
                );
              })}
              {diff.modified.map(({before, after}) => (
                <div key={before.id} className="px-4 py-2.5 bg-blue-50/50 dark:bg-blue-950/10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <IconPencil className="h-3 w-3 shrink-0 text-blue-500 dark:text-blue-400"/>
                    <span className="text-[11px] font-semibold text-foreground">{getDayLabel(after.dayOfWeek)}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{after.startTime}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate pl-3.5">
                    {getModifiedFields(before, after)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
