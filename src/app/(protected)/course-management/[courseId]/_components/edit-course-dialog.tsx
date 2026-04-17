"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCourse } from "@/actions/courses";
import { getCourseById } from "@/actions/courses";

type Course = NonNullable<Awaited<ReturnType<typeof getCourseById>>>;

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

const schema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  thumbnail: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal("")),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
});

type FormValues = z.infer<typeof schema>;

export default function EditCourseDialog({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course.title,
      description: course.description ?? "",
      thumbnail: course.thumbnail,
      level: course.level,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const res = await updateCourse(course.id, values);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
      setOpen(false);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <IconPencil className="w-3.5 h-3.5" />
          Edit course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" showCloseButton={false}>
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h3 className="font-semibold text-foreground">Edit Course</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update course details
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

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
                    <Input {...field} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} className="rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Thumbnail URL{" "}
                    <span className="normal-case font-normal text-muted-foreground/50">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-1.5">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconCheck className="w-4 h-4" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}