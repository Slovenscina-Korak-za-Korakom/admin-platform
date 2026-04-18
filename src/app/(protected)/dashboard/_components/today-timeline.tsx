import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {IconCalendarEvent, IconChartBar, IconClock} from "@tabler/icons-react";
import {formatDuration} from "./tutor-dashboard";
import {TodaySessions} from "@/actions/admin-actions";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

const SESSION_TYPE_COLORS: Record<string, string> = {
  individual: "#6366f1",
  group: "#0ea5e9",
  regular: "#10b981",
};

export const TodayTimeline = async ({data}: { data: TodaySessions[] }) => {
  const confirmedCount = data.filter((s) => s.status !== "cancelled").length;
  const totalMinutes = data.filter((s) => s.status !== "cancelled").reduce((sum, s) => sum + s.duration, 0);


  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm flex flex-col min-h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 border border-sky-400/40">
              <IconCalendarEvent className="h-4 w-4 text-sky-600 dark:text-sky-400"/>
            </div>
            <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconChartBar className="h-3 w-3"/>
              {confirmedCount} sessions
            </span>
            <span className="flex items-center gap-1">
              <IconClock className="h-3 w-3"/>
              {formatDuration(totalMinutes)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        {data.length === 0 ? (
          <div
            className="flex flex-col items-center -translate-y-8 justify-center flex-1 text-center text-muted-foreground w-full">
            <IconCalendarEvent className="h-12 w-12 mb-2 opacity-30"/>
            <p className="text-sm">No sessions today</p>
          </div>
        ) : (
          <div className="relative space-y-1">
            {/* Vertical timeline line */}
            <div className="absolute left-[52px] top-2 bottom-2 w-px bg-border/50"/>

            {data.map(async (session) => {
              const color = SESSION_TYPE_COLORS[session.type] ?? "#6366f1";
              const isCancelled = session.status === "cancelled";

              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${isCancelled ? "opacity-50" : "hover:bg-muted/40"}`}
                >
                  {/* Time */}
                  <span className="w-10 shrink-0 text-right text-xs font-mono font-medium text-muted-foreground">
                  {session.startTime.toLocaleTimeString('default', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>

                  {/* Dot */}
                  <div
                    className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-background"
                    style={{backgroundColor: isCancelled ? "#94a3b8" : color}}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                    <div className="min-w-0 inline-flex gap-3 items-center">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={session.studentAvatar} alt={`${session.studentName}'s profile picture`}/>
                        <AvatarFallback
                          className="rounded-lg text-white text-xs font-bold"
                          style={{background: "linear-gradient(135deg, #6366f1, #8b5cf6)"}}
                        >
                          {session.studentName.split(' ')[0]?.[0]}
                          {session.studentName.split(' ')[1]?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`text-sm capitalize font-medium truncate ${isCancelled ? "line-through text-muted-foreground" : ""}`}
                      >
                      {session.studentName}
                    </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDuration(session.duration)}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md font-medium capitalize"
                        style={
                          isCancelled
                            ? {backgroundColor: "#f1f5f9", color: "#94a3b8"}
                            : {backgroundColor: `${color}15`, color}
                        }
                      >
                      {isCancelled ? "cancelled" : session.type}
                    </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
