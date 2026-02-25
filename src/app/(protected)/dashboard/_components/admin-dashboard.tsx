import {getAllTutorHoursByType} from "@/actions/admin-actions";
import {TutorHoursOverview} from "@/app/(protected)/dashboard/_components/tutor-hours-overview";

export const AdminDashboard = async () => {

  const result = await getAllTutorHoursByType();

  if (result.status !== 200) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Hours</h1>
          <p className="text-muted-foreground mt-1">
            View tutor hours broken down by session type
          </p>
        </div>
        <div className="text-destructive">
          {result.message || "Failed to load tutor hours"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Hours</h1>
          <p className="text-muted-foreground mt-1">
            View tutor hours broken down by session type
          </p>
        </div>
      </div>

      {/* Tutor Hours Overview */}
      <TutorHoursOverview data={result.data}/>
    </div>
  );
};
