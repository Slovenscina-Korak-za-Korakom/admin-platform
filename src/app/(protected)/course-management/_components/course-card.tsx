"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconEdit,
  IconTrash,
  IconVideo,
  IconLayoutList,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { deleteCourse } from "@/actions/courses";
import { getCourses } from "@/actions/courses";

type Course = Awaited<ReturnType<typeof getCourses>>[number];

const LEVEL_BADGE: Record<string, string> = {
  A1: "bg-green-100 text-green-700 border-green-200",
  A2: "bg-emerald-100 text-emerald-700 border-emerald-200",
  B1: "bg-blue-100 text-blue-700 border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function CourseCard({ course }: { course: Course }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const sectionCount = course.sections.length;
  const videoCount = course.sections.reduce(
    (acc, s) => acc + s.videos.length,
    0,
  );

  const handleDelete = async () => {
    if (!confirm(`Delete "${course.title}"? This will remove all sections and videos.`)) return;
    setDeleting(true);
    const res = await deleteCourse(course.id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setDeleting(false);
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="absolute top-3 left-3">
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${LEVEL_BADGE[course.level] ?? "bg-white/20 text-white border-white/20"}`}
          >
            {course.level}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href={`/course-management/${course.id}`}>
                <IconEdit className="w-4 h-4" />
                Manage course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 bg-red-50 hover:!bg-red-100 text-destructive hover:!text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <IconTrash className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <IconLayoutList className="w-3.5 h-3.5" />
            {sectionCount} {sectionCount === 1 ? "section" : "sections"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <IconVideo className="w-3.5 h-3.5" />
            {videoCount} {videoCount === 1 ? "video" : "videos"}
          </span>
          <Link
            href={`/course-management/${course.id}`}
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            Manage →
          </Link>
        </div>
      </div>
    </div>
  );
}
