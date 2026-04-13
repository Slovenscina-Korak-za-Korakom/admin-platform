/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {DateSelectArg} from "@fullcalendar/core";
import {CalendarControls} from "@/components/calendar/calendar-controls";
import {AvailableSlotData, SessionData} from "@/components/calendar/types";
import "@/components/calendar/calendar-styles.css";
import {useCalendarResize} from "@/hooks/use-calendar-resize";
import {Sheet, SheetContent, SheetDescription, SheetTitle,} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command";
import {
  IconBuilding,
  IconCalendar,
  IconCalendarPlus,
  IconCheck,
  IconClock,
  IconSelector,
  IconUser,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import {createAvailableSlot, createOneTimeSession, getStudents} from "@/actions/timeblocks";
import {getSessionColor, hexToRgba} from "@/lib/session-colors";
import type {Student} from "./schedule-sheet";
import {DatePicker} from "@/components/ui/date-picker";
import {TimePicker} from "@/components/ui/time-picker";
import {AnimatedButtonGroup, AnimatedButtonGroupItem} from "@/components/ui/animated-button-group";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

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
  individual: getSessionColor("individual"),
  group: getSessionColor("group"),
  test: getSessionColor("test"),
};

const SESSION_TYPE_CONFIG = {
  individual: {
    label: "Individual",
    hex: SESSION_COLORS.individual,
    lightColor: hexToRgba(SESSION_COLORS.individual,0.07),
    description: "One-on-one personalized sessions tailored to individual learning needs.",
  },
  group: {
    label: "Group",
    hex: SESSION_COLORS.group,
    lightColor: hexToRgba(SESSION_COLORS.group,0.07),
    description: "Interactive sessions with multiple participants for collaborative learning.",
  },
  test: {
    label: "Test",
    hex: SESSION_COLORS.test,
    lightColor: hexToRgba(SESSION_COLORS.test,0.07),
    description: "A one-time trial session for new students to experience the teaching style.",
  },
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
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60) % 24}`.padStart(2, "0") + ":" + `${total % 60}`.padStart(2, "0");
};


// ── Component ──────────────────────────────────────────────────────────────

interface SessionSchedulerProps {
  data: SessionData[];
  availableSlots: AvailableSlotData[];
}

const SessionScheduler = ({data, availableSlots}: SessionSchedulerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useCalendarResize(calendarRef);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Calendar UI state
  const [calendarTitle, setCalendarTitle] = useState(
    new Date().toLocaleDateString("en-GB", {month: "long", year: "numeric"})
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
      const color = getSessionColor(session.sessionType)

      return {
        id: `existing-${session.id}`,
        title: session.sessionType,
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

      return {
        id: `available-${slot.id}`,
        title: slot.sessionType,
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
            style={{background: "linear-gradient(135deg, #0891b2, #2563eb)"}}
          >
            <IconCalendarPlus className="h-5 w-5 text-white"/>
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
              duration: {weeks: 1},
              buttonText: "Week",
              allDaySlot: false,
              dayHeaderFormat: {weekday: "short", day: "numeric"},
            },
            timeGrid2Day: {
              type: "timeGrid",
              duration: {days: 2},
              buttonText: "2 days",
              allDaySlot: false,
              dayHeaderFormat: {weekday: "long", day: "numeric"},
            },
            timeGrid3Day: {
              type: "timeGrid",
              duration: {days: 3},
              buttonText: "3 days",
              allDaySlot: false,
              dayHeaderFormat: {weekday: "long", day: "numeric"},
            },
            timeGridDay: {
              type: "timeGrid",
              duration: {days: 1},
              buttonText: "Day",
              allDaySlot: false,
              dayHeaderFormat: {weekday: "long", day: "numeric"},
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
          slotLabelFormat={{hour: "2-digit", minute: "2-digit", hour12: false}}
          dayMaxEvents={2}
          dayCellContent={(dayInfo: any) => {
            const date = new Date(dayInfo.date);
            const dayNumber = date.getDate();
            if (dayNumber === 1) {
              const monthName = date.toLocaleDateString("en-US", {month: "long"});
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
                        textTransform: "capitalize"
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
                      textTransform: "capitalize"
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
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        if (!open) closeSheet();
      }}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden gap-0">
          <SheetTitle className="sr-only">New Session</SheetTitle>
          <SheetDescription className="sr-only">Configure session details</SheetDescription>

          {/* Header */}
          <div
            className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
            style={{background: "linear-gradient(150deg, #0891b2 0%, #2563eb 50%, #7c3aed 100%)"}}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5"/>
            <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/5"/>

            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <IconCalendar className="h-5 w-5 text-white"/>
                </div>
                <div className="flex flex-col items-center justify-start">
                  <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                    New
                  </p>
                  <h2 className="text-white text-2xl font-bold leading-tight mb-4">Session</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={closeSheet}
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  <IconX className="h-4 w-4"/>
                </Button>
              </div>

              {/* Date / time pills */}
              {formData.date && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                    <IconCalendar className="h-3.5 w-3.5 text-white/70"/>
                    <span className="text-white text-sm font-semibold">{formatDate(formData.date)}</span>
                  </div>
                  <div className="flex flex-1 items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                    <IconClock className="h-3.5 w-3.5 text-white/70"/>
                    <span className="text-white text-sm font-semibold tabular-nums">
                      {formData.startTime}
                      <span className="text-white/55 font-normal"> – {endTime}</span>
                    </span>
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
              <AnimatedButtonGroup value={mode} onChange={(v) => setMode(v as "available" | "book")}>
                <AnimatedButtonGroupItem value={"available"} hex={"#0891b2"} lightColor={"rgba(8, 145, 178, 0.07)"}>
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
                  Available Slot
                </AnimatedButtonGroupItem>
                <AnimatedButtonGroupItem value={"book"} hex={"#2563eb"} lightColor={"rgba(37, 99, 235, 0.07)"}>
                  <IconUser
                    className="h-3.5 w-3.5 shrink-0"
                    style={{color: mode === "book" ? "#2563eb" : undefined}}
                  />
                  Book Student
                </AnimatedButtonGroupItem>
              </AnimatedButtonGroup>
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
                  <DatePicker
                    value={formData.date}
                    onChange={(v) => setFormData({...formData, date: v})}
                    disablePast
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Start time</label>
                  <TimePicker
                    value={formData.startTime}
                    onChange={(v) => setFormData({...formData, startTime: v})}
                  />
                </div>
              </div>

              {/* Duration presets */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Duration — {formatDuration(formData.duration)}
                </label>
                <AnimatedButtonGroup
                  value={formData.duration.toString()}
                  onChange={(v) => setFormData({...formData, duration: parseInt(v)})}
                >
                  {DURATION_PRESETS.map((d) => (
                    <AnimatedButtonGroupItem
                      key={d}
                      value={d.toString()}
                      hex="#2563eb"
                      lightColor="rgba(37,99,235,0.08)"
                      className="py-0 text-xs"
                    >
                      {formatDuration(d)}
                    </AnimatedButtonGroupItem>
                  ))}
                </AnimatedButtonGroup>
              </div>
            </div>

            {/* Session type */}
            <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Session Type
              </p>
              <AnimatedButtonGroup
                value={formData.sessionType}
                showDot
                onChange={(v) => {
                  const key = v as keyof typeof SESSION_TYPE_CONFIG;
                  setFormData({...formData, sessionType: key, color: SESSION_COLORS[key]});
                }}
              >
                {(Object.entries(SESSION_TYPE_CONFIG) as [keyof typeof SESSION_TYPE_CONFIG, typeof SESSION_TYPE_CONFIG.individual][]).map(([key, cfg]) => (
                  <AnimatedButtonGroupItem key={key} value={key} hex={cfg.hex} lightColor={cfg.lightColor}>
                    {cfg.label}
                  </AnimatedButtonGroupItem>
                ))}
              </AnimatedButtonGroup>
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
                    className="cursor-pointer w-full flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm transition-all hover:border-border hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  >
                    {selectedStudent ? (
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Avatar>
                          <AvatarImage src={selectedStudent.image} alt={`${selectedStudent.name}'s profile picture`}/>
                          <AvatarFallback
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-semibold"
                            style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
                          >
                            {selectedStudent.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex flex-col items-start">
                          <span className="text-sm font-medium text-foreground truncate">{selectedStudent.name}</span>
                          <span
                            className="text-[11px] text-muted-foreground truncate leading-tight">{selectedStudent.email}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <IconUser className="h-3.5 w-3.5"/>
                        <span>Select a student…</span>
                      </span>
                    )}
                    <IconSelector className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0"/>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" side="bottom" align="center">
                  <Command className="w-80 max-h-48">
                    <CommandInput placeholder="Search…"/>
                    <CommandList>
                      <CommandEmpty>
                        <div className="flex flex-row items-center px-4 gap-1.5">
                          <IconUser size={16} className="text-muted-foreground/40"/>
                          <p className="text-sm text-muted-foreground">No students found</p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => {
                          const isSelected = formData.studentClerkId === student.clerkId;
                          return (
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
                              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                            >
                              <Avatar>
                                <AvatarImage src={student.image} alt={`${student.name}'s profile picture`}/>
                                <AvatarFallback
                                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-semibold"
                                  style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
                                >
                                  {student.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium truncate">{student.name}</span>
                                <span
                                  className="text-[11px] text-muted-foreground truncate leading-tight">{student.email}</span>
                              </div>
                              {isSelected && <IconCheck className="h-3.5 w-3.5 text-blue-500 shrink-0"/>}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, studentClerkId: "", studentEmail: ""})}
                  className="cursor-pointer mt-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 transition-colors"
                >
                  <IconX className="h-3 w-3"/> Clear
                </button>
              )}
            </div>}

            {/* Location */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Location
              </p>
              <AnimatedButtonGroup
                value={formData.location}
                onChange={(v) => setFormData({...formData, location: v as "online" | "classroom"})}
              >
                <AnimatedButtonGroupItem value="online" hex="#0891b2" lightColor="rgba(8,145,178,0.07)">
                  <IconVideo className="h-3.5 w-3.5"/>
                  Online
                </AnimatedButtonGroupItem>
                <AnimatedButtonGroupItem value="classroom" hex="#7c3aed" lightColor="rgba(124,58,237,0.07)">
                  <IconBuilding className="h-3.5 w-3.5"/>
                  Classroom
                </AnimatedButtonGroupItem>
              </AnimatedButtonGroup>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-border/60 bg-muted/20">
            {error && (
              <p className="text-xs text-destructive mb-3">{error}</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={!formData.date || !formData.startTime || (mode === "book" && !formData.studentClerkId) || isPending}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background: "linear-gradient(135deg, #0891b2, #2563eb)"}}
              >
                <IconCheck className="h-4 w-4"/>
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
