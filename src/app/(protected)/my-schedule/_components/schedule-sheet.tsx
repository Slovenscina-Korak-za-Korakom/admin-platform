"use client";

import React, {useState} from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
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
  IconTrash,
  IconCheck,
  IconClock,
  IconVideo,
  IconBuilding,
  IconUser,
  IconSelector,
  IconCalendar,
  IconX,
} from "@tabler/icons-react";
import {calculateEndTime} from "@/app/(protected)/my-schedule/_components/schedule-confirm-dialog";
import {cn} from "@/lib/utils";
import {SESSION_COLORS, getSessionColor} from "@/lib/session-colors";

export interface Student {
  clerkId: string;
  email: string;
  name: string;
  image?: string;
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
    hex: SESSION_COLORS.individual,
    lightColor: hexToRgba(SESSION_COLORS.individual, 0.07),
    borderColor: hexToRgba(SESSION_COLORS.individual, 0.2),
    description: "One-on-one personalized sessions tailored to individual learning needs.",
  },
  group: {
    label: "Group",
    hex: SESSION_COLORS.group,
    lightColor: hexToRgba(SESSION_COLORS.group, 0.07),
    borderColor: hexToRgba(SESSION_COLORS.group, 0.2),
    description: "Interactive sessions with multiple participants for collaborative learning.",
  },
  regular: {
    label: "Regular",
    hex: SESSION_COLORS.regular,
    lightColor: hexToRgba(SESSION_COLORS.regular, 0.07),
    borderColor: hexToRgba(SESSION_COLORS.regular, 0.2),
    description: "Ongoing sessions for committed students with consistent scheduling.",
  },
  test: {
    label: "Test",
    hex: SESSION_COLORS.test,
    lightColor: hexToRgba(SESSION_COLORS.test, 0.07),
    borderColor: hexToRgba(SESSION_COLORS.test, 0.2),
    description: "A free introductory session for new students. Each student can only book one test session ever.",
  },
};

const LOCATION_CONFIG = {
  online: {label: "Online", icon: IconVideo},
  classroom: {label: "Classroom", icon: IconBuilding},
};

const getDefaultColorForSessionType = (sessionType: string): string =>
  getSessionColor(sessionType);

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface CalendarEvent {
  id: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  sessionType: string;
  location: string;
  description?: string;
  color: string;
  email?: string;
  studentClerkId?: string;
}

interface ScheduleSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: CalendarEvent | null;
  selectedSlot: {
    dayOfWeek: number;
    startTime: string;
    duration: number;
  } | null;
  formData: {
    startTime: string;
    duration: number;
    sessionType: string;
    location: string;
    description: string;
    color: string;
    email: string;
    studentClerkId: string;
  };
  onFormDataChange: (data: {
    startTime: string;
    duration: number;
    sessionType: string;
    location: string;
    description: string;
    color: string;
    email: string;
    studentClerkId: string;
  }) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  getDayLabel: (dayValue: number) => string;
  students: Student[];
}

export const ScheduleSheet: React.FC<ScheduleSheetProps> = ({
  isOpen,
  onOpenChange,
  editingEvent,
  selectedSlot,
  formData,
  onFormDataChange,
  onSave,
  onDelete,
  onCancel,
  getDayLabel,
  students,
}) => {
  const [studentSelectOpen, setStudentSelectOpen] = useState(false);

  const sessionConfig =
    SESSION_TYPE_CONFIG[formData.sessionType as keyof typeof SESSION_TYPE_CONFIG] ||
    SESSION_TYPE_CONFIG.individual;
  const handleSessionTypeChange = (value: string) => {
    onFormDataChange({
      ...formData,
      sessionType: value,
      color: getDefaultColorForSessionType(value),
      email: value === "regular" ? formData.email : "",
      studentClerkId: value === "regular" ? formData.studentClerkId : "",
    });
  };

  const selectedStudent = students.find(s => s.clerkId === formData.studentClerkId);
  const endTime = selectedSlot ? calculateEndTime(selectedSlot.startTime, formData.duration) : null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTitle className="sr-only">{editingEvent ? "Edit Session" : "New Session"}</SheetTitle>
      <SheetDescription className="sr-only">Configure session details</SheetDescription>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden gap-0">

        {/* ── Gradient Header ── */}
        <div
          className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
          style={{background: "linear-gradient(150deg, #2563eb 0%, #7c3aed 60%, #6d28d9 100%)"}}
        >
          {/* Decorative circle */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5"/>
          <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/5"/>

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <IconCalendar className="h-5 w-5 text-white"/>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <IconX className="h-4 w-4"/>
              </button>
            </div>

            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
              {editingEvent ? "Edit" : "New"}
            </p>
            <h2 className="text-white text-2xl font-bold leading-tight mb-4">
              Session
            </h2>

            {/* Time pill */}
            {selectedSlot && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                  <IconClock className="h-3.5 w-3.5 text-white/70"/>
                  <span className="text-white text-sm font-semibold tabular-nums">
                    {selectedSlot.startTime}
                    {endTime && <span className="text-white/55 font-normal"> – {endTime}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/12 rounded-lg px-3 py-2">
                  <span className="text-white text-sm font-semibold">
                    {getDayLabel(selectedSlot.dayOfWeek)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/12 rounded-lg px-3 py-2">
                  <span className="text-white/70 text-sm">{formatDuration(formData.duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Session type selector */}
          <div className="px-5 pt-5 pb-4 border-b border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Session Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(SESSION_TYPE_CONFIG) as [string, typeof SESSION_TYPE_CONFIG.individual][]).map(([key, cfg]) => {
                const active = formData.sessionType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSessionTypeChange(key)}
                    className="relative rounded-xl px-3 py-3 text-center transition-all"
                    style={{
                      backgroundColor: active ? cfg.lightColor : "transparent",
                      border: `1.5px solid ${active ? cfg.hex : "hsl(var(--border))"}`,
                    }}
                  >
                    {active && (
                      <div
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                        style={{backgroundColor: cfg.hex}}
                      />
                    )}
                    <span
                      className="text-[13px] font-semibold block"
                      style={{color: active ? cfg.hex : undefined}}
                    >
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
              {sessionConfig.description}
            </p>
          </div>

          {/* Student selection (regulars only) */}
          {formData.sessionType === "regular" && (
            <div className="px-5 py-4 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Student <span className="text-destructive normal-case tracking-normal font-normal">*</span>
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
                          style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
                        >
                          {selectedStudent.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="min-w-0">
                          <span className="font-medium block truncate">{selectedStudent.name}</span>
                          <span className="text-xs text-muted-foreground truncate block">{selectedStudent.email}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <IconUser className="h-4 w-4"/>
                        <span>Select a student…</span>
                      </span>
                    )}
                    <IconSelector className="h-4 w-4 text-muted-foreground shrink-0 ml-2"/>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search students…"/>
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => (
                          <CommandItem
                            key={student.clerkId}
                            value={`${student.name} ${student.email}`}
                            onSelect={() => {
                              onFormDataChange({
                                ...formData,
                                email: student.email,
                                studentClerkId: student.clerkId,
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
                              <span className="text-xs text-muted-foreground truncate">{student.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-2">
                An invitation email will be sent to this student when saved.
              </p>
            </div>
          )}

          {/* Location */}
          <div className="px-5 py-4 border-b border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Location
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(LOCATION_CONFIG) as [string, typeof LOCATION_CONFIG.online][]).map(([key, cfg]) => {
                const active = formData.location === key;
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onFormDataChange({...formData, location: key})}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all border"
                    style={{
                      backgroundColor: active ? "rgba(37, 99, 235, 0.07)" : "transparent",
                      borderColor: active ? "#2563eb" : "hsl(var(--border))",
                      borderWidth: "1.5px",
                    }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{color: active ? "#2563eb" : undefined}}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{color: active ? "#2563eb" : undefined}}
                    >
                      {cfg.label}
                    </span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"/>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Notes <span className="normal-case tracking-normal font-normal text-muted-foreground/60">(optional)</span>
            </p>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
              placeholder="Add any notes, student preferences, or special instructions…"
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-4 border-t border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            {editingEvent && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors"
              >
                <IconTrash className="h-3.5 w-3.5"/>
                Delete
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={onCancel}
                type="button"
                className="rounded-lg"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={onSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
                style={{background: "linear-gradient(135deg, #2563eb, #7c3aed)"}}
              >
                <IconCheck className="h-4 w-4"/>
                Save Session
              </button>
            </div>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
};
