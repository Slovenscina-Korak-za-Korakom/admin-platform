/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg as FCEventClickArg } from "@fullcalendar/core";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { SessionData } from "@/components/calendar/types";
import "@/components/calendar/calendar-styles.css";
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
  IconTrash,
  IconClock,
  IconVideo,
  IconBuilding,
  IconUser,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getStudents } from "@/actions/timeblocks";
import type { Student } from "./schedule-sheet";

// ── Types ──────────────────────────────────────────────────────────────────

interface NewSession {
  id: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  duration: number; // minutes
  sessionType: "individual" | "group";
  location: "online" | "classroom";
  studentClerkId?: string;
  studentEmail?: string;
  notes?: string;
  color: string;
}

interface SessionFormData {
  date: string;
  startTime: string;
  duration: number;
  sessionType: "individual" | "group";
  location: "online" | "classroom";
  studentClerkId: string;
  studentEmail: string;
  notes: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SESSION_COLORS = {
  individual: "#3b82f6",
  group: "#8b5cf6",
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
}

const SessionScheduler = ({ data }: SessionSchedulerProps) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Calendar UI state
  const [calendarTitle, setCalendarTitle] = useState(
    new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  );
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [showWeekends, setShowWeekends] = useState(true);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // Session state
  const [newSessions, setNewSessions] = useState<NewSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [studentSelectOpen, setStudentSelectOpen] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    date: "",
    startTime: "09:00",
    duration: 60,
    sessionType: "individual",
    location: "online",
    studentClerkId: "",
    studentEmail: "",
    notes: "",
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

    setEditingSessionId(null);
    setFormData({
      date: dateStr,
      startTime,
      duration,
      sessionType: "individual",
      location: "online",
      studentClerkId: "",
      studentEmail: "",
      notes: "",
      color: SESSION_COLORS.individual,
    });
    setIsSheetOpen(true);
    calendarRef.current?.getApi().unselect();
  }, []);

  // ── Event click ────────────────────────────────────────────────────────

  const handleEventClick = useCallback(
    (clickInfo: FCEventClickArg) => {
      const eventId = clickInfo.event.id;
      if (!eventId.startsWith("new-")) return; // existing sessions are read-only

      const session = newSessions.find((s) => `new-${s.id}` === eventId);
      if (!session) return;

      setEditingSessionId(session.id);
      setFormData({
        date: session.date,
        startTime: session.startTime,
        duration: session.duration,
        sessionType: session.sessionType,
        location: session.location,
        studentClerkId: session.studentClerkId ?? "",
        studentEmail: session.studentEmail ?? "",
        notes: session.notes ?? "",
        color: session.color,
      });
      setIsSheetOpen(true);
    },
    [newSessions]
  );

  // ── Save / delete ──────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (editingSessionId) {
      setNewSessions((prev) =>
        prev.map((s) =>
          s.id === editingSessionId
            ? {
                ...s,
                date: formData.date,
                startTime: formData.startTime,
                duration: formData.duration,
                sessionType: formData.sessionType,
                location: formData.location,
                studentClerkId: formData.studentClerkId || undefined,
                studentEmail: formData.studentEmail || undefined,
                notes: formData.notes || undefined,
                color: formData.color,
              }
            : s
        )
      );
    } else {
      setNewSessions((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          date: formData.date,
          startTime: formData.startTime,
          duration: formData.duration,
          sessionType: formData.sessionType,
          location: formData.location,
          studentClerkId: formData.studentClerkId || undefined,
          studentEmail: formData.studentEmail || undefined,
          notes: formData.notes || undefined,
          color: formData.color,
        },
      ]);
    }
    setIsSheetOpen(false);
    setEditingSessionId(null);
  }, [editingSessionId, formData]);

  const handleDelete = useCallback(() => {
    if (!editingSessionId) return;
    setNewSessions((prev) => prev.filter((s) => s.id !== editingSessionId));
    setIsSheetOpen(false);
    setEditingSessionId(null);
  }, [editingSessionId]);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingSessionId(null);
  }, []);

  // ── Calendar events ────────────────────────────────────────────────────

  const calendarEvents = useMemo(() => {
    const existingEvents = data.map((session) => ({
      id: `existing-${session.id}`,
      title: session.sessionType === "group" ? "Group" : "Individual",
      start: session.startTime,
      end: new Date(new Date(session.startTime).getTime() + session.duration * 60000),
      backgroundColor: session.sessionType === "group" ? SESSION_COLORS.group : SESSION_COLORS.individual,
      borderColor: session.sessionType === "group" ? SESSION_COLORS.group : SESSION_COLORS.individual,
      textColor: "#ffffff",
      extendedProps: {
        isExisting: true,
        sessionType: session.sessionType,
        location: session.location,
      },
    }));

    const newEvents = newSessions.map((session) => {
      const [year, month, day] = session.date.split("-").map(Number);
      const [h, m] = session.startTime.split(":").map(Number);
      const start = new Date(year, month - 1, day, h, m);
      const end = new Date(start.getTime() + session.duration * 60000);
      const student = students.find((s) => s.clerkId === session.studentClerkId);
      const title = student
        ? student.name
        : session.sessionType === "group"
        ? "Group"
        : "Individual";

      return {
        id: `new-${session.id}`,
        title,
        start,
        end,
        backgroundColor: session.color,
        borderColor: session.color,
        textColor: "#ffffff",
        extendedProps: {
          isExisting: false,
          sessionType: session.sessionType,
          location: session.location,
        },
      };
    });

    return [...existingEvents, ...newEvents];
  }, [data, newSessions, students]);

  // ── Derived form values ────────────────────────────────────────────────

  const selectedStudent = students.find((s) => s.clerkId === formData.studentClerkId);
  const endTime = addMinutes(formData.startTime, formData.duration);
  const sessionConfig = SESSION_TYPE_CONFIG[formData.sessionType];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col">

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

        {newSessions.length > 0 && (
          <span className="ml-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 tabular-nums">
            {newSessions.length} unsaved {newSessions.length === 1 ? "session" : "sessions"}
          </span>
        )}

        {/* TODO: connect submit button when backend is ready */}
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
      <div className="flex-1 relative overflow-hidden px-5 pb-4">
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
          eventClick={handleEventClick}
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
          // Visually dim past days in month view
          dayCellClassNames={(arg: any) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return arg.date < today ? ["opacity-40"] : [];
          }}
          eventContent={(eventInfo: any) => {
            const isExisting = eventInfo.event.extendedProps.isExisting as boolean;
            const color = eventInfo.event.backgroundColor as string;
            const location = eventInfo.event.extendedProps.location as string;
            const locationLabel = location === "online" ? "Online" : "Classroom";

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
                  opacity: isExisting ? 0.6 : 1,
                  cursor: isExisting ? "default" : "pointer",
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
                    backgroundColor: isExisting ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)",
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
                    {isExisting && " · existing"}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* ── Session sheet ── */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetTitle className="sr-only">{editingSessionId ? "Edit Session" : "New Session"}</SheetTitle>
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
                <button
                  onClick={closeSheet}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>

              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                {editingSessionId ? "Edit" : "New"}
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
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Start time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
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
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
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
              <div className="grid grid-cols-2 gap-2">
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
                        className="relative rounded-xl px-3 py-3 text-center transition-all"
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

            {/* Student */}
            <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Student{" "}
                <span className="normal-case tracking-normal font-normal text-muted-foreground/60">
                  (optional)
                </span>
              </p>
              <Popover open={studentSelectOpen} onOpenChange={setStudentSelectOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:border-border/80 transition-colors bg-background"
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
                            <div className="flex flex-col min-w-0">
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
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <IconX className="h-3 w-3" /> Clear student
                </button>
              )}
            </div>

            {/* Location */}
            <div className="px-5 py-4 border-b border-border/60">
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
                        className="flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all border"
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

            {/* Notes */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Notes{" "}
                <span className="normal-case tracking-normal font-normal text-muted-foreground/60">
                  (optional)
                </span>
              </p>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or special instructions…"
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-border/60 bg-muted/20">
            <div className="flex items-center gap-2">
              {editingSessionId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" type="button" className="rounded-lg" onClick={closeSheet}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!formData.date || !formData.startTime}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #0891b2, #2563eb)" }}
                >
                  <IconCheck className="h-4 w-4" />
                  Save Session
                </button>
              </div>
            </div>
          </div>

        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SessionScheduler;