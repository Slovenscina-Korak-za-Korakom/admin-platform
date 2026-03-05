import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconCalendarEvent,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";
import {
  getAllCancelledSessions,
  getAllRegularSessions,
  getTodaySessions
} from "@/actions/admin-actions";
import {CancellationAlerts} from "@/app/(protected)/dashboard/_components/cancellation-alerts";
import {TodayTimeline} from "@/app/(protected)/dashboard/_components/today-timeline";
import {RegularClientsCard} from "@/app/(protected)/dashboard/_components/regular-clients-card";


export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}


export const TutorDashboard = async ({timezone}: {timezone: string}) => {

  const [cancelledSessions, allRegularSessions, todaysSessions] = await Promise.all([
    getAllCancelledSessions(),
    getAllRegularSessions(),
    getTodaySessions(timezone)
  ])

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Stat summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-100/70 via-blue-50/40 to-transparent dark:from-sky-950/40 dark:via-blue-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sky-900 dark:text-sky-100">Todays Sessions</CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 border border-sky-400/40">
              <IconCalendarEvent className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              {todaysSessions.data.filter((s) => s.status === "booked").length}
            </div>
            <p className="text-xs text-sky-600/75 dark:text-sky-400/75 mt-1">Confirmed for today</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Teaching Hours</CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-400/20 to-purple-500/20 border border-indigo-400/40">
              <IconClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {formatDuration(
                todaysSessions.data.filter((s) => s.status === "booked").reduce((sum, s) => sum + s.duration, 0)
              )}
            </div>
            <p className="text-xs text-indigo-600/75 dark:text-indigo-400/75 mt-1">Today&apos;s teaching time</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-100/70 via-fuchsia-50/40 to-transparent dark:from-violet-950/40 dark:via-fuchsia-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-900 dark:text-violet-100">Regular Clients</CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-400/20 to-fuchsia-500/20 border border-violet-400/40">
              <IconUsers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{allRegularSessions.data.length} - narobe</div>
            <p className="text-xs text-violet-600/75 dark:text-violet-400/75 mt-1">Active weekly clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Alerts */}
      {cancelledSessions.data.length > 0 && <CancellationAlerts data={cancelledSessions.data} />}

      {/* Main content: Today's timeline + regular clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTimeline data={todaysSessions.data} />
        <RegularClientsCard data={allRegularSessions.data} />
      </div>
    </div>
  );
};

export default TutorDashboard;
