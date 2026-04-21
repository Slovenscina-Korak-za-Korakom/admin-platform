"use client";

import {useMemo, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {ChartConfig} from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {CartesianGrid, Line, LineChart, XAxis, YAxis} from "recharts";
import type {CancelData, DailySessionStat, RegularSession} from "@/actions/admin-actions";
import {cn} from "@/lib/utils";
import {getDateFromFilter, HoursFilter} from "@/app/(protected)/dashboard/_components/admin-dashboard";


type Metric = "sessions" | "minutes";

export function SessionsChart({data, regularData, activeFilter}: {
  data: DailySessionStat[];
  regularData: {status: number, data: RegularSession[]; cancelData: CancelData[]}
  activeFilter: HoursFilter;
}) {
  const [metric, setMetric] = useState<Metric>("sessions");

  const allData = useMemo((): DailySessionStat[] => {
    const expanded = expandRegularSessions(regularData, activeFilter);
    const map = new Map<string, DailySessionStat>();
    [...data, ...expanded].forEach(d => {
      const key = `${d.date}-${d.tutorId}`;
      const existing = map.get(key);
      if (existing) {
        existing.sessionCount += d.sessionCount;
        existing.totalMinutes += d.totalMinutes;
      } else {
        map.set(key, {...d});
      }
    });
    return Array.from(map.values());
  }, [data, regularData, activeFilter]);

  const tutors = useMemo(() => {
    const map = new Map<number, { name: string; color: string }>();
    allData.forEach(d => {
      if (!map.has(d.tutorId)) {
        map.set(d.tutorId, {name: d.tutorName, color: d.tutorColor});
      }
    });
    return Array.from(map.entries()).map(([id, info]) => ({id, ...info}));
  }, [allData]);


  // Pivot: one entry per date, each tutor is a key with their value (default 0)
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    const start = getDateFromFilter(activeFilter) ?? new Date("2026-01-01");
    const now = new Date();
    const current = new Date(start);
    while (current < now) {
      const currentFormated = current.toISOString().slice(0, 10);
      if (!dateMap.has(currentFormated)) {
        const entry: Record<string, number> = {};
        tutors.forEach(t => {
          entry[`tutor-${t.id}`] = 0;
        });
        dateMap.set(currentFormated, entry);
      }
      current.setDate(current.getDate() + 1);
    }

    allData.forEach(d => {
      const entry = dateMap.get(d.date);
      if (!entry) return;
      entry[`tutor-${d.tutorId}`] = metric === "sessions" ? d.sessionCount : d.totalMinutes;
    })

    return Array.from(dateMap.entries())
      .map(([date, values]) => ({date, ...values}))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allData, activeFilter, tutors, metric]);


  const chartConfig = useMemo((): ChartConfig => {
    return Object.fromEntries(
      tutors.map(t => [`tutor-${t.id}`, {label: t.name, color: t.color}])
    );
  }, [tutors]);



  return (
    <Card className="shadow-sm border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Sessions Over Time</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Booked sessions per tutor · {metric === "sessions" ? "count" : "minutes"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">



            {/* Metric toggle */}
            <div className="inline-flex rounded-lg border border-border text-xs font-medium overflow-hidden">
              {(["sessions", "minutes"] as Metric[]).map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 capitalize transition-colors",
                    i > 0 && "border-l border-border",
                    metric === m
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
            No sessions in this time range
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <LineChart data={chartData} margin={{top: 4, right: 16, bottom: 0, left: 0}}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" className="stroke-border/40"/>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{fontSize: 11}}
                tickFormatter={(v: string) => {
                  const [y, m, d] = v.split("-");
                  return `${parseInt(d)}.${parseInt(m)}.${parseInt(y)}`;
                }}
              />
              <YAxis
                tickLine={true}
                axisLine={true}
                tickMargin={4}
                tick={{fontSize: 11}}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(v) => {
                      if (typeof v !== "string") return v;
                      const [y, m, d] = v.split("-");
                      return `${d}.${m}.${y}`;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent/>}/>
              {tutors.map(tutor => (
                <Line
                  key={tutor.id}
                  type="monotone"
                  dataKey={`tutor-${tutor.id}`}
                  stroke={tutor.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{r: 4, strokeWidth: 0}}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function expandRegularSessions(regularData: {data: RegularSession[], cancelData: CancelData[]}, filter: HoursFilter): DailySessionStat[] {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const result: DailySessionStat[] = [];

  for (const session of regularData.data) {
    if (!session.confirmedAt) continue;
    const filterDate = getDateFromFilter(filter);
    const confirmedAt = new Date(session.confirmedAt);
    const start = (filterDate !== undefined && filterDate > confirmedAt) ? filterDate : confirmedAt;
    start.setUTCHours(0, 0, 0, 0);

    const end = session.status === "removed" && session.updatedAt ? new Date(session.updatedAt) : now;
    end.setUTCHours(0, 0, 0, 0);

    const daysUntilFirst = (session.dayOfWeek - start.getUTCDay() + 7) % 7;
    const current = new Date(start);
    current.setDate(current.getDate() + daysUntilFirst);

    while (current < end) {
      const dateStr = current.toISOString().slice(0, 10);
      const isCancelled = regularData.cancelData.some(
        c => c.invitationId === session.id && new Date(c.date).toISOString().slice(0, 10) === dateStr
      );
      if (!isCancelled) {
        result.push({
          date: dateStr,
          tutorId: session.tutorId,
          tutorName: session.tutorName,
          tutorColor: session.tutorColor,
          sessionCount: 1,
          totalMinutes: session.duration,
        });
      }
      current.setDate(current.getDate() + 7);
    }
  }

  return result;
}
