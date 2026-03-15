"use client";

import React, {useState, useTransition} from "react";
import {Sheet, SheetContent, SheetTitle, SheetDescription} from "@/components/ui/sheet";
import {
  IconCalendar,
  IconClock,
  IconMail,
  IconMapPin,
  IconVideo,
  IconBuilding,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import {SessionData, StudentInfo} from "@/components/calendar/types";
import {CancelSessionDialog} from "./cancel-session-dialog";
import {RemoveScheduleDialog} from "./remove-schedule-dialog";
import Image from "next/image";
import {cancelSession} from "@/actions/timeblocks";
import {useRouter} from "next/navigation";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SESSION_TYPE_CONFIG: Record<string, {label: string; hex: string; lightColor: string; borderColor: string}> = {
  individual: {label: "Individual", hex: "#3b82f6", lightColor: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.22)"},
  group:      {label: "Group",      hex: "#8b5cf6", lightColor: "rgba(139,92,246,0.08)",  borderColor: "rgba(139,92,246,0.22)"},
  regular:    {label: "Regular",    hex: "#ec4899", lightColor: "rgba(236,72,153,0.08)",  borderColor: "rgba(236,72,153,0.22)"},
  test:       {label: "Test",       hex: "#F97315", lightColor: "rgba(236,72,153,0.08)",  borderColor: "rgba(236,72,153,0.22)"},
};

const STATUS_CONFIG: Record<string, {label: string; bg: string; text: string}> = {
  booked:    {label: "Upcoming",  bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400"},
  completed: {label: "Completed", bg: "bg-muted",                              text: "text-muted-foreground"},
  cancelled: {label: "Cancelled", bg: "bg-red-100 dark:bg-red-950/40",         text: "text-red-700 dark:text-red-400"},
};

const fmt24 = (d: Date) =>
  `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {weekday: "long", year: "numeric", month: "long", day: "numeric"});

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

type EventSheetProps = {
  isEventSheetOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: (SessionData & {studentInfo: StudentInfo | null}) | null;
};

export const EventSheet = ({isEventSheetOpen, onOpenChange, selectedSession: event}: EventSheetProps) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const student = event?.studentInfo ?? null;
  const isRegularsSession = event?.sessionType === "regular";
  const isFutureSession = event ? new Date(event.startTime) > new Date() : false;

  const startTime = event ? new Date(event.startTime) : null;
  const endTime = startTime ? new Date(startTime.getTime() + (event?.duration ?? 0) * 60000) : null;
  const isPast = startTime ? startTime < new Date() : false;
  const effectiveStatus = isPast && event?.status === "booked" ? "completed" : (event?.status ?? "booked");

  const sessionCfg = SESSION_TYPE_CONFIG[event?.sessionType ?? "individual"] ?? SESSION_TYPE_CONFIG.individual;
  const statusCfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.booked;

  const initials = student?.name
    ? student.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const showFooter = (isRegularsSession && isFutureSession) || (event?.status === "booked" && isFutureSession && !isRegularsSession);

  const onCancelSession = () => {
    if (!event?.id) return;
    startTransition(async () => {
      const result = await cancelSession(event.id);

      if (result.status === 200) {
        router.refresh();
        onOpenChange(false)
      } else {
        console.error("Failed to remove schedule:", result.message);
      }
    });
  }

  return (
    <>
      <Sheet open={isEventSheetOpen} onOpenChange={onOpenChange}>
        <SheetTitle className="sr-only">Session Details</SheetTitle>
        <SheetDescription className="sr-only">View session information</SheetDescription>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden gap-0">

          {/* ── Gradient header ── */}
          <div
            className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
            style={{background: "linear-gradient(150deg, #2563eb 0%, #7c3aed 60%, #6d28d9 100%)"}}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"/>
            <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none"/>

            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden shrink-0"
                  style={{background: "rgba(255,255,255,0.18)"}}
                >
                  {student?.image
                    ? <Image height={500} width={500} src={student.image} alt={student.name ?? ""} className="w-full h-full object-cover"/>
                    : initials}
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <IconX className="h-4 w-4"/>
                </button>
              </div>

              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Session</p>
              <h2 className="text-white text-xl font-bold leading-tight mb-3">
                {student?.name || "Unknown student"}
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{backgroundColor: "rgba(255,255,255,0.18)", color: "#fff"}}
                >
                  {sessionCfg.label}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* When */}
            <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">When</p>
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
                >
                  <IconCalendar className="h-4 w-4 text-white"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {startTime ? fmtDate(startTime) : "—"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <IconClock className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {startTime && endTime ? `${fmt24(startTime)} – ${fmt24(endTime)}` : "—"}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-sm text-muted-foreground">
                      {event ? fmtDuration(event.duration) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Location</p>
              {event && (
                <div className="flex items-center gap-2.5">
                  {event.location === "online"
                    ? <IconVideo className="h-4 w-4 text-muted-foreground shrink-0"/>
                    : <IconBuilding className="h-4 w-4 text-muted-foreground shrink-0"/>}
                  <span className="text-sm font-medium text-foreground capitalize">{event.location}</span>
                </div>
              )}
            </div>

            {/* Student */}
            {student && (
              <div className="px-5 py-4 border-b border-border/60">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Student</p>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                    style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
                  >
                    {student.image
                      ? <Image height={500} width={500} src={student.image} alt={student.name ?? ""} className="w-full h-full object-cover"/>
                      : initials}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{student.name}</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-2.5">
                    <IconMail className="h-4 w-4 text-muted-foreground shrink-0"/>
                    <span className="text-sm text-muted-foreground">{student.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Session type */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Session Type</p>
              {event && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{backgroundColor: sessionCfg.lightColor, border: `1.5px solid ${sessionCfg.borderColor}`}}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: sessionCfg.hex}}/>
                  <span className="text-sm font-semibold" style={{color: sessionCfg.hex}}>{sessionCfg.label}</span>
                  <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <IconMapPin className="h-3.5 w-3.5 shrink-0"/>
                    <span className="capitalize">{event.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          {showFooter && event && (
            <div className="shrink-0 px-5 py-4 border-t border-border/60 bg-muted/20">
              <div className="flex gap-2">
                {isRegularsSession ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setCancelDialogOpen(true)}
                      className="flex-1 flex items-center cursor-pointer justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
                    >
                      <IconX className="h-4 w-4"/>
                      Cancel Session
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveDialogOpen(true)}
                      className="flex-1 flex items-center cursor-pointer justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors"
                    >
                      <IconTrash className="h-4 w-4"/>
                      Remove Schedule
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    className="flex-1 flex items-center cursor-pointer justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onCancelSession()}
                  >
                    <IconX className="h-4 w-4"/>
                    {pending ? "Cancelling..." : "Cancel Session"}
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
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
