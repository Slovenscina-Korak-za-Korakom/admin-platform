"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {DailySessionStat, RegularSession, TutorHoursByType} from "@/actions/admin-actions";
import {getDateFromFilter, HoursFilter} from "@/app/(protected)/dashboard/_components/admin-dashboard";
import {IconChartBar, IconClock, IconUser, IconUsersGroup} from "@tabler/icons-react";
import {useMemo} from "react";
import {SessionsChart} from "@/app/(protected)/dashboard/_components/sessions-chart";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";


const FILTER_OPTIONS: { value: HoursFilter; label: string }[] = [
  {value: "all", label: "All time"},
  {value: "7d", label: "Last 7 days"},
  {value: "14d", label: "Last 14 days"},
  {value: "30d", label: "Last 30 days"},
  {value: "90d", label: "Last 90 days"},
  {value: "this_month", label: "This month"},
  {value: "last_month", label: "Last month"},
];

export function TutorHoursOverview({data, regularData, dailyData, activeFilter}: {
  data: TutorHoursByType[];
  dailyData: {status: number, data: DailySessionStat[]};
  regularData: RegularSession[];
  activeFilter: HoursFilter;
}) {

  const router = useRouter();

  const regularStats = useMemo(() => {
    const now = new Date();
    const result = new Map<number, { sessions: number; minutes: number }>();

    regularData.forEach((session) => {
      const filterDate = getDateFromFilter(activeFilter);
      const updatedAt = new Date(session.updatedAt);
      const from = (filterDate !== undefined && filterDate > updatedAt) ? filterDate : updatedAt;

      const count = countWeekdayOccurrences(session.dayOfWeek, from, now);

      if (!result.has(session.tutorId)) {
        result.set(session.tutorId, {sessions: 0, minutes: 0});
      }
      const stats = result.get(session.tutorId)!;
      stats.sessions += count;
      stats.minutes += count * session.duration;
    });

    return result;
  }, [regularData, activeFilter]);

  const totalStats = useMemo(() => {
    let minutes = 0;
    let sessions = 0;
    data.forEach((tutor) => {
      tutor.sessions.forEach(session => {
        minutes += session.totalMinutes;
        sessions += session.sessionCount;
      });
    });
    regularStats.forEach((t:{minutes: number, sessions: number}) => {
      minutes += t.minutes;
      sessions += t.sessions
    })
    return {minutes, sessions};
  }, [data, regularStats]);

  if (data.length === 0 && regularData.length === 0) {
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
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">{Math.max(data.length, regularStats.size)}</div>
            <p className="text-xs text-sky-600/75 dark:text-sky-400/75 mt-1">Active team members</p>
          </CardContent>
        </Card>

        <Card
          className="relative overflow-hidden border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Total Minutes</CardTitle>
            <div
              className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-400/20 to-purple-500/20 border border-indigo-400/40">
              <IconClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{totalStats.minutes}</div>
            <p className="text-xs text-indigo-600/75 dark:text-indigo-400/75 mt-1">Combined teaching minutes</p>
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
              <IconUser className="h-5 w-5 text-rose-600 dark:text-rose-400"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              € - coming soon
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

      {/* Tutor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((tutor) => { // FIX: show tutor information even if there is no individual or group sessions (only regulars)
          const tutorRegular = regularStats.get(tutor.tutorId);
          const totalMinutes = tutor.sessions.reduce((sum, s) => sum + s.totalMinutes, 0) + (tutorRegular?.minutes ?? 0);
          const totalSessions = tutor.sessions.reduce((sum, s) => sum + s.sessionCount, 0) + (tutorRegular?.sessions ?? 0);

          return (
            <Dialog key={tutor.tutorId}>
              <DialogTrigger asChild>
                <Card
                  className="relative overflow-hidden border-l-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{borderLeftColor: tutor.tutorColor}}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg capitalize">{tutor.tutorName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tutor.tutorEmail}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="rounded-lg bg-muted/50 py-3">
                        <div className="text-3xl font-bold">{totalSessions}</div>
                        <div className="text-xs text-muted-foreground mt-1">Sessions</div>
                      </div>
                      <div className="rounded-lg bg-muted/50 py-3">
                        <div className="text-3xl font-bold">{totalMinutes}</div>
                        <div className="text-xs text-muted-foreground mt-1">Minutes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{backgroundColor: tutor.tutorColor}}
                    />
                    {tutor.tutorName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-sm text-muted-foreground">{tutor.tutorEmail}</p>
                    {tutor.tutorLevel && (
                      <Badge variant="secondary" className="capitalize text-xs">{tutor.tutorLevel}</Badge>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Totals */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-2xl font-bold">{totalSessions}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Total Sessions</div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-2xl font-bold">{totalMinutes}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Total Minutes</div>
                    </div>
                  </div>

                  {/* Breakdown by type */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Breakdown by type
                    </p>
                    <div className="space-y-2">
                      {tutor.sessions.map((session) => (
                        <div
                          key={session.sessionType}
                          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                        >
                          <Badge variant="outline" className="capitalize font-medium">
                            {session.sessionType}
                          </Badge>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {session.sessionCount} <span className="text-xs">sessions</span>
                            </span>
                            <span className="font-semibold tabular-nums">
                              {session.totalMinutes} <span
                              className="text-xs font-normal text-muted-foreground">min</span>
                            </span>
                          </div>
                        </div>
                      ))}
                      {regularStats.has(tutor.tutorId) && (
                        <div
                          key={tutor.tutorId}
                          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                        >
                          <Badge variant="outline" className="capitalize font-medium">
                            Regular
                          </Badge>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {(regularStats.get(tutor.tutorId))?.sessions ?? "Error"} <span className="text-xs">sessions</span>
                            </span>
                            <span className="font-semibold tabular-nums">
                              {(regularStats.get(tutor.tutorId))?.minutes ?? "Error"} <span
                              className="text-xs font-normal text-muted-foreground">min</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}

function countWeekdayOccurrences(dayOfWeek: number, from: Date, to: Date): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  const daysUntilFirst = (dayOfWeek - start.getDay() + 7) % 7;
  const firstOccurrence = new Date(start);
  firstOccurrence.setDate(firstOccurrence.getDate() + daysUntilFirst);

  if (firstOccurrence >= end) return 0;

  return Math.floor((end.getTime() - firstOccurrence.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

