"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconLayoutList,
  IconPencil,
  IconPlus,
  IconTrash,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  addSection,
  updateSection,
  deleteSection,
  addVideo,
  updateVideo,
  deleteVideo,
} from "@/actions/courses";
import { getCourseById } from "@/actions/courses";

type Course = NonNullable<Awaited<ReturnType<typeof getCourseById>>>;
type Section = Course["sections"][number];
type Video = Section["videos"][number];

// ── Schemas ───────────────────────────────────────────────────────────────────

const sectionSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
});

const videoSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
  videoLink: z.string().min(1, { message: "Video URL is required." }),
  duration: z.coerce.number().min(0),
});

type SectionFormValues = z.infer<typeof sectionSchema>;
type VideoFormInput = z.input<typeof videoSchema>;
type VideoFormValues = z.output<typeof videoSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DialogHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-border/60">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Section dialog ────────────────────────────────────────────────────────────

function SectionDialog({
  courseId,
  section,
  children,
}: {
  courseId: number;
  section?: Section;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: section?.title ?? "",
      description: section?.description ?? "",
    },
  });

  const isEdit = !!section;

  const onSubmit = async (values: SectionFormValues) => {
    setLoading(true);
    const res = isEdit
      ? await updateSection(section.id, values)
      : await addSection(courseId, values);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
      if (!isEdit) form.reset();
      setOpen(false);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset({ title: section?.title ?? "", description: section?.description ?? "" }); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader
          title={isEdit ? "Edit Section" : "Add Section"}
          subtitle={isEdit ? "Update section details" : "Add a new section to this course"}
          onClose={() => setOpen(false)}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Introduction" className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description{" "}
                    <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} className="rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                {isEdit ? "Save changes" : "Add section"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Video dialog ──────────────────────────────────────────────────────────────

function VideoDialog({
  sectionId,
  video,
  children,
}: {
  sectionId: number;
  video?: Video;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isEdit = !!video;

  const form = useForm<VideoFormInput, unknown, VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: video?.title ?? "",
      description: video?.description ?? "",
      videoLink: video?.videoLink ?? "",
      duration: video?.duration ?? 0,
    },
  });

  const onSubmit = async (values: VideoFormValues) => {
    setLoading(true);
    const res = isEdit
      ? await updateVideo(video.id, values)
      : await addVideo(sectionId, values);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
      if (!isEdit) form.reset();
      setOpen(false);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset({ title: video?.title ?? "", description: video?.description ?? "", videoLink: video?.videoLink ?? "", duration: video?.duration ?? 0 }); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader
          title={isEdit ? "Edit Video" : "Add Video"}
          subtitle={isEdit ? "Update video details" : "Add a new video to this section"}
          onClose={() => setOpen(false)}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Lesson 1 — Greetings" className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    S3 Video URL
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://your-bucket.s3.amazonaws.com/..." className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Duration{" "}
                    <span className="normal-case font-normal text-muted-foreground/50">(seconds)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value as number} type="number" min={0} placeholder="e.g. 300" className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description{" "}
                    <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} className="rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                {isEdit ? "Save changes" : "Add video"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Video row ─────────────────────────────────────────────────────────────────

function VideoRow({ video, sectionId }: { video: Video; sectionId: number }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete "${video.title}"?`)) return;
    setDeleting(true);
    const res = await deleteVideo(video.id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setDeleting(false);
  };

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
        <IconVideo className="w-3.5 h-3.5 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {video.title}
        </p>
        {video.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {video.description}
          </p>
        )}
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
        {formatDuration(video.duration)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <VideoDialog sectionId={sectionId} video={video}>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600">
            <IconPencil className="w-3.5 h-3.5" />
          </Button>
        </VideoDialog>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconTrash className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ── Section row ───────────────────────────────────────────────────────────────

function SectionRow({ section, courseId }: { section: Section; courseId: number }) {
  const [expanded, setExpanded] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete "${section.title}" and all its videos?`)) return;
    setDeleting(true);
    const res = await deleteSection(section.id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setDeleting(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {expanded ? (
            <IconChevronDown className="w-4 h-4" />
          ) : (
            <IconChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
          <IconLayoutList className="w-3.5 h-3.5 text-indigo-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {section.title}
          </p>
          {section.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {section.description}
            </p>
          )}
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
          {section.videos.length} {section.videos.length === 1 ? "video" : "videos"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <SectionDialog courseId={courseId} section={section}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600">
              <IconPencil className="w-3.5 h-3.5" />
            </Button>
          </SectionDialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconTrash className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Videos */}
      {expanded && (
        <div className="p-2">
          {section.videos.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
              No videos yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {section.videos.map((video) => (
                <VideoRow key={video.id} video={video} sectionId={section.id} />
              ))}
            </div>
          )}

          <div className="px-2 pt-1 pb-0.5">
            <VideoDialog sectionId={section.id}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 w-full justify-start"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Add video
              </Button>
            </VideoDialog>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SectionsManager({ course }: { course: Course }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Sections & Videos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {course.sections.length} {course.sections.length === 1 ? "section" : "sections"} ·{" "}
            {course.sections.reduce((acc, s) => acc + s.videos.length, 0)} videos
          </p>
        </div>
        <SectionDialog courseId={course.id}>
          <Button size="sm" className="gap-1.5">
            <IconPlus className="w-3.5 h-3.5" />
            Add section
          </Button>
        </SectionDialog>
      </div>

      <div className="p-6">
        {course.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <IconLayoutList className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No sections yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Add your first section to start organising videos into this course.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {course.sections.map((section) => (
              <SectionRow key={section.id} section={section} courseId={course.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}