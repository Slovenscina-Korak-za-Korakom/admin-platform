"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  IconLanguage,
  IconMapPin,
  IconStopwatch,
  IconUsers,
  IconCheck,
  IconCalendar,
  IconX,
  IconCurrencyEuro,
} from "@tabler/icons-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { addEvent, editEvent } from "@/actions/language-club";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { Booking } from "../booking/_components/bookings";

export const eventSchema = z.object({
  theme: z.string().min(2, { message: "Theme must be at least 2 characters." }),
  tutor: z.string().min(2, { message: "Tutor must be at least 2 characters." }),
  date: z.string().min(1, { message: "Date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  price: z.string().min(1, { message: "Price is required." }),
  level: z.string().min(1, { message: "Level is required." }),
  duration: z.string().min(1, { message: "Duration is required." }),
  spots: z.string().min(1, { message: "Spots is required." }),
  location: z.string().min(1, { message: "Location is required." }),
});

const AddEventForm = ({
  setIsOpen,
  booking,
}: {
  setIsOpen: (isOpen: boolean) => void;
  booking?: Booking | null;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      theme: booking?.theme || "",
      tutor: booking?.tutor || "",
      date: booking ? new Date(booking.date).toISOString().split("T")[0] : "",
      time: booking
        ? toZonedTime(new Date(booking.date), "Europe/Ljubljana")
            .toTimeString()
            .slice(0, 5)
        : "",
      description: booking?.description || "",
      price: booking?.price.toString() || "",
      level: booking?.level || "",
      duration: booking?.duration?.toString() || "",
      spots: booking?.maxBooked?.toString() || "",
      location: booking?.location || "",
    },
  });

  const theme = form.watch("theme");
  const tutor = form.watch("tutor");
  const date = form.watch("date");
  const price = form.watch("price");
  const level = form.watch("level");
  const spots = form.watch("spots");
  const duration = form.watch("duration");
  const location = form.watch("location");

  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    setIsLoading(true);
    const response = booking
      ? await editEvent(values, booking.id)
      : await addEvent(values);
    if (response.success) {
      toast.success(response.message);
      router.refresh();
      setIsOpen(false);
    } else {
      toast.error(response.message);
    }
    setIsLoading(false);
  };

  const formattedDate = date
    ? toZonedTime(new Date(date), "Europe/Ljubljana").toLocaleDateString(
        "sl-SI",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : null;

  const priceNum = parseFloat(price);
  const formattedPrice = !isNaN(priceNum)
    ? priceNum.toFixed(2)
    : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col sm:flex-row h-full"
      >
        {/* ── LEFT PANEL ── gradient preview */}
        <div
          className="sm:w-[220px] shrink-0 flex flex-col"
          style={{
            background:
              "linear-gradient(170deg, #2563eb 0%, #7c3aed 55%, #6d28d9 100%)",
          }}
        >
          {/* Icon + heading */}
          <div className="px-6 pt-7 pb-5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-5">
              <IconCalendar className="h-5 w-5 text-white" />
            </div>
            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
              {booking ? "Edit Event" : "New Event"}
            </p>
            <h2 className="text-white text-xl font-bold leading-snug break-words">
              {theme || "Event\nPreview"}
            </h2>
          </div>

          {/* Live preview */}
          <div className="px-6 flex-1 space-y-4 overflow-hidden">
            {tutor && (
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                  Tutor
                </p>
                <p className="text-white/85 text-sm font-medium truncate">
                  {tutor}
                </p>
              </div>
            )}

            {formattedDate && (
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                  Date
                </p>
                <p className="text-white/80 text-xs leading-relaxed">
                  {formattedDate}
                </p>
              </div>
            )}

            {formattedPrice && (
              <div>
                <span className="text-[38px] font-extrabold text-white leading-none tabular-nums">
                  €{formattedPrice}
                </span>
              </div>
            )}

            <div className="w-full h-px bg-white/10" />

            {/* Info badges */}
            <div className="flex flex-wrap gap-1.5">
              {level && (
                <span className="inline-flex items-center gap-1 bg-white/15 text-white/80 text-[11px] px-2 py-0.5 rounded-full">
                  <IconLanguage className="w-2.5 h-2.5" />
                  {level}
                </span>
              )}
              {spots && (
                <span className="inline-flex items-center gap-1 bg-white/15 text-white/80 text-[11px] px-2 py-0.5 rounded-full">
                  <IconUsers className="w-2.5 h-2.5" />
                  {spots}
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center gap-1 bg-white/15 text-white/80 text-[11px] px-2 py-0.5 rounded-full">
                  <IconStopwatch className="w-2.5 h-2.5" />
                  {duration} min
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 bg-white/15 text-white/80 text-[11px] px-2 py-0.5 rounded-full">
                  <IconMapPin className="w-2.5 h-2.5" />
                  {location}
                </span>
              )}
            </div>
          </div>

          {/* Buttons */}
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
              {booking ? "Save Changes" : "Create Event"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── form fields */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Event Details
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fill in all the required fields
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Theme
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Slovenian Cuisine"
                        className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tutor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tutor
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tutor full name"
                        className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Time
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        placeholder="Describe the event..."
                        rows={3}
                        className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Price (EUR)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IconCurrencyEuro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="25.00"
                            className="pl-9 rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                          />
                        </div>
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
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. A1, B2"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="spots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Max Spots
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IconUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="number"
                            placeholder="10"
                            className="pl-9 rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                          />
                        </div>
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
                        Duration (min)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IconStopwatch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="number"
                            placeholder="60"
                            className="pl-9 rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Location
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          {...field}
                          placeholder="e.g. Ljubljana, Online"
                          className="pl-9 rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default AddEventForm;
