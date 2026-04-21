/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {useReverification, useUser} from "@clerk/nextjs";
import { LoaderCircle } from "lucide-react";
import { VerificationComponent } from "./verification-component";
import { SessionVerificationLevel } from "@clerk/types";

const formSchema = z.object({
  password: z.string().min(8).max(50),
  confirmPassword: z.string().min(8).max(50),
});

const PasswordForm = ({setOpen}: {setOpen: (x: boolean) => void}) => {
  const { user } = useUser();
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Temporarily mock reverification for development - set to null when done
  const [needsReverification, setNeedsReverification] = useState<{
    complete: () => void;
    cancel: () => void;
    level: SessionVerificationLevel | undefined;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const changePassword = useReverification(
    async (vals: { newPassword: string }) => {
      if (!user) return;
      return await user.updatePassword({
        newPassword: vals.newPassword,
        signOutOfOtherSessions: true,
      });
    },
    {
      onNeedsReverification: ({ complete, cancel, level }) => {
        setNeedsReverification({ complete, cancel, level });
      },
    }
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match!");
      setIsSubmitting(false);
      return;
    }

    try {
      await changePassword({
        newPassword: values.password,
      });
      toast.success("Password updated successfully");
      setOpen(false)
    } catch (err: any) {
      console.error(err);
      toast.error(err.errors?.[0]?.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <Form {...form}>
      {needsReverification ? (
        <VerificationComponent
          level={needsReverification.level}
          onComplete={() => {
            needsReverification.complete();
            setNeedsReverification(null);
            setIsSubmitting(false);
          }}
          onCancel={() => {
            needsReverification.cancel();
            setNeedsReverification(null);
            setIsSubmitting(false);
          }}
        />
      ) : (
        <>
          <h1 className="text-lg font-semibold tracking-[-0.001rem] pb-1">
            Change password
          </h1>
          <p className="text-sm text-foreground/60 pb-6">
            Enter your new password
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 w-10/12"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      type="password"
                      placeholder="Enter new password"
                      className="focus-visible:ring-0 py-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      type="password"
                      className="focus-visible:ring-0"
                      placeholder="Confirm password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{error}</FormMessage>
                </FormItem>
              )}
            />
            <div className="flex flex-col items-center gap-2">
              <Button disabled={isSubmitting} type="submit" className="w-full">
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : "Submit"}
              </Button>
              <Button
                disabled={isSubmitting}
                type="button"
                onClick={() => setOpen(false)}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </>
      )}
    </Form>
  );
};

export default PasswordForm;
