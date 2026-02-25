"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TutorHoursByType } from "@/actions/admin-actions";
import {
  IconClock,
  IconUser,
  IconChartBar,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useMemo } from "react";

interface TutorHoursOverviewProps {
  data: TutorHoursByType[];
}

interface GroupedTutorData {
  tutorId: number;
  tutorName: string;
  tutorEmail: string;
  tutorColor: string;
  sessionTypes: {
    sessionType: string;
    totalHours: number;
    totalMinutes: number;
    sessionCount: number;
  }[];
  totalHours: number;
  totalMinutes: number;
  totalSessions: number;
}

export function TutorHoursOverview({ data }: TutorHoursOverviewProps) {
  // Group data by tutor
  const groupedData = useMemo(() => {
    const tutorMap = new Map<number, GroupedTutorData>();

    data.forEach((item) => {
      if (!tutorMap.has(item.tutorId)) {
        tutorMap.set(item.tutorId, {
          tutorId: item.tutorId,
          tutorName: item.tutorName,
          tutorEmail: item.tutorEmail,
          tutorColor: item.tutorColor,
          sessionTypes: [],
          totalHours: 0,
          totalMinutes: 0,
          totalSessions: 0,
        });
      }

      const tutor = tutorMap.get(item.tutorId)!;
      tutor.sessionTypes.push({
        sessionType: item.sessionType,
        totalHours: item.totalHours,
        totalMinutes: item.totalMinutes,
        sessionCount: item.sessionCount,
      });
      tutor.totalHours += item.totalHours;
      tutor.totalMinutes += item.totalMinutes;
      tutor.totalSessions += item.sessionCount;
    });

    // Round total hours and sort
    const result = Array.from(tutorMap.values()).map((tutor) => ({
      ...tutor,
      totalHours: Number(tutor.totalHours.toFixed(2)),
    }));

    // Sort by total hours descending, then by name
    return result.sort((a, b) => {
      if (b.totalHours !== a.totalHours) {
        return b.totalHours - a.totalHours;
      }
      return a.tutorName.localeCompare(b.tutorName);
    });
  }, [data]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalTutors = groupedData.length;
    const totalHours = groupedData.reduce(
      (sum, tutor) => sum + tutor.totalHours,
      0
    );
    const totalSessions = groupedData.reduce(
      (sum, tutor) => sum + tutor.totalSessions,
      0
    );
    const uniqueSessionTypes = new Set(data.map((item) => item.sessionType))
      .size;

    return {
      totalTutors,
      totalHours: Number(totalHours.toFixed(2)),
      totalSessions,
      uniqueSessionTypes,
    };
  }, [groupedData, data]);

  // Get unique session types for headers
  const sessionTypes = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.sessionType))).sort();
  }, [data]);

  const formatHours = (hours: number) => {
    return `${hours.toFixed(2)}h`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Get accent color for session type
  const getSessionTypeColor = (sessionType: string) => {
    const type = sessionType.toLowerCase();
    switch (type) {
      case "private":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300";
      case "group":
        return "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300";
      case "workshop":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300";
      case "regulars":
        return "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300";
      default:
        return "border-slate-500 bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300";
    }
  };

  // Calculate estimated revenue based on session type rates
  // Private sessions: 16.00 per hour
  // Group sessions: 12.50 per hour
  // Other session types default to 16.00 per hour
  const calculateEstimatedRevenue = useMemo(() => {
    return data.reduce((total, item) => {
      const sessionTypeLower = item.sessionType.toLowerCase();
      const ratePerHour = sessionTypeLower === "group" ? 12.5 : 16.0;
      return total + item.totalHours * ratePerHour;
    }, 0);
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconUsersGroup className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            No tutor hours data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-100/70 via-blue-50/40 to-transparent dark:from-sky-950/40 dark:via-blue-950/20 dark:to-transparent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sky-900 dark:text-sky-100">
              Total Tutors
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 border border-sky-400/40 shadow-sm">
              <IconUsersGroup className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              {overallStats.totalTutors}
            </div>
            <p className="text-xs text-sky-600/75 dark:text-sky-400/75 mt-1">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              Total Hours
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-400/20 to-purple-500/20 border border-indigo-400/40 shadow-sm">
              <IconClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {formatHours(overallStats.totalHours)}
            </div>
            <p className="text-xs text-indigo-600/75 dark:text-indigo-400/75 mt-1">
              Combined teaching hours
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-100/70 via-fuchsia-50/40 to-transparent dark:from-violet-950/40 dark:via-fuchsia-950/20 dark:to-transparent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-900 dark:text-violet-100">
              Total Sessions
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-400/20 to-fuchsia-500/20 border border-violet-400/40 shadow-sm">
              <IconChartBar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              {overallStats.totalSessions}
            </div>
            <p className="text-xs text-violet-600/75 dark:text-violet-400/75 mt-1">
              All session types
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-100/70 via-pink-50/40 to-transparent dark:from-rose-950/40 dark:via-pink-950/20 dark:to-transparent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-900 dark:text-rose-100">
              Estimated Revenue
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-rose-400/20 to-pink-500/20 border border-rose-400/40 shadow-sm">
              <IconUser className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              €{calculateEstimatedRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-rose-600/75 dark:text-rose-400/75 mt-1">
              Based on session rates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tutor Hours by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Tutor</TableHead>
                  {sessionTypes.map((type) => (
                    <TableHead key={type} className="text-center">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Total Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedData.map((tutor) => (
                  <TableRow
                    key={tutor.tutorId}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: tutor.tutorColor,
                          }}
                        />
                        <div>
                          <div className="font-medium">{tutor.tutorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {tutor.tutorEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {sessionTypes.map((type) => {
                      const sessionData = tutor.sessionTypes.find(
                        (s) => s.sessionType === type
                      );
                      const colorClass = getSessionTypeColor(type);
                      return (
                        <TableCell key={type} className="text-center">
                          {sessionData ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span
                                className={`font-medium px-2 py-0.5 rounded-md border ${colorClass}`}
                              >
                                {formatHours(sessionData.totalHours)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {sessionData.sessionCount} sessions
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-lg">
                          {formatHours(tutor.totalHours)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMinutes(tutor.totalMinutes)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className="text-sm"
                        style={{
                          borderColor: tutor.tutorColor,
                          backgroundColor: `${tutor.tutorColor}15`,
                        }}
                      >
                        {tutor.totalSessions}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cards View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groupedData.map((tutor) => (
          <Card
            key={tutor.tutorId}
            className="relative overflow-hidden border-l-4 transition-all hover:shadow-lg"
            style={{ borderLeftColor: tutor.tutorColor }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: tutor.tutorColor,
                  }}
                />
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {tutor.tutorName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tutor.tutorEmail}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border transition-all">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Hours
                    </div>
                    <div className="text-2xl font-bold">
                      {formatHours(tutor.totalHours)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Total Sessions
                    </div>
                    <div className="text-2xl font-bold">
                      {tutor.totalSessions}
                    </div>
                  </div>
                </div>

                {/* Breakdown by Type */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Breakdown by Type:
                  </div>
                  {tutor.sessionTypes.map((session) => {
                    return (
                      <div
                        key={session.sessionType}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="capitalize font-medium"
                          >
                            {session.sessionType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-bold text-base">
                              {formatHours(session.totalHours)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.sessionCount} sessions
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
