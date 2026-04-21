"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
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
}: {
  tutor: TutorProfileData;
  isLoaded: boolean;
}) => {
  const [isPending, startTransition] = useTransition();

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calendar color</FormLabel>
              <FormControl>
                {isLoaded ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={field.value}
                      onChange={field.onChange}
                      className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-1"
                    />
                    <Input {...field} placeholder="#6366f1" className="w-32" />
                  </div>
                ) : (
                  skeletonField
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TutorProfileForm;