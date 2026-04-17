import { getCourses } from "@/actions/courses";
import CourseCard from "./course-card";
import { IconBook } from "@tabler/icons-react";

export default async function CoursesList() {
  const courses = await getCourses();

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <IconBook className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No courses yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Create your first course to get started with course management.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}