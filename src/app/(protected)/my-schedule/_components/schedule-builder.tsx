"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {DateSelectArg, EventClickArg} from "@fullcalendar/core";
import type {EventDropArg, EventResizeArg} from "@/components/calendar/types";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
import {IconCheck, IconLoader2, IconAlertTriangle} from "@tabler/icons-react";
import {ScheduleSheet} from "./schedule-sheet";
import {ScheduleConfirmDialog} from "./schedule-confirm-dialog";
import {toast} from "sonner";
import {createSchedule, getUserSchedule, getStudents, removeRegularScheduleBySlot} from "@/actions/timeblocks";
import type {Student} from "./schedule-sheet";
import "@/components/calendar/calendar-styles.css";

interface TimeSlot {
  id: string;
  startTime: string;
  duration: number;
  sessionType: string;
  location: string;
  description?: string;
  color?: string;
  email?: string;
  studentClerkId?: string;
}

interface DaySchedule {
  day: number;
  timeSlots: TimeSlot[];
}

export interface CalendarEvent {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  duration: number;
  sessionType: string;
  location: string;
  description?: string;
  color: string;
  email?: string;
  studentClerkId?: string;
}

export interface SlotDiff {
  added: CalendarEvent[];
  removed: CalendarEvent[];
  modified: {before: CalendarEvent; after: CalendarEvent}[];
}

// Convert a UTC "HH:mm" string to the browser's local "HH:mm"
export const utcTimeToLocal = (utcTime: string): string => {
  const [h, m] = utcTime.split(":").map(Number);
  const date = new Date();
  date.setUTCHours(h, m, 0, 0);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

// Convert a local "HH:mm" string to UTC "HH:mm"
const localTimeToUtc = (localTime: string): string => {
  const [h, m] = localTime.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
};

const getDefaultColorForSessionType = (sessionType: string): string => {
  const defaults: Record<string, string> = {
    individual: "#3b82f6", // Blue for individual
    group: "#10b981", // Green for a group
    regulars: "#8b5cf6", // Purple for regulars
  };
  return defaults[sessionType] || "#3b82f6"; // Default to blue
};

const ScheduleBuilder = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: number;
    startTime: string;
    duration: number;
  } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<{
    startTime: string;
    duration: number;
    sessionType: string;
    location: string;
    description: string;
    color: string;
    email: string;
    studentClerkId: string;
  }>({
    startTime: "09:00",
    duration: 60,
    sessionType: "individual",
    location: "online",
    description: "",
    color: "#3b82f6",
    email: "",
    studentClerkId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [originalEvents, setOriginalEvents] = useState<CalendarEvent[] | null>(null);
  const [scheduleDiff, setScheduleDiff] = useState<SlotDiff | null>(null);
  const [confirmedRemovals, setConfirmedRemovals] = useState<Set<string>>(new Set());
  const [pendingDeleteRegular, setPendingDeleteRegular] = useState<CalendarEvent | null>(null);

  // Convert DaySchedule[] to CalendarEvent[]
  const convertDaySchedulesToEvents = useCallback(
    (daySchedules: DaySchedule[]): CalendarEvent[] => {
      const calendarEvents: CalendarEvent[] = [];

      daySchedules.forEach((daySchedule) => {
        daySchedule.timeSlots.forEach((timeSlot) => {
          calendarEvents.push({
            id: timeSlot.id,
            dayOfWeek: daySchedule.day,
            startTime: utcTimeToLocal(timeSlot.startTime), // Stored as UTC, display in browser local time
            duration: timeSlot.duration,
            sessionType: timeSlot.sessionType,
            location: timeSlot.location,
            description: timeSlot.description,
            color:
              timeSlot.color ||
              getDefaultColorForSessionType(timeSlot.sessionType),
            email: timeSlot.email,
            studentClerkId: timeSlot.studentClerkId,
          });
        });
      });

      return calendarEvents;
    },
    []
  );

  // Load the existing schedule and students on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [scheduleResult, studentsResult] = await Promise.all([
          getUserSchedule(),
          getStudents(),
        ]);

        if (scheduleResult.status === 200 && scheduleResult.data) {
          const daySchedules = scheduleResult.data as DaySchedule[];
          const loadedEvents = convertDaySchedulesToEvents(daySchedules);
          setEvents(loadedEvents);
          setOriginalEvents(loadedEvents);
        } else if (scheduleResult.status === 404) {
          // No schedule found, start with an empty state
          setEvents([]);
        } else {
          toast.error("Failed to load schedule");
        }

        if (studentsResult.status === 200) {
          setStudents(studentsResult.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load schedule");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [convertDaySchedulesToEvents]);

  const daysOfWeek = [
    {value: 1, label: "Monday", short: "Mon"},
    {value: 2, label: "Tuesday", short: "Tue"},
    {value: 3, label: "Wednesday", short: "Wed"},
    {value: 4, label: "Thursday", short: "Thu"},
    {value: 5, label: "Friday", short: "Fri"},
    {value: 6, label: "Saturday", short: "Sat"},
    {value: 0, label: "Sunday", short: "Sun"},
  ];

  // Get a reference week date (we'll use the current week, but dates don't matter)
  const getReferenceDate = useCallback(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(today.setDate(diff));
  }, []);

  // Convert day of the week (0-6) to a date in the reference week
  const getDateForDayOfWeek = useCallback(
    (dayOfWeek: number, startTime: string) => {
      const referenceMonday = getReferenceDate();
      // Convert day of week: 0=Sunday, 1=Monday, etc.
      // Reference Monday is day 1, so we need to adjust
      const dayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days after Monday
      const date = new Date(referenceMonday);
      date.setDate(date.getDate() + dayDiff);

      // Add the time
      const [hours, minutes] = startTime.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);

      return date;
    },
    [getReferenceDate]
  );

  // Convert date to day of week (0-6) and time string
  const getDayAndTimeFromDate = useCallback((date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const startTime = `${hours}:${minutes}`;
    return {dayOfWeek, startTime};
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const {dayOfWeek, startTime} = getDayAndTimeFromDate(selectInfo.start);

    // Calculate duration from the selected range
    const durationMs = selectInfo.end.getTime() - selectInfo.start.getTime();
    const durationMinutes = Math.round(durationMs / 60000); // Convert to minutes

    // Ensure minimum duration of 15 minutes
    const finalDuration = Math.max(15, Math.round(durationMinutes / 15) * 15); // Round to the nearest 15 minutes

    // Check if there's already an event at this time slot
    const existingEvent = events.find(
      (e) => e.dayOfWeek === dayOfWeek && e.startTime === startTime
    );

    if (existingEvent) {
      // Edit existing event
      setEditingEvent(existingEvent);
      setFormData({
        startTime: existingEvent.startTime,
        duration: existingEvent.duration,
        sessionType: existingEvent.sessionType,
        location: existingEvent.location,
        description: existingEvent.description || "",
        color: existingEvent.color,
        email: existingEvent.email || "",
        studentClerkId: existingEvent.studentClerkId || "",
      });
      setSelectedSlot({
        dayOfWeek,
        startTime: existingEvent.startTime,
        duration: existingEvent.duration,
      });
    } else {
      // Create a new event-duration is set by drag selection
      setEditingEvent(null);
      const defaultColor = getDefaultColorForSessionType("individual");
      setFormData({
        startTime,
        duration: finalDuration,
        sessionType: "individual",
        location: "online",
        description: "",
        color: defaultColor,
        email: "",
        studentClerkId: "",
      });
      setSelectedSlot({
        dayOfWeek,
        startTime,
        duration: finalDuration,
      });
    }

    setIsSheetOpen(true);

    // Unselect the date range
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    const event = events.find((e) => e.id === eventId);

    if (event) {
      setEditingEvent(event);
      setFormData({
        startTime: event.startTime,
        duration: event.duration,
        sessionType: event.sessionType as string,
        location: event.location,
        description: event.description || "",
        color: event.color,
        email: event.email || "",
        studentClerkId: event.studentClerkId || "",
      });
      setSelectedSlot({
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        duration: event.duration,
      });
      setIsSheetOpen(true);
    }
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;

    if (!newStart) {
      dropInfo.revert();
      return;
    }

    const {dayOfWeek, startTime} = getDayAndTimeFromDate(newStart);

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
            ...e,
            dayOfWeek,
            startTime,
          }
          : e
      )
    );

    toast.success("Event moved");
  };

  const handleEventResize = (resizeInfo: EventResizeArg) => {
    const eventId = resizeInfo.event.id;
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;

    if (!newStart || !newEnd) {
      resizeInfo.revert();
      return;
    }

    // Calculate new duration
    const durationMs = newEnd.getTime() - newStart.getTime();
    const durationMinutes = Math.max(15, Math.round(durationMs / 60000));
    // Round to the nearest 15 minutes
    const finalDuration = Math.round(durationMinutes / 15) * 15;

    const {dayOfWeek, startTime} = getDayAndTimeFromDate(newStart);

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
            ...e,
            dayOfWeek,
            startTime,
            duration: finalDuration,
          }
          : e
      )
    );

    toast.success("Event resized");
  };

  const handleSaveSlot = () => {
    if (!selectedSlot) return;

    // Validate
    if (
      !formData.startTime ||
      !formData.duration ||
      !formData.sessionType ||
      !formData.location
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.sessionType === "regulars" && (!formData.email || !formData.studentClerkId)) {
      toast.error("Please select a student for regulars sessions");
      return;
    }

    if (editingEvent) {
      // Update existing event
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? {
              ...e,
              startTime: formData.startTime,
              duration: formData.duration,
              sessionType: formData.sessionType,
              location: formData.location,
              description: formData.description,
              color: formData.color,
              email: formData.sessionType === "regulars" ? formData.email : undefined,
              studentClerkId: formData.sessionType === "regulars" ? formData.studentClerkId : undefined,
            }
            : e
        )
      );
      toast.success("Time slot updated");
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        dayOfWeek: selectedSlot.dayOfWeek,
        startTime: formData.startTime,
        duration: formData.duration,
        sessionType: formData.sessionType,
        location: formData.location,
        description: formData.description,
        color: formData.color,
        email: formData.sessionType === "regulars" ? formData.email : undefined,
        studentClerkId: formData.sessionType === "regulars" ? formData.studentClerkId : undefined,
      };
      setEvents((prev) => [...prev, newEvent]);
      toast.success("Time slot added");
    }

    setIsSheetOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  const handleDeleteSlot = () => {
    if (!editingEvent) return;

    const isEstablishedRegular =
      editingEvent.sessionType === "regulars" &&
      (originalEvents?.some((e) => e.id === editingEvent.id) ?? false);

    if (isEstablishedRegular) {
      setPendingDeleteRegular(editingEvent);
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
    toast.success("Time slot deleted");
    setIsSheetOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  const confirmDeleteRegular = () => {
    if (!pendingDeleteRegular) return;
    setEvents((prev) => prev.filter((e) => e.id !== pendingDeleteRegular.id));
    toast.success("Regular session removed");
    setPendingDeleteRegular(null);
    setIsSheetOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  const handleCancelSheet = () => {
    setIsSheetOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  // Convert calendar events to DaySchedule[] format
  const convertToDaySchedules = useCallback((): DaySchedule[] => {
    const schedulesMap = new Map<number, TimeSlot[]>();

    events.forEach((event) => {
      const timeSlot: TimeSlot = {
        id: event.id,
        startTime: localTimeToUtc(event.startTime), // Convert browser local time → UTC before saving
        duration: event.duration,
        sessionType: event.sessionType as string,
        location: event.location,
        description: event.description,
        color: event.color,
        email: event.email,
        studentClerkId: event.studentClerkId,
      };

      if (!schedulesMap.has(event.dayOfWeek)) {
        schedulesMap.set(event.dayOfWeek, []);
      }
      schedulesMap.get(event.dayOfWeek)!.push(timeSlot);
    });

    // Convert map to array and sort by day
    return Array.from(schedulesMap.entries())
      .map(([day, timeSlots]) => ({
        day,
        timeSlots: timeSlots.sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        ),
      }))
      .sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day));
  }, [events]);

  const computeDiff = useCallback((): SlotDiff | null => {
    if (!originalEvents) return null;

    const originalMap = new Map(originalEvents.map((e) => [e.id, e]));
    const currentMap = new Map(events.map((e) => [e.id, e]));

    const rawAdded = events.filter((e) => !originalMap.has(e.id));
    const rawRemoved = originalEvents.filter((e) => !currentMap.has(e.id));
    const modified: {before: CalendarEvent; after: CalendarEvent}[] = [];

    for (const current of events) {
      const original = originalMap.get(current.id);
      if (!original) continue;
      if (
        original.dayOfWeek !== current.dayOfWeek ||
        original.startTime !== current.startTime ||
        original.duration !== current.duration ||
        original.sessionType !== current.sessionType ||
        original.location !== current.location ||
        (original.description ?? "") !== (current.description ?? "") ||
        (original.email ?? "") !== (current.email ?? "") ||
        (original.studentClerkId ?? "") !== (current.studentClerkId ?? "")
      ) {
        modified.push({before: original, after: current});
      }
    }

    // If a slot was deleted and re-added with identical content (just a new ID),
    // cancel it out of both buckets so it isn't treated as a change.
    const sameContent = (a: CalendarEvent, b: CalendarEvent) =>
      a.dayOfWeek === b.dayOfWeek &&
      a.startTime === b.startTime &&
      a.duration === b.duration &&
      a.sessionType === b.sessionType &&
      a.location === b.location &&
      (a.email ?? "") === (b.email ?? "") &&
      (a.studentClerkId ?? "") === (b.studentClerkId ?? "") &&
      (a.description ?? "") === (b.description ?? "");

    const remainingRemoved = [...rawRemoved];
    const added = rawAdded.filter((addedSlot) => {
      const matchIdx = remainingRemoved.findIndex((r) => sameContent(addedSlot, r));
      if (matchIdx !== -1) {
        remainingRemoved.splice(matchIdx, 1);
        return false;
      }
      return true;
    });
    const removed = remainingRemoved;

    if (added.length === 0 && removed.length === 0 && modified.length === 0) return null;
    return {added, removed, modified};
  }, [originalEvents, events]);

  const handleSubmitClick = () => {
    const daySchedules = convertToDaySchedules();

    if (daySchedules.length === 0) {
      toast.error("No schedule data to submit");
      return;
    }

    const diff = computeDiff();
    setScheduleDiff(diff);
    setConfirmedRemovals(
      new Set(
        (diff?.removed ?? [])
          .filter((e) => e.sessionType === "regulars")
          .map((e) => e.id)
      )
    );
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const daySchedules = convertToDaySchedules();

    const newRegularSlotIds: string[] | undefined = originalEvents !== null
      ? (scheduleDiff?.added ?? [])
          .filter((e) => e.sessionType === "regulars")
          .map((e) => e.id)
      : undefined;

    setIsSubmitting(true);
    setIsConfirmDialogOpen(false);

    try {
      const result = await createSchedule(daySchedules, newRegularSlotIds);

      if (result?.success) {
        // Remove regular sessions that the user confirmed
        if (scheduleDiff) {
          for (const slot of scheduleDiff.removed) {
            if (slot.sessionType !== "regulars" || !confirmedRemovals.has(slot.id) || !slot.email) continue;
            await removeRegularScheduleBySlot(slot.email, slot.dayOfWeek, localTimeToUtc(slot.startTime));
          }
        }
        toast.success("Schedule saved successfully!");
      } else {
        toast.error(result?.message || "Failed to save schedule");
      }
    } catch (error) {
      console.error("Error submitting schedule:", error);
      toast.error("Failed to save schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const startDate = getDateForDayOfWeek(event.dayOfWeek, event.startTime);
      const endDate = new Date(startDate.getTime() + event.duration * 60000);

      const title = event.sessionType === "regulars" && event.email
        ? `${event.sessionType} (${event.email}) • ${event.location}`
        : `${event.sessionType} • ${event.location}`;

      return {
        id: event.id,
        title,
        start: startDate,
        end: endDate,
        backgroundColor: event.color,
        borderColor: event.color,
        textColor: "#ffffff",
        extendedProps: {
          sessionType: event.sessionType,
          location: event.location,
          description: event.description,
          color: event.color,
        },
      };
    });
  }, [events, getDateForDayOfWeek]);

  const totalSlots = events.length;

  const getDayLabel = (dayValue: number) => {
    return (
      daysOfWeek.find((d) => d.value === dayValue)?.label || dayValue.toString()
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col relative">
      {/* Floating Submit Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={handleSubmitClick}
          disabled={totalSlots === 0 || isSubmitting || isLoading}
          size="sm"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
              Saving...
            </>
          ) : (
            <>
              <IconCheck className="h-4 w-4 mr-2"/>
              Submit Schedule
            </>
          )}
        </Button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <IconLoader2 className="h-8 w-8 animate-spin text-foreground"/>
            <p className="text-sm text-muted-foreground">Loading schedule...</p>
          </div>
        </div>
      )}

      {/* Full Screen Calendar */}
      <FullCalendar
        ref={calendarRef}
        locale="en-GB"
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        height="100%"
        allDaySlot={false}
        editable={!isLoading}
        eventStartEditable={!isLoading}
        eventDurationEditable={!isLoading}
        eventResizableFromStart={!isLoading}
        eventOverlap={true}
        selectable={!isLoading}
        selectMirror={true}
        dayMaxEvents={false}
        weekends={true}
        firstDay={1} // Monday
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        slotLabelFormat={{hour: "2-digit", minute: "2-digit", hour12: false}}
        slotDuration="00:15:00"
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        events={calendarEvents}
        selectConstraint={{
          start: "00:00",
          end: "24:00",
        }}
        dayHeaderFormat={{weekday: "short"}}
        eventContent={(eventInfo) => {
          return (
            <div
              style={{
                backgroundColor: eventInfo.event.backgroundColor || "#3b82f6",
                color: "#ffffff",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                fontWeight: 500,
                fontSize: "0.875rem",
                boxSizing: "border-box",
              }}
            >
              <div style={{width: "100%", overflow: "hidden"}}>
                <div
                  style={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {eventInfo.event.title}
                </div>
                <div style={{fontSize: "0.75rem", opacity: 0.9}}>
                  {eventInfo.timeText}
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Add/Edit Sheet */}
      <ScheduleSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingEvent={editingEvent}
        selectedSlot={selectedSlot}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        onCancel={handleCancelSheet}
        getDayLabel={getDayLabel}
        students={students}
      />

      {/* Confirmation Dialog with Summary */}
      {/* ── Regular session delete warning ── */}
      <Dialog
        open={pendingDeleteRegular !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteRegular(null); }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogTitle className="flex items-center gap-2 text-base">
            <IconAlertTriangle className="h-5 w-5 text-amber-500 shrink-0"/>
            Remove regular session?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {pendingDeleteRegular?.email && (
              <span className="block font-medium text-foreground mb-1">
                {pendingDeleteRegular.email}
              </span>
            )}
            This session will be removed from your schedule. You can still notify the student
            from the confirmation dialog when you save.
            This action cannot be undone without re-adding the session manually.
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPendingDeleteRegular(null)}>
              Keep session
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRegular}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleConfirmDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        daySchedules={convertToDaySchedules()}
        totalSlots={totalSlots}
        onConfirm={handleConfirmSubmit}
        getDayLabel={getDayLabel}
        diff={scheduleDiff}
        confirmedRemovals={confirmedRemovals}
        onToggleRemoval={(id) =>
          setConfirmedRemovals((prev) => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
          })
        }
      />
    </div>
  );
};

export default ScheduleBuilder;
