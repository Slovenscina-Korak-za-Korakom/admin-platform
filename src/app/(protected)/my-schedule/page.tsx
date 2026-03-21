import TimeblockTabs from "@/app/(protected)/my-schedule/_components/timeblock-tabs";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { SessionData, AvailableSlotData } from "@/components/calendar/types";
import { checkTutorActivation } from "@/actions/admin-actions";
import { ActivationWrapper } from "@/app/(protected)/my-schedule/_components/activation-wrapper";
import { getScheduleData, getAcceptedRegulars, getCancelledSessions, getAvailableSlots } from "@/actions/timeblocks";
import { fromZonedTime } from "date-fns-tz";

type SearchParams = {
  tab?: string;
  view?: string;
  month?: string;
};

function generateRecurringEvents(
  invitations: {
    id: number;
    tutorId: number;
    studentClerkId: string | null;
    dayOfWeek: number;
    startTime: string; // wall-clock HH:mm in `timezone`
    duration: number;
    location: string;
    timezone: string | null;
  }[],
  cancelledSessions: {
    invitationId: number;
    cancelledDate: Date;
  }[]
): SessionData[] {
  const events: SessionData[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Generate events for a rolling 3-month window
  const endDate = new Date(today);
  endDate.setUTCMonth(endDate.getUTCMonth() + 3);

  // Create a Set of cancelled date strings for quick lookup (UTC date)
  const cancelledSet = new Set(
    cancelledSessions.map(
      (c) => `${c.invitationId}-${new Date(c.cancelledDate).toUTCString().slice(0, 16)}`
    )
  );

  for (const inv of invitations) {
    // Find the first occurrence on or after today (using UTC day-of-week)
    const current = new Date(today);
    const currentDayOfWeek = current.getUTCDay();
    let daysUntil = inv.dayOfWeek - currentDayOfWeek;
    if (daysUntil < 0) daysUntil += 7;
    current.setUTCDate(current.getUTCDate() + daysUntil);

    const tz = inv.timezone || "UTC";
    const [hours, minutes] = inv.startTime.split(":").map(Number);
    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");

    while (current <= endDate) {
      // Build a wall-clock datetime string for this occurrence date in the stored
      // timezone, then convert to a UTC Date so FullCalendar (local mode) displays
      // the correct local time regardless of DST.
      const y = current.getUTCFullYear();
      const mo = (current.getUTCMonth() + 1).toString().padStart(2, "0");
      const d = current.getUTCDate().toString().padStart(2, "0");
      const startTime = fromZonedTime(`${y}-${mo}-${d}T${hh}:${mm}:00`, tz);

      // Check if this specific session is cancelled (match on UTC date string)
      const isCancelled = cancelledSet.has(
        `${inv.id}-${current.toUTCString().slice(0, 16)}`
      );

      events.push({
        id: -(inv.id * 1000 + events.length), // Negative IDs to avoid collision with real timeblocks
        tutorId: inv.tutorId,
        startTime,
        duration: inv.duration,
        status: isCancelled ? "cancelled" : "booked",
        sessionType: "regular",
        location: inv.location,
        studentId: inv.studentClerkId || "",
        invitationId: inv.id,
      });

      current.setUTCDate(current.getUTCDate() + 7);
    }
  }

  return events;
}

export default async function TimeblocksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw notFound();
  }

  const params = await searchParams;
  const isActivated = (await checkTutorActivation(userId)) as boolean;

  const [scheduleResult, regularsResult, cancelledResult, availableSlotsResult] = await Promise.all([
    getScheduleData(),
    getAcceptedRegulars(),
    getCancelledSessions(),
    getAvailableSlots(),
  ]);

  const timeblocksData = (scheduleResult.data || []) as SessionData[];
  const acceptedRegulars = regularsResult.data || [];
  const cancelledSessions = cancelledResult.data || [];
  const recurringEvents = generateRecurringEvents(acceptedRegulars, cancelledSessions);
  const data = [...timeblocksData, ...recurringEvents];
  const availableSlots = (availableSlotsResult.data || []) as AvailableSlotData[];

  return (
    <div className="flex flex-col flex-1 min-h-0 p-5 space-y-6 w-full h-full">
      <ActivationWrapper isActivated={isActivated} />
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Schedule Planner
          </h1>
          <p className="text-muted-foreground">
            Manage your available teaching slots and recurring schedules
          </p>
        </div>
      </div>
      <TimeblockTabs data={data} availableSlots={availableSlots} initialTab={params.tab} />
    </div>
  );
}
