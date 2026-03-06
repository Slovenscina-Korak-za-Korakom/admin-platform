/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {useState, useRef, useEffect, useCallback} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventClickArg,
  SessionData,
  StudentInfo,
} from "@/components/calendar/types";
import {CalendarControls} from "@/components/calendar/calendar-controls";
import {EventSheet} from "@/components/calendar/event-sheet";
import "@/components/calendar/calendar-styles.css";
import {getStatusColor} from "./calendar-functions";
import {getStudentInfo} from "@/actions/timeblocks";

export default function Calendar({data}: { data: SessionData[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const urlView = searchParams.get("view");
  const initialView = urlView || "month";
  const viewMap: Record<string, string> = {
    month: "dayGridMonth",
    week: "timeGridWeek",
    day: "timeGridDay",
    "2days": "timeGrid2Day",
    "3days": "timeGrid3Day",
    list: "listWeek",
  };
  const initialFullCalendarView = viewMap[initialView] || "dayGridMonth";

  const [selectedEvent, setSelectedEvent] = useState<
    (SessionData & { studentInfo: StudentInfo | null }) | null
  >(null);
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState(new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  }));
  const [currentView, setCurrentView] = useState(initialFullCalendarView);
  const [showWeekends, setShowWeekends] = useState(true);
  const [studentsInfo, setStudentsInfo] = useState<
    Record<string, StudentInfo | null>
  >({});
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch student names for all unique studentIds
  useEffect(() => {
    const fetchStudentsInfo = async () => {
      const uniqueStudentIds = Array.from(
        new Set(data.map((session) => session.studentId).filter(Boolean))
      );

      const nameMap: Record<string, StudentInfo | null> = {};

      await Promise.all(
        uniqueStudentIds.map(async (studentId) => {
          try {
            const result = await getStudentInfo(studentId);
            if (result.status === 200 && result.user) {
              nameMap[studentId] = result.user;
            } else {
              nameMap[studentId] = null;
            }
          } catch (error) {
            console.error(
              `Failed to fetch student info for ${studentId}:`,
              error
            );
            nameMap[studentId] = null;
          }
        })
      );

      setStudentsInfo(nameMap);
    };

    if (data.length > 0) {
      fetchStudentsInfo();
    }
  }, [data]);

  const events = data.map((session) => {
    const studentInfo = session.studentId
      ? studentsInfo[session.studentId]
      : null;

    const studentName = studentInfo?.name || "Loading...";

    return {
      id: session.id.toString(),
      title: `${studentName} - ${session.sessionType}`,
      start: session.startTime,
      end: new Date(
        new Date(session.startTime).getTime() + session.duration * 60000
      ),
      extendedProps: {
        status: session.status,
        studentInfo: studentInfo,
        studentId: session.studentId,
        tutorId: session.tutorId,
        location: session.location,
        sessionType: session.sessionType,
        duration: session.duration,
        invitationId: session.invitationId,
      },
    };
  });

  // Update URL params when view or date changes
  const updateUrlParams = useCallback(
    (updates: { view?: string; date?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Ensure the tab is set to calendar if not already
      if (!params.get("tab")) {
        params.set("tab", "calendar");
      }

      if (updates.view) {
        // Map FullCalendar view names to URL-friendly names
        const viewNameMap: Record<string, string> = {
          dayGridMonth: "month",
          timeGridWeek: "week",
          timeGridDay: "day",
          timeGrid2Day: "2days",
          timeGrid3Day: "3days",
          listWeek: "list",
        };
        const urlViewName = viewNameMap[updates.view] || updates.view;
        params.set("view", urlViewName);
      }

      router.push(`/my-schedule?${params.toString()}`, {scroll: false});
    },
    [searchParams, router]
  );

  const changeView = useCallback(
    (viewName: string) => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.changeView(viewName);
        setCurrentView(viewName);
        updateCalendarTitle();
        updateUrlParams({view: viewName});
      }
    },
    [updateUrlParams]
  );

  const handleMoreEventsClick = useCallback(
    (date: Date) => {

      // Find the start of the week (Monday) for the clicked date
      // FullCalendar typically uses Monday as the start of the week
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Adjust to Monday start (if Sunday, go back 6 days; otherwise go back to Monday)
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);

      // Set the calendar-to-week view and navigate to that week
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        // Navigate to the specific date first
        calendarApi.gotoDate(startOfWeek);
        // Use the existing changeView function to properly update the state
        changeView("timeGridWeek");
      }
    },
    [changeView]
  );

  // Handle more events clicks
  useEffect(() => {
    const handleMoreEventsClickEvent = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains("fc-more-link")) {
        event.preventDefault();
        event.stopPropagation();

        // Get the date from the more link
        const dayEl = target.closest(".fc-daygrid-day");
        if (dayEl) {
          const dateStr = dayEl.getAttribute("data-date");
          console.log("Date string from element:", dateStr);
          if (dateStr) {
            // Parse the date string and create a proper Date object
            const date = new Date(dateStr + "T00:00:00");
            console.log("Parsed date:", date);
            handleMoreEventsClick(date);
          }
        }
      }
    };

    // Add an event listener to the calendar container
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const calendarEl = (calendarApi as any).el;
      if (calendarEl) {
        calendarEl.addEventListener("click", handleMoreEventsClickEvent);
        return () => {
          calendarEl.removeEventListener("click", handleMoreEventsClickEvent);
        };
      }
    }
  }, [handleMoreEventsClick]);

  const handleEventClick = (arg: EventClickArg) => {
    // Convert FullCalendar event back to SessionData with studentInfo
    const session: SessionData & { studentInfo: StudentInfo | null } = {
      id: parseInt(arg.event.id),
      tutorId: arg.event.extendedProps.tutorId,
      startTime: arg.event.start!.toISOString(), // Convert Date to string
      duration: arg.event.extendedProps.duration,
      status: arg.event.extendedProps.status,
      sessionType: arg.event.extendedProps.sessionType,
      location: arg.event.extendedProps.location,
      studentId: arg.event.extendedProps.studentId,
      studentInfo: arg.event.extendedProps.studentInfo,
      invitationId: arg.event.extendedProps.invitationId,
    };
    setSelectedEvent(session);
    setIsEventSheetOpen(true);
  };

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      updateCalendarTitle();
      const currentDate = calendarApi.getDate();
      updateUrlParams({date: currentDate.toISOString()});
    }
  };

  const goToPrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
      updateCalendarTitle();
      const currentDate = calendarApi.getDate();
      updateUrlParams({date: currentDate.toISOString()});
    }
  };

  const goToNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
      updateCalendarTitle();
      const currentDate = calendarApi.getDate();
      updateUrlParams({date: currentDate.toISOString()});
    }
  };

  const updateCalendarTitle = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const view = calendarApi.view;
      setCalendarTitle(view.title);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
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

      {/* FullCalendar Component */}
      <div className="h-full w-full">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView={initialFullCalendarView}
          headerToolbar={false}
          height="100%"
          views={{
            timeGridWeek: {
              type: "timeGrid",
              duration: {weeks: 1},
              buttonText: "Week",
              allDaySlot: false,
              dayHeaderFormat: {weekday: "short"},
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
          events={events}
          eventClick={handleEventClick}
          editable={true}
          selectable={false}
          selectMirror={false}
          dayMaxEvents={1}
          moreLinkClick="none"
          moreLinkContent={(arg: any) => {
            // Try different ways to get the hidden count
            const hiddenCount =
              arg.hiddenSegs?.length ||
              arg.hiddenEvents?.length ||
              arg.num ||
              0;

            if (hiddenCount > 0) {
              return `+${hiddenCount} more`;
            }

            const totalEvents = arg.allSegs?.length || 0;
            if (totalEvents > 1) {
              return `+${totalEvents - 1} more`;
            }

            return "";
          }}
          weekNumbers={false}
          weekends={showWeekends}
          firstDay={1} // Monday
          dayCellContent={(dayInfo: any) => {
            const date = new Date(dayInfo.date);
            const dayNumber = date.getDate();

            // Check if this is the first day of the month
            if (dayNumber === 1) {
              const monthName = date.toLocaleDateString("en-US", {
                month: "long",
              });
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
          eventContent={(eventInfo: any) => {
            const startTime = new Date(eventInfo.event.start);
            const endTime = new Date(eventInfo.event.end);
            const timeString = `${startTime
              .getHours()
              .toString()
              .padStart(2, "0")}:${startTime
              .getMinutes()
              .toString()
              .padStart(2, "0")} - ${endTime
              .getHours()
              .toString()
              .padStart(2, "0")}:${endTime
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;

            const status = eventInfo.event.extendedProps?.status;
            const date = eventInfo.event.start;
            const sessionType = eventInfo.event.extendedProps?.sessionType;
            const statusColor = getStatusColor(status, date, sessionType);
            return (
              <div
                className={`text-white text-sm font-medium w-full ${
                  status === "completed" ? "opacity-75" : ""
                }`}
                style={{
                  backgroundColor: statusColor,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                  height: "100%",
                  borderRadius: "6px",
                  padding: "2px 0px 0px 8px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="truncate capitalize font-bold"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "0px",
                  }}
                >
                  {eventInfo.event.title}
                </div>
                <div
                  className="text-xs opacity-80 truncate"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: "0px",
                  }}
                >
                  {timeString}
                </div>
              </div>
            );
          }}
        />
      </div>

      <EventSheet
        isEventSheetOpen={isEventSheetOpen}
        setIsEventSheetOpen={setIsEventSheetOpen}
        selectedSession={selectedEvent}
      />
    </div>
  );
}
