"use client";

import { useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateTutorProfile } from "@/actions/admin-actions";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#64748b",
];

const formSchema = z.object({
  name: z.string().min(2).max(255),
  phone: z.string().min(1).max(255),
  bio: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
});

type TutorProfileData = {
  name: string;
  phone: string;
  bio: string;
  color: string;
} | null;

const TutorProfileForm = ({
  tutor,
  isLoaded,
  formId,
}: {
  tutor: TutorProfileData;
  isLoaded: boolean;
  formId?: string;
}) => {
  const [, startTransition] = useTransition();
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone: "", bio: "", color: "#6366f1" },
  });

  useEffect(() => {
    if (isLoaded && tutor) {
      form.reset({
        name: tutor.name,
        phone: tutor.phone,
        bio: tutor.bio,
        color: tutor.color,
      });
    }
  }, [isLoaded, tutor, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await updateTutorProfile(values);
      if (result.status === 200) {
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to update profile", { description: result.message });
      }
    });
  };

  const skeletonField = (
    <Skeleton
      height={36}
      containerClassName="w-full block leading-none"
      style={{ border: "1px solid var(--input)", borderRadius: "var(--radius-md)" }}
    />
  );

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-row items-start gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Display name</FormLabel>
                <FormControl>{isLoaded ? <Input {...field} /> : skeletonField}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Phone</FormLabel>
                <FormControl>{isLoaded ? <Input {...field} /> : skeletonField}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                {isLoaded ? (
                  <Textarea rows={4} {...field} />
                ) : (
                  <Skeleton height={96} containerClassName="w-full block leading-none" />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => {
            const isPreset = PRESET_COLORS.includes(field.value);
            return (
              <FormItem>
                <FormLabel>Calendar color</FormLabel>
                <FormControl>
                  {isLoaded ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={cn(
                              "w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center",
                              field.value === color
                                ? "border-foreground scale-110 shadow-sm"
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          >
                            {field.value === color && (
                              <Check size={12} className="text-white drop-shadow" strokeWidth={3} />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: field.value }}
                        />
                        <Input
                          {...field}
                          placeholder="#6366f1"
                          className="w-32 font-mono text-sm"
                        />
                        <input
                          ref={colorPickerRef}
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="sr-only"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(!isPreset && "border-foreground")}
                          onClick={() => colorPickerRef.current?.click()}
                        >
                          Custom
                        </Button>
                      </div>
                    </div>
                  ) : (
                    skeletonField
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

      </form>
    </Form>
  );
};

export default TutorProfileForm;