"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {CancelData, DailySessionStat, RegularSession, TutorHoursByType} from "@/actions/admin-actions";
import {getDateFromFilter, HoursFilter} from "@/app/(protected)/dashboard/_components/admin-dashboard";
import {IconChartBar, IconClock, IconMoneybag, IconUsersGroup} from "@tabler/icons-react";
import {useMemo} from "react";
import {SessionsChart} from "@/app/(protected)/dashboard/_components/sessions-chart";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import {TutorCard} from "@/app/(protected)/dashboard/_components/tutorCard";

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const FILTER_OPTIONS: { value: HoursFilter; label: string }[] = [
  {value: "all", label: "All time"},
  {value: "7d", label: "Last 7 days"},
  {value: "14d", label: "Last 14 days"},
  {value: "30d", label: "Last 30 days"},
  {value: "90d", label: "Last 90 days"},
  {value: "this_month", label: "This month"},
  {value: "last_month", label: "Last month"},
];

export function TutorHoursOverview({data, regularData, dailyData, activeFilter, tutors}: {
  data: TutorHoursByType[];
  dailyData: { status: number, data: DailySessionStat[] };
  regularData: {status: number, message: string, data: RegularSession[], cancelData: CancelData[]};
  activeFilter: HoursFilter;
  tutors: {
    id: number,
    email: string;
    name: string;
    avatar: string;
    level: "senior" | "junior";
    color: string;
  }[]
}) {

  const router = useRouter();

  const regularStats = useMemo(() => {
    const now = new Date();
    const result = new Map<number, { sessions: number; minutes: number; revenue: number }>();

    regularData.data.forEach((session) => {
      const filterDate = getDateFromFilter(activeFilter);
      const updatedAt = new Date(session.updatedAt);
      const from = (filterDate !== undefined && filterDate > updatedAt) ? filterDate : updatedAt;

      const count = countWeekdayOccurrences(session.dayOfWeek, from, now);

      const cancelledCount = regularData.cancelData.filter((c) => {
        const cancelDate = new Date(c.date);
        return c.invitationId === session.id && cancelDate >= from && cancelDate < now;
      }).length;

      const effectiveCount = Math.max(0, count - cancelledCount);

      if (!result.has(session.tutorId)) {
        result.set(session.tutorId, {sessions: 0, minutes: 0, revenue: 0});
      }
      const stats = result.get(session.tutorId)!;
      stats.sessions += effectiveCount;
      stats.minutes += effectiveCount * session.duration;
      const tutor = tutors.find((t) => t.id === session.tutorId)
      stats.revenue += tutor?.level === "junior" ? effectiveCount * session.duration * 0.333 : effectiveCount * session.duration * 0.367;
    });

    return result;
  }, [regularData.data, regularData.cancelData, activeFilter, tutors]);


  const totalStats = useMemo(() => {
    let minutes = 0;
    let sessions = 0;
    let revenue = 0;
    data.forEach((tutor) => {
      tutor.sessions.forEach(session => {
        minutes += session.totalMinutes;
        sessions += session.sessionCount;
        revenue += tutor.tutorLevel === "junior" ? session.totalMinutes * 0.333 : session.totalMinutes * 0.367;
      });
    });
    regularStats.forEach((t: { minutes: number, sessions: number, revenue: number }) => {
      minutes += t.minutes;
      sessions += t.sessions
      revenue += t.revenue
    })
    return {minutes, sessions, revenue};
  }, [data, regularStats]);

  if (data.length === 0 && regularData.data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconUsersGroup className="h-12 w-12 text-muted-foreground mb-4"/>
          <p className="text-muted-foreground text-lg">No tutor hours data available</p>
        </CardContent>
      </Card>
    );
  }


  function handleFilterChange(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("filter", value);
    router.push(`?${params.toString()}`);
  }


  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="relative overflow-hidden border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-100/70 via-blue-50/40 to-transparent dark:from-sky-950/40 dark:via-blue-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sky-900 dark:text-sky-100">Total Tutors</CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 border border-sky-400/40">
              <IconUsersGroup className="h-5 w-5 text-sky-600 dark:text-sky-400"/>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-sky-700 dark:text-sky-300">{tutors.length}</div>
            <p className="text-xs text-sky-600/75 dark:text-sky-400/75 mt-1">Active tutors</p>
          </CardContent>
        </Card>

        <Card
          className="relative overflow-hidden border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Total Time</CardTitle>
            <div
              className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-400/20 to-purple-500/20 border border-indigo-400/40">
              <IconClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatTime(totalStats.minutes)}</div>
            <p className="text-xs text-indigo-600/75 dark:text-indigo-400/75 mt-1">Combined teaching time</p>
          </CardContent>
        </Card>

        <Card
          className="relative overflow-hidden border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-100/70 via-fuchsia-50/40 to-transparent dark:from-violet-950/40 dark:via-fuchsia-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-900 dark:text-violet-100">Total Sessions</CardTitle>
            <div
              className="p-2.5 rounded-lg bg-gradient-to-br from-violet-400/20 to-fuchsia-500/20 border border-violet-400/40">
              <IconChartBar className="h-5 w-5 text-violet-600 dark:text-violet-400"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{totalStats.sessions}</div>
            <p className="text-xs text-violet-600/75 dark:text-violet-400/75 mt-1">All session types</p>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-100/70 via-pink-50/40 to-transparent dark:from-rose-950/40 dark:via-pink-950/20 dark:to-transparent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-900 dark:text-rose-100">
              Estimated Revenue
            </CardTitle>
            <div
              className="p-2.5 rounded-lg bg-gradient-to-br from-rose-400/20 to-pink-500/20 border border-rose-400/40 shadow-sm">
              <IconMoneybag className="h-5 w-5 text-rose-600 dark:text-rose-400"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              € {totalStats.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-rose-600/75 dark:text-rose-400/75 mt-1">
              Based on session rates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time range filter */}
      <div className="inline-flex rounded-lg border border-border text-xs font-medium overflow-hidden mt-8">
        {FILTER_OPTIONS.map((r, i) => (
          <button
            key={r.value}
            onClick={() => handleFilterChange(r.value)}
            className={cn(
              "px-3 py-1.5 transition-colors",
              i > 0 && "border-l border-border",
              activeFilter === r.value
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                : "bg-background text-muted-foreground hover:bg-muted/60"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {dailyData.status === 200 && (
        <div className="mb-10">
          <SessionsChart data={dailyData.data} regularData={regularData} activeFilter={activeFilter}/>
        </div>
      )}

      <TutorCard tutors={tutors} data={data} regularStats={regularStats}/>
    </div>
  );
}

function countWeekdayOccurrences(dayOfWeek: number, from: Date, to: Date): number {
  const start = new Date(from);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);

  const daysUntilFirst = (dayOfWeek - start.getDay() + 7) % 7;
  const firstOccurrence = new Date(start);
  firstOccurrence.setDate(firstOccurrence.getDate() + daysUntilFirst);

  if (firstOccurrence >= end) return 0;

  return Math.floor((end.getTime() - firstOccurrence.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

