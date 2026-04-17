import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconBook } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { getCourseById } from "@/actions/courses";
import EditCourseDialog from "./_components/edit-course-dialog";
import SectionsManager from "./_components/sections-manager";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const id = Number(courseId);
  if (isNaN(id)) notFound();

  const course = await getCourseById(id);
  if (!course) notFound();

  return (
    <div className="flex flex-col gap-6 w-full p-6">
      <Link
        href="/course-management"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <IconArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-blue-600 p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shrink-0 mt-0.5">
              <IconBook className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {course.title}
                </h1>
                <Badge className="bg-white/20 text-white border-0 shrink-0">
                  {course.level}
                </Badge>
              </div>
              {course.description && (
                <p className="text-blue-100 text-sm max-w-xl">{course.description}</p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <EditCourseDialog course={course} />
          </div>
        </div>
      </div>

      <SectionsManager course={course} />
    </div>
  );
}