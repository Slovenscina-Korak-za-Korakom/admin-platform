"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { IconBook, IconCheck, IconX } from "@tabler/icons-react";
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
import { addCourse } from "@/actions/courses";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  thumbnail: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal("")),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
});
const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-500/20 text-green-700",
  A2: "bg-emerald-500/20 text-emerald-700",
  B1: "bg-blue-500/20 text-blue-700",
  B2: "bg-indigo-500/20 text-indigo-700",
  C1: "bg-purple-500/20 text-purple-700",
};

export default function AddCourseDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  type FormValues = z.infer<typeof courseSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      level: "A1",
    },
  });

  const title = form.watch("title");
  const level = form.watch("level");

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const res = await addCourse(values);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
      form.reset();
      setOpen(false);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconBook className="w-4 h-4" />
          New Course
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden" showCloseButton={false}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row"
          >
            {/* Left preview panel */}
            <div
              className="sm:w-[200px] shrink-0 flex flex-col"
              style={{
                background:
                  "linear-gradient(170deg, #7c3aed 0%, #4f46e5 55%, #2563eb 100%)",
              }}
            >
              <div className="px-6 pt-7 pb-5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                  <IconBook className="h-5 w-5 text-white" />
                </div>
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                  New Course
                </p>
                <h2 className="text-white text-xl font-bold leading-snug break-words">
                  {title || "Course Preview"}
                </h2>
              </div>

              <div className="px-6 flex-1 space-y-3">
                {level && (
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[level] ?? "bg-white/15 text-white/80"}`}
                  >
                    {level}
                  </span>
                )}
              </div>

              <div className="p-5 pt-4 space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconCheck className="h-4 w-4 mr-1.5" />
                  )}
                  Create Course
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full text-white/60 hover:text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Right fields panel */}
            <div className="flex-1 flex flex-col bg-background">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Course Details
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fill in all the required fields
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

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Slovenian for Beginners"
                          className="rounded-xl"
                        />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
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
                        <Textarea
                          {...field}
                          placeholder="Describe the course..."
                          rows={3}
                          className="rounded-xl resize-none"
                        />
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
                        <span className="text-muted-foreground/50 normal-case font-normal">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          className="rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
