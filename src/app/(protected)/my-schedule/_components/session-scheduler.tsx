/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg } from "@fullcalendar/core";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { SessionData } from "@/components/calendar/types";
import "@/components/calendar/calendar-styles.css";
import {useCalendarResize} from "@/hooks/use-calendar-resize";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  IconCalendar,
  IconCalendarPlus,
  IconCheck,
  IconClock,
  IconVideo,
  IconBuilding,
  IconUser,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getStudents, createOneTimeSession, createAvailableSlot } from "@/actions/timeblocks";
import { getSessionColor } from "@/lib/session-colors";
import { AvailableSlotData } from "@/components/calendar/types";
import type { Student } from "./schedule-sheet";

// ── Types ──────────────────────────────────────────────────────────────────

interface SessionFormData {
  date: string;
  startTime: string;
  duration: number;
  sessionType: "individual" | "group" | "test";
  location: "online" | "classroom";
  studentClerkId: string;
  studentEmail: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SESSION_COLORS = {
  individual: "#3b82f6",
  group: "#8b5cf6",
  test: "#f97316",
};

const SESSION_TYPE_CONFIG = {
  individual: {
    label: "Individual",
    hex: "#3b82f6",
    lightColor: "rgba(59, 130, 246, 0.07)",
    description: "One-on-one personalized sessions tailored to individual learning needs.",
  },
  group: {
    label: "Group",
    hex: "#8b5cf6",
    lightColor: "rgba(139, 92, 246, 0.07)",
    description: "Interactive sessions with multiple participants for collaborative learning.",
  },
  test: {
    label: "Test",
    hex: "#f97316",
    lightColor: "rgba(249, 115, 22, 0.07)",
    description: "A one-time trial session for new students to experience the teaching style.",
  },
};

const LOCATION_CONFIG = {
  online: { label: "Online", icon: IconVideo },
  classroom: { label: "Classroom", icon: IconBuilding },
};

const DURATION_PRESETS = [30, 45, 60, 75, 90, 120];

// ── Helpers ────────────────────────────────────────────────────────────────

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60) % 24}`.padStart(2, "0") + ":" + `${total % 60}`.padStart(2, "0");
};

const todayStr = () => new Date().toISOString().split("T")[0];

// ── Component ──────────────────────────────────────────────────────────────

interface SessionSchedulerProps {
  data: SessionData[];
  availableSlots: AvailableSlotData[];
}

const SessionScheduler = ({ data, availableSlots }: SessionSchedulerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useCalendarResize(calendarRef);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Calendar UI state
  const [calendarTitle, setCalendarTitle] = useState(
    new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  );
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [showWeekends, setShowWeekends] = useState(true);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // Mode: "available" = mark as available slot, "book" = book for a student
  const [mode, setMode] = useState<"available" | "book">("available");

  // Student state
  const [students, setStudents] = useState<Student[]>([]);

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [studentSelectOpen, setStudentSelectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    date: "",
    startTime: "09:00",
    duration: 60,
    sessionType: "individual",
    location: "online",
    studentClerkId: "",
    studentEmail: "",
    color: SESSION_COLORS.individual,
  });

  useEffect(() => {
    getStudents().then((result) => {
      if (result.status === 200) setStudents(result.data);
    });
  }, []);

  // ── Calendar navigation ────────────────────────────────────────────────

  const updateCalendarTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) setCalendarTitle(api.view.title);
  }, []);

  const changeView = useCallback(
    (viewName: string) => {
      const api = calendarRef.current?.getApi();
      if (api) {
        api.changeView(viewName);
        setCurrentView(viewName);
        updateCalendarTitle();
      }
    },
    [updateCalendarTitle]
  );

  const goToToday = useCallback(() => {
    calendarRef.current?.getApi().today();
    updateCalendarTitle();
  }, [updateCalendarTitle]);

  const goToPrev = useCallback(() => {
    calendarRef.current?.getApi().prev();
    updateCalendarTitle();
  }, [updateCalendarTitle]);

  const goToNext = useCallback(() => {
    calendarRef.current?.getApi().next();
    updateCalendarTitle();
  }, [updateCalendarTitle]);

  // ── Slot selection ─────────────────────────────────────────────────────

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const start = selectInfo.start;

    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      calendarRef.current?.getApi().unselect();
      return;
    }

    const dateStr = start.toISOString().split("T")[0];
    let startTime = "09:00";
    let duration = 60;

    if (!selectInfo.allDay) {
      const h = start.getHours().toString().padStart(2, "0");
      const m = start.getMinutes().toString().padStart(2, "0");
      startTime = `${h}:${m}`;
      if (selectInfo.end) {
        const durationMs = selectInfo.end.getTime() - start.getTime();
        const durationMinutes = Math.max(15, Math.round(durationMs / 60000));
        duration = Math.round(durationMinutes / 15) * 15;
      }
    }

    setError(null);
    setMode("available");
    setFormData({
      date: dateStr,
      startTime,
      duration,
      sessionType: "individual",
      location: "online",
      studentClerkId: "",
      studentEmail: "",
      color: SESSION_COLORS.individual,
    });
    setIsSheetOpen(true);
    calendarRef.current?.getApi().unselect();
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (mode === "book" && !formData.studentClerkId) return;
    setError(null);
    startTransition(async () => {
      const result = mode === "available"
        ? await createAvailableSlot({
            date: formData.date,
            startTime: formData.startTime,
            duration: formData.duration,
            sessionType: formData.sessionType,
            location: formData.location,
          })
        : await createOneTimeSession({
            date: formData.date,
            startTime: formData.startTime,
            duration: formData.duration,
            sessionType: formData.sessionType,
            location: formData.location,
            studentClerkId: formData.studentClerkId,
          });

      if (result.status === 200) {
        setIsSheetOpen(false);
        router.refresh();
      } else {
        setError(result.message ?? "Failed to save. Please try again.");
      }
    });
  }, [mode, formData, router, startTransition]);

  const closeSheet = useCallback(() => {
    if (isPending) return;
    setIsSheetOpen(false);
    setError(null);
  }, [isPending]);

  // ── Calendar events ────────────────────────────────────────────────────

  const calendarEvents = useMemo(() => {
    const booked = data.map((session) => {
      const color =
        session.sessionType === "group"
          ? SESSION_COLORS.group
          : session.sessionType === "test"
          ? SESSION_COLORS.test
          : SESSION_COLORS.individual;

      const title =
        session.sessionType === "group"
          ? "Group"
          : session.sessionType === "test"
          ? "Test"
          : "Individual";

      return {
        id: `existing-${session.id}`,
        title,
        start: session.startTime,
        end: new Date(new Date(session.startTime).getTime() + session.duration * 60000),
        backgroundColor: color,
        borderColor: color,
        textColor: "#ffffff",
        extendedProps: {
          sessionType: session.sessionType,
          location: session.location,
          isAvailable: false,
        },
      };
    });

    const available = availableSlots.map((slot) => {
      const color = getSessionColor(slot.sessionType);

      const title =
        slot.sessionType === "group"
          ? "Group"
          : slot.sessionType === "test"
          ? "Test"
          : "Individual";

      return {
        id: `available-${slot.id}`,
        title,
        start: slot.startTime,
        end: new Date(new Date(slot.startTime).getTime() + slot.duration * 60000),
        backgroundColor: "transparent",
        borderColor: color,
        textColor: color,
        extendedProps: {
          sessionType: slot.sessionType,
          location: slot.location,
          isAvailable: true,
          color,
        },
      };
    });

    return [...booked, ...available];
  }, [data, availableSlots]);

  // ── Derived form values ────────────────────────────────────────────────

  const selectedStudent = students.find((s) => s.clerkId === formData.studentClerkId);
  const endTime = addMinutes(formData.startTime, formData.duration);
  const sessionConfig = SESSION_TYPE_CONFIG[formData.sessionType];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full w-full flex flex-col">

      {/* ── Header ── */}
      <div className="shrink-0 px-5 py-3 border-b border-border/60 flex items-center gap-3 bg-background">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #0891b2, #2563eb)" }}
          >
            <IconCalendarPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Add Event</h1>
            <p className="text-xs text-muted-foreground leading-tight">Schedule a one-time session</p>
          </div>
        </div>
      </div>

      {/* ── Calendar controls ── */}
      <div className="shrink-0 px-5 pt-4">
        <CalendarControls
          calendarTitle={calendarTitle}
          setShowWeekends={setShowWeekends}
          goToPrev={goToPrev}
          goToNext={goToNext}
          goToToday={goToToday}
          isViewDropdownOpen={isViewDropdownOpen}
          setIsViewDropdownOpen={setIsViewDropdownOpen}
          currentView={currentView}
          changeView={changeView}
          showWeekends={showWeekends}
        />
      </div>

      {/* ── Calendar ── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden px-5 pb-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          height="100%"
          locale="en-GB"
          firstDay={1}
          weekends={showWeekends}
          views={{
            timeGridWeek: {
              type: "timeGrid",
              duration: { weeks: 1 },
              buttonText: "Week",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "short", day: "numeric" },
            },
            timeGrid2Day: {
              type: "timeGrid",
              duration: { days: 2 },
              buttonText: "2 days",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
            timeGrid3Day: {
              type: "timeGrid",
              duration: { days: 3 },
              buttonText: "3 days",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
            timeGridDay: {
              type: "timeGrid",
              duration: { days: 1 },
              buttonText: "Day",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
          }}
          allDaySlot={false}
          events={calendarEvents}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          editable={false}
          scrollTime="08:00:00"
          slotDuration="00:15:00"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayMaxEvents={2}
          dayCellContent={(dayInfo: any) => {
            const date = new Date(dayInfo.date);
            const dayNumber = date.getDate();
            if (dayNumber === 1) {
              const monthName = date.toLocaleDateString("en-US", { month: "long" });
              return (
                <div>
                  <p className="inline-flex items-center gap-2">
                    <span>{monthName}</span>
                    <span>{dayNumber}</span>
                  </p>
                </div>
              );
            }
            return dayNumber;
          }}
          dayCellClassNames={(arg: any) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return arg.date < today ? ["opacity-40"] : [];
          }}
          eventContent={(eventInfo: any) => {
            const isAvailable = eventInfo.event.extendedProps.isAvailable as boolean;
            const location = eventInfo.event.extendedProps.location as string;
            const locationLabel = location === "online" ? "Online" : "Classroom";

            if (isAvailable) {
              const color = eventInfo.event.extendedProps.color as string;
              return (
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "5px",
                    overflow: "hidden",
                    position: "relative",
                    boxSizing: "border-box",
                    border: `1.5px dashed ${color}`,
                    background: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 5px,
                      ${color}18 5px,
                      ${color}18 10px
                    )`,
                    cursor: "default",
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0, top: 0, bottom: 0,
                      width: "3px",
                      backgroundColor: color,
                      opacity: 0.5,
                    }}
                  />
                  {/* Text */}
                  <div
                    style={{
                      padding: "5px 8px 5px 10px",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      gap: "1px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color,
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {eventInfo.event.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color,
                        opacity: 0.7,
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {locationLabel} · {eventInfo.timeText}
                    </div>
                  </div>
                </div>
              );
            }

            const color = eventInfo.event.backgroundColor as string;
            return (
              <div
                style={{
                  backgroundColor: color,
                  height: "100%",
                  width: "100%",
                  borderRadius: "5px",
                  overflow: "hidden",
                  position: "relative",
                  boxSizing: "border-box",
                  opacity: 0.6,
                  cursor: "default",
                }}
              >
                {/* Top shine */}
                <div
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "45%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
                {/* Left accent bar */}
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: "3px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                />
                {/* Text */}
                <div
                  style={{
                    padding: "5px 8px 5px 10px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: "1px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      color: "#fff",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {eventInfo.event.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "rgba(255,255,255,0.75)",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {locationLabel} · {eventInfo.timeText}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* ── Session sheet ── */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetTitle className="sr-only">New Session</SheetTitle>
        <SheetDescription className="sr-only">Configure session details</SheetDescription>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden gap-0">

          {/* Header */}
          <div
            className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
            style={{ background: "linear-gradient(150deg, #0891b2 0%, #2563eb 50%, #7c3aed 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <IconCalendar className="h-5 w-5 text-white" />
                </div>
                <Button
                  variant="ghost"
                  onClick={closeSheet}
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                New
              </p>
              <h2 className="text-white text-2xl font-bold leading-tight mb-4">Session</h2>

              {/* Date / time pills */}
              {formData.date && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                    <IconCalendar className="h-3.5 w-3.5 text-white/70" />
                    <span className="text-white text-sm font-semibold">{formatDate(formData.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                    <IconClock className="h-3.5 w-3.5 text-white/70" />
                    <span className="text-white text-sm font-semibold tabular-nums">
                      {formData.startTime}
                      <span className="text-white/55 font-normal"> – {endTime}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/12 rounded-lg px-3 py-2">
                    <span className="text-white/70 text-sm">{formatDuration(formData.duration)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* Mode toggle */}
            <div className="px-5 pt-5 pb-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Event Type
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("available")}
                  className="cursor-pointer flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all border"
                  style={{
                    backgroundColor: mode === "available" ? "rgba(8, 145, 178, 0.07)" : "transparent",
                    borderColor: mode === "available" ? "#0891b2" : "hsl(var(--border))",
                    borderWidth: "1.5px",
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border"
                    style={{
                      borderStyle: "dashed",
                      borderColor: mode === "available" ? "#0891b2" : "hsl(var(--border))",
                      background: mode === "available"
                        ? "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(8,145,178,0.2) 2px, rgba(8,145,178,0.2) 4px)"
                        : "transparent",
                    }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: mode === "available" ? "#0891b2" : undefined }}
                  >
                    Available Slot
                  </span>
                  {mode === "available" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("book")}
                  className="cursor-pointer flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all border"
                  style={{
                    backgroundColor: mode === "book" ? "rgba(37, 99, 235, 0.07)" : "transparent",
                    borderColor: mode === "book" ? "#2563eb" : "hsl(var(--border))",
                    borderWidth: "1.5px",
                  }}
                >
                  <IconUser
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: mode === "book" ? "#2563eb" : undefined }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: mode === "book" ? "#2563eb" : undefined }}
                  >
                    Book Student
                  </span>
                  {mode === "book" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                {mode === "available"
                  ? "Mark this slot as available for students to book."
                  : "Directly book a session for a specific student."}
              </p>
            </div>

            {/* Date & time */}
            <div className="px-5 pt-5 pb-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Date & Time
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    min={todayStr()}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="cursor-pointer w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Start time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="cursor-pointer w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>

              {/* Duration presets */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Duration — {formatDuration(formData.duration)}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((d) => {
                    const active = formData.duration === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration: d })}
                        className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={{
                          backgroundColor: active ? "rgba(37, 99, 235, 0.08)" : "transparent",
                          borderColor: active ? "#2563eb" : "hsl(var(--border))",
                          color: active ? "#2563eb" : undefined,
                        }}
                      >
                        {formatDuration(d)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Session type */}
            <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Session Type
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(SESSION_TYPE_CONFIG) as [keyof typeof SESSION_TYPE_CONFIG, typeof SESSION_TYPE_CONFIG.individual][]).map(
                  ([key, cfg]) => {
                    const active = formData.sessionType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, sessionType: key, color: SESSION_COLORS[key] })
                        }
                        className="cu relative rounded-xl px-3 py-3 text-center transition-all"
                        style={{
                          backgroundColor: active ? cfg.lightColor : "transparent",
                          border: `1.5px solid ${active ? cfg.hex : "hsl(var(--border))"}`,
                        }}
                      >
                        {active && (
                          <div
                            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cfg.hex }}
                          />
                        )}
                        <span
                          className="text-[13px] font-semibold block"
                          style={{ color: active ? cfg.hex : undefined }}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                {sessionConfig.description}
              </p>
            </div>

            {/* Student — only shown when booking for a student */}
            {mode === "book" && <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Student
              </p>
              <Popover open={studentSelectOpen} onOpenChange={setStudentSelectOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="cursor-pointer w-full flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:border-border/80 transition-colors bg-background"
                  >
                    {selectedStudent ? (
                      <span className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
                        >
                          {selectedStudent.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="min-w-0">
                          <span className="font-medium block truncate">{selectedStudent.name}</span>
                          <span className="text-xs text-muted-foreground truncate block">
                            {selectedStudent.email}
                          </span>
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <IconUser className="h-4 w-4" />
                        <span>Select a student…</span>
                      </span>
                    )}
                    <IconSelector className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search students…" />
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => (
                          <CommandItem
                            key={student.clerkId}
                            value={`${student.name} ${student.email}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                studentClerkId: student.clerkId,
                                studentEmail: student.email,
                              });
                              setStudentSelectOpen(false);
                            }}
                          >
                            <IconCheck
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                formData.studentClerkId === student.clerkId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="cursor-pointer flex flex-col min-w-0">
                              <span className="font-medium truncate">{student.name}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {student.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentClerkId: "", studentEmail: "" })}
                  className="cursor-pointer mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <IconX className="h-3 w-3" /> Clear student
                </button>
              )}
            </div>}

            {/* Location */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Location
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(LOCATION_CONFIG) as [string, typeof LOCATION_CONFIG.online][]).map(
                  ([key, cfg]) => {
                    const active = formData.location === key;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, location: key as "online" | "classroom" })
                        }
                        className="cursor-pointer flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all border"
                        style={{
                          backgroundColor: active ? "rgba(37, 99, 235, 0.07)" : "transparent",
                          borderColor: active ? "#2563eb" : "hsl(var(--border))",
                          borderWidth: "1.5px",
                        }}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: active ? "#2563eb" : undefined }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: active ? "#2563eb" : undefined }}
                        >
                          {cfg.label}
                        </span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-border/60 bg-muted/20">
            {error && (
              <p className="text-xs text-destructive mb-3">{error}</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" type="button" className="rounded-lg" onClick={closeSheet} disabled={isPending}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formData.date || !formData.startTime || (mode === "book" && !formData.studentClerkId) || isPending}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #0891b2, #2563eb)" }}
              >
                <IconCheck className="h-4 w-4" />
                {isPending ? "Saving…" : "Save Session"}
              </button>
            </div>
          </div>

        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SessionScheduler;
