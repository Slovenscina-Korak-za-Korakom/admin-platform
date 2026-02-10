"use client";

import React, {useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Sheet, SheetContent, SheetTitle} from "@/components/ui/sheet";
import {
  IconCalendar,
  IconClock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import {Separator} from "../ui/separator";
import {Avatar, AvatarFallback, AvatarImage} from "../ui/avatar";
import {Button} from "../ui/button";
import {SessionData, StudentInfo} from "@/components/calendar/types";
import {CancelSessionDialog} from "./cancel-session-dialog";
import {RemoveScheduleDialog} from "./remove-schedule-dialog";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type EventSheetProps = {
  isEventSheetOpen: boolean;
  setIsEventSheetOpen: (open: boolean) => void;
  selectedSession: SessionData & { studentInfo: StudentInfo | null } | null;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("default", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("default", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const EventSheet = ({isEventSheetOpen, setIsEventSheetOpen, selectedSession: event}: EventSheetProps) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const student = event?.studentInfo;

  const isRegularsSession = event?.sessionType === "regular";
  const isFutureSession = event ? new Date(event.startTime) > new Date() : false;

  if (!event) {
    return (
      <Sheet
        open={isEventSheetOpen}
        onOpenChange={setIsEventSheetOpen}
      >
        <SheetContent className="w-[400px] sm:w-[540px] p-5">
          <SheetTitle>Event Details</SheetTitle>
          <p className="text-sm text-muted-foreground italic">
            No event selected
          </p>
        </SheetContent>
      </Sheet>
    );
  }

  const startTime = new Date(event.startTime);
  const endTime = new Date(startTime.getTime() + event.duration * 60000);

  return (
    <Sheet
      open={isEventSheetOpen}
      onOpenChange={setIsEventSheetOpen}
    >
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        {event && (
          <div className="flex flex-col h-full">
            <div className="p-6 pb-4 flex justify-between items-center">
              <SheetTitle className="text-2xl font-bold">
                {student?.name || "Unknown student"} - {event.sessionType}
              </SheetTitle>
              <Badge
                variant={(startTime < new Date() && event.status === "booked") ? "completed" : (event.status as "booked" || "cancelled" || "available")}>
                {startTime < new Date() && event.status === "booked" ? "Completed" : event.status}
              </Badge>
            </div>

            <Separator/>

            {/* Content Section */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Session Overview */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Session Overview
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    description placeholder
                    {/* {event.description} */}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-gray-500"/>
                      <span className="text-gray-600">
                        {event.duration} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  When
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconCalendar className="h-4 w-4 text-blue-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(new Date(event.startTime))}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(startTime)} - {formatTime(endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Your Student
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student?.image} alt={student?.name || "Student"}/>
                      <AvatarFallback className="text-sm">
                        {student?.name?.split(" ")[0][0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {student?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <IconMail className="h-4 w-4 text-green-600"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{student?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconPhone className="h-4 w-4 text-blue-600"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-foreground/40 italic">unknown</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Session Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <IconMapPin className="h-4 w-4 text-purple-600"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Location
                      </p>
                      <p className="text-sm text-gray-600">
                        {event.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator/>

            {/* Action Buttons */}
            <div className="p-6">
              <div className="flex gap-3">
                {isRegularsSession && isFutureSession ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <IconX className="h-4 w-4 mr-2"/>
                      Cancel This Session
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => setRemoveDialogOpen(true)}
                    >
                      <IconTrash className="h-4 w-4 mr-2"/>
                      Remove Schedule
                    </Button>
                  </>
                ) : event.status === "booked" && isFutureSession ? (
                  <Button variant="destructive" size="sm" className="flex-1">
                    <IconX className="h-4 w-4 mr-2"/>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Dialogs for regulars sessions */}
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
      </SheetContent>
    </Sheet>
  );
};
