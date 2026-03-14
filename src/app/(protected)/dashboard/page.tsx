import { isAdmin} from "@/actions/admin-actions";
import {TutorDashboard} from "@/app/(protected)/dashboard/_components/tutor-dashboard";
import {TimezoneSync} from "@/app/(protected)/dashboard/_components/timezone-sync";
import {Suspense} from "react";
import {AdminTabs} from "@/app/(protected)/dashboard/_components/admin-tabs";


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tz?: string }>;
}) {
  const isUserAdmin = await isAdmin();
  const {filter, tz} = await searchParams;
  const timezone = tz ?? "UTC";

  if (isUserAdmin) return (
    <AdminTabs filter={filter} timezone={timezone} />
  );

  return (
    <>
      <Suspense><TimezoneSync /></Suspense>
      <TutorDashboard timezone={timezone} />
    </>
  );
}
