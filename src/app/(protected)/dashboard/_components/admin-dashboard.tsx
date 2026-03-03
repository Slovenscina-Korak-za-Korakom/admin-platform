import {getDailySessionStats, getRegularSessions, getTutorHoursByDate, getTutors} from "@/actions/admin-actions";
import {TutorHoursOverview} from "@/app/(protected)/dashboard/_components/tutor-hours-overview";

export type HoursFilter = "all" | "7d" | "14d" | "30d" | "90d" | "this_month" | "last_month";

export function getDateFromFilter(filter: string | undefined): Date | undefined {
  const now = new Date();
  switch (filter as HoursFilter) {
    case "7d": { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case "14d": { const d = new Date(now); d.setDate(d.getDate() - 14); return d; }
    case "30d": { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case "90d": { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
    case "this_month": return new Date(now.getFullYear(), now.getMonth(), 1);
    case "last_month": return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    default: return undefined;
  }
}

export const AdminDashboard = async ({filter}: { filter?: string }) => {
  const activeFilter: HoursFilter = (filter as HoursFilter) ?? "all";

  const [tutorHours, dailyStats, regularSessions, tutors] = await Promise.all([
    getTutorHoursByDate(getDateFromFilter(filter)),
    getDailySessionStats(getDateFromFilter(filter)),
    getRegularSessions(),
    getTutors()
  ]);

  if (tutorHours.status !== 200) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Hours</h1>
          <p className="text-muted-foreground mt-1">
            View tutor hours broken down by session type
          </p>
        </div>
        <div className="text-destructive">
          {tutorHours.message || "Failed to load tutor hours"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <TutorHoursOverview tutors={tutors.data ?? []} data={tutorHours.data} dailyData={dailyStats} regularData={regularSessions} activeFilter={activeFilter}/>
    </div>
  );
};
