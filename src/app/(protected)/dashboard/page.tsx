import { isAdmin} from "@/actions/admin-actions";
import {AdminDashboard} from "@/app/(protected)/dashboard/_components/admin-dashboard";
import {TutorDashboard} from "@/app/(protected)/dashboard/_components/tutor-dashboard";
import {TimezoneSync} from "@/app/(protected)/dashboard/_components/timezone-sync";
import {Suspense} from "react";


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tz?: string }>;
}) {
  const isUserAdmin = await isAdmin();
  const {filter, tz} = await searchParams;
  const timezone = tz ?? "UTC";

  if (isUserAdmin && false) return <AdminDashboard filter={filter} />;

  return (
    <>
      <Suspense><TimezoneSync /></Suspense>
      <TutorDashboard timezone={timezone} />
    </>
  );
}

// TODO:  TUTOR DASHBOARD
//  - notification cancellations on top
//  - today's calendar (events)
//  - list of clients (names) and when do they have the session (regulars)
//  - list of confirmed regular clients
