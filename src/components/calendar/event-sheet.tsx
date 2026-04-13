"use client";

import React, {useEffect, useMemo, useState, useTransition} from "react";
import {Sheet, SheetContent, SheetDescription, SheetTitle} from "@/components/ui/sheet";
import {
  IconBrandZoom,
  IconBuilding,
  IconCalendar,
  IconClock,
  IconTarget,
  IconTrash,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import {SessionData, StudentInfo} from "@/components/calendar/types";
import {CancelSessionDialog} from "./cancel-session-dialog";
import {RemoveScheduleDialog} from "./remove-schedule-dialog";
import {cancelSession} from "@/actions/timeblocks";
import {useRouter} from "next/navigation";
import {getSessionColor, hexToRgba} from "@/lib/session-colors";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fmt24 = (d: Date) =>
  `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

const fmtDateFull = (d: Date) =>
  d.toLocaleDateString("en-GB", {weekday: "long", day: "numeric", month: "long", year: "numeric"});

const fmtToday = (d: Date = new Date()) =>
  d.toLocaleDateString("en-GB", {weekday: "short", day: "numeric", month: "short", year: "numeric"});

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const GOAL_LABELS: Record<string, { label: string; icon: string }> = {
  "integration": {label: "Integration into the environment", icon: "🇸🇮"},
  "national exam": {label: "National exam", icon: "📝"},
  "school": {label: "Matura / NPZ / School", icon: "🎓"},
  "speaking": {label: "Speaking Practice", icon: "💬"},
};

type EventSheetProps = {
  isEventSheetOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: (SessionData & { studentInfo: StudentInfo | null }) | null;
  slotId?: number | null;
  onDeleteSlot?: (slotId: number) => Promise<{ message: string; status: number }>;
};


export const EventSheet = ({
                             isEventSheetOpen,
                             onOpenChange,
                             selectedSession: event,
                             slotId,
                             onDeleteSlot,
                           }: EventSheetProps) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletingSlot, setDeletingSlot] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  const student = event?.studentInfo ?? null;
  const isAvailableSlot = event?.status === "available";
  const isRegularsSession = event?.sessionType === "regular";
  const isFutureSession = event ? new Date(event.startTime) > new Date() : false;

  const startTime = event ? new Date(event.startTime) : null;
  const endTime = startTime ? new Date(startTime.getTime() + (event?.duration ?? 0) * 60000) : null;
  const isPast = startTime ? startTime < new Date() : false;

  const initials = student?.name
    ? student.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const showFooter =
    isAvailableSlot ||
    (isRegularsSession && isFutureSession) ||
    (event?.status === "booked" && isFutureSession && !isRegularsSession);

  useEffect(() => {
    if (!event?.startTime || new Date(event.startTime) <= new Date()) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [event?.startTime]);

  const timeLeft = useMemo(() => {
    if (!event?.startTime) return null;
    const diffMs = new Date(event.startTime).getTime() - currentTime.getTime();
    if (diffMs <= 0) return "Starting now";

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const seconds = diffSeconds % 60;
    const minutes = diffMinutes % 60;
    const hours = diffHours % 24;

    if (diffDays > 0) return hours > 0 ? `${diffDays}d ${hours}h ${minutes}m` : `${diffDays}d ${minutes}m`;
    if (diffHours > 0) return `${diffHours}h ${minutes}m`;
    if (diffMinutes > 0) return `${diffMinutes}m ${seconds}s`;
    return `${diffSeconds}s`;
  }, [event?.startTime, currentTime]);


  const onDeleteAvailableSlot = () => {
    if (!slotId || !onDeleteSlot) return;
    setDeletingSlot(true);
    startTransition(async () => {
      const result = await onDeleteSlot(slotId);
      setDeletingSlot(false);
      if (result.status === 200) {
        router.refresh();
        onOpenChange(false);
      }
    });
  };

  const onCancelSession = () => {
    if (!event?.id) return;
    startTransition(async () => {
      const result = await cancelSession(event.id);
      if (result.status === 200) {
        router.refresh();
        onOpenChange(false);
      } else {
        console.error("Failed to cancel session:", result.message);
      }
    });
  };

  const color = getSessionColor(event?.sessionType ?? "individual");

  return (
    <>
      <Sheet open={isEventSheetOpen} onOpenChange={onOpenChange}>
        <SheetContent
          showCloseButton={false}
          className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden gap-0 bg-background"
        >
          <SheetTitle className="sr-only">Session Details</SheetTitle>
          <SheetDescription className="sr-only">View session information</SheetDescription>

          {/* ── Gradient header ── */}
          <div
            className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
            style={{background: "linear-gradient(150deg, #2563eb 0%, #7c3aed 60%, #6d28d9 100%)"}}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"/>
            <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none"/>

            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <IconCalendar className="h-5 w-5 text-white"/>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Session</p>
                  <h2 className="text-white text-xl font-bold leading-tight">
                    {isAvailableSlot ? "Available Slot" : (student?.name ?? "Unknown student")}
                  </h2>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 cursor-pointer rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <IconX className="h-4 w-4"/>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                  <IconCalendar className="h-3.5 w-3.5 text-white/70"/>
                  <span className="text-white text-sm font-semibold truncate">
                    {startTime ? fmtToday(startTime) : "—"}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                  <IconClock className="h-3.5 w-3.5 text-white/70"/>
                  <span className="text-white text-sm font-semibold">
                    {startTime && !isAvailableSlot ? timeLeft : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── Session card ── */}
            <div className="rounded-2xl p-4 bg-muted/40 border border-border/40">

              {/* Title row */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {isAvailableSlot
                    ? "Available Slot"
                    : `Session with ${student?.name ?? "Unknown student"}`}
                </h3>
                {/* Session type badge — only coloured element */}
                {event && (
                  <span
                    className="shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{color, border: `1.5px solid ${color}`, backgroundColor: hexToRgba(color, 0.08)}}
                  >
                    {event.sessionType}
                  </span>
                )}
              </div>

              {/* Location row */}
              {event && (
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-foreground/55">
                    {event.location === "online"
                      ? <IconVideo className="h-3.5 w-3.5 shrink-0"/>
                      : <IconBuilding className="h-3.5 w-3.5 shrink-0"/>}
                    <span className="font-medium capitalize">
                      {event.location === "online" ? "Online" : "Classroom"}
                    </span>
                  </div>
                  {event.location === "online" && (
                    <span className="text-xs text-muted-foreground italic inline-flex items-center gap-1">
                      <IconBrandZoom className="h-3.5 w-3.5 shrink-0"/>
                      Link coming soon
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── When card ── */}
            <div className="rounded-2xl p-4 bg-muted/40 border border-border/40">
              <div className="flex flex-row  mb-3 items-center gap-2 justify-between w-full">
                <div className="inline-flex items-center  gap-2">
                  <IconCalendar size={14} className="text-muted-foreground"/>
                  <span className="text-[11px] font-bold leading-0 uppercase tracking-widest text-muted-foreground">When</span>
                </div>

                {/* Countdown / status chip */}
                {!isPast && !isAvailableSlot && timeLeft && (
                  <div className="flex items-center gap-2">
                    <IconClock size={14} className="text-muted-foreground"/>
                    <p
                      key={timeLeft}
                      className="text-xs font-medium text-muted-foreground tabular-nums transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2"
                    >
                      {timeLeft}
                    </p>
                  </div>
                )}
                {isPast && !isAvailableSlot && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/50">
                    <span className="text-xs font-semibold text-muted-foreground">Completed</span>
                  </div>
                )}
              </div>

              {startTime ? (
                <div className="space-y-3">
                  {/* Time display */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-medium tabular-nums tracking-wider text-foreground">
                      {fmt24(startTime)}
                    </span>
                    {endTime && (
                      <>
                        <span className="text-xl text-muted-foreground/50 font-light">–</span>
                        <span className="text-3xl font-medium tabular-nums tracking-wider text-foreground">
                          {fmt24(endTime)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Date + duration */}
                  <div className="inline-flex items-center gap-2 justify-between w-full">
                    <p className="text-sm font-medium text-foreground">{fmtDateFull(startTime)}</p>
                    {event && (
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDuration(event.duration)}</p>
                    )}
                  </div>

                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No date set</p>
              )}
            </div>

            {/* ── Student card ── */}
            {student && (
              <div className="rounded-2xl p-4 bg-muted/40 border border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Student</span>
                </div>

                {/* Name + email + level */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                    style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
                  >
                    <Avatar>
                      <AvatarImage src={student.image} alt={`${student.name}'s profile picture`}/>
                      <AvatarFallback>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                  {student.languageLevel && (
                    <span
                      className="shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{
                        color: "#0891b2",
                        border: "1.5px solid rgba(8,145,178,0.07)",
                        backgroundColor: "transparent",
                      }}
                    >
                      {student.languageLevel}
                    </span>
                  )}
                </div>

                {/* Learning goals */}
                {student.preferences?.learningGoals && student.preferences.learningGoals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <IconTarget className="h-3 w-3 text-muted-foreground"/>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Learning Goals</span>
                    </div>
                    <div className="space-y-1.5">
                      {student.preferences.learningGoals.map((goal) => {
                        const g = GOAL_LABELS[goal];
                        return (
                          <div
                            key={goal}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-background border border-border/50"
                          >
                            <span className="text-base leading-none">{g?.icon ?? "•"}</span>
                            <span className="text-xs font-medium text-foreground/80">{g?.label ?? goal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer actions ── */}
          {showFooter && event && (
            <div className="shrink-0 px-4 py-4 border-t border-border/50 bg-background">
              <div className="flex gap-2">
                {isAvailableSlot ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingSlot}
                    onClick={onDeleteAvailableSlot}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm"
                  >
                    <IconTrash className="h-4 w-4"/>
                    {deletingSlot ? "Removing…" : "Remove Slot"}
                  </Button>
                ) : isRegularsSession ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCancelDialogOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm border border-border/60 hover:bg-muted transition-colors"
                    >
                      <IconX className="h-4 w-4"/>
                      Cancel Session
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setRemoveDialogOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm"
                    >
                      <IconTrash className="h-4 w-4"/>
                      Remove Schedule
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => onCancelSession()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm"
                  >
                    <IconX className="h-4 w-4"/>
                    {pending ? "Cancelling…" : "Cancel Session"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {event && isRegularsSession && event.invitationId && (
        <>
          <CancelSessionDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            invitationId={event.invitationId}
            sessionDate={new Date(event.startTime)}
            studentName={student?.name || null}
          />
          <RemoveScheduleDialog
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            invitationId={event.invitationId}
            studentName={student?.name || null}
            dayOfWeek={DAYS_OF_WEEK[new Date(event.startTime).getDay()]}
            startTime={new Date(event.startTime).toLocaleTimeString("default", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          />
        </>
      )}
    </>
  );
};
