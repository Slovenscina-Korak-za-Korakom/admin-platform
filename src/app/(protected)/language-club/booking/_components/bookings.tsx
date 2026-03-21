"use client";
import { getBookingById, getBookingByTheme } from "@/actions/language-club";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  IconBrush,
  IconCalendar,
  IconClock,
  IconLanguage,
  IconMapPin,
  IconMoneybag,
  IconSearch,
  IconUser,
  IconUsers,
  IconWorldPin,
} from "@tabler/icons-react";
import { toZonedTime } from "date-fns-tz";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define the type for the booking based on the schema
export type Booking = {
  id: number;
  tutor: string;
  date: Date | string;
  theme: string;
  description?: string | null;
  level?: string | null;
  location: string;
  peopleBooked: number;
  maxBooked: number;
  duration?: number | null;
  price: string | number;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
};

const Bookings = () => {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      try {
        const result = await getBookingById(Number(bookingId));
        setBooking(result as Booking);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Error fetching booking");
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error("Please enter a booking theme");
      return;
    }

    try {
      setLoading(true);
      const response = await getBookingByTheme(inputValue.trim());
      if (response) {
        setBookings(response);
        setOpen(true);
      } else {
        toast.error("Booking not found");
      }
    } catch (error) {
      console.error("Error searching for booking:", error);
      toast.error("Error searching for booking");
    }
    setLoading(false);
  };

  return (
    <>
      <div>
        {/* Section header */}
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Event Details
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Search for an event by theme to view its details.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center mb-6">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by theme..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/30 rounded-xl"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-sm shadow-blue-500/25 rounded-xl shrink-0"
          >
            Search
          </Button>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
          </div>
        )}

        {/* Booking card */}
        {!loading && booking && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Card header with gradient */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                {booking.theme}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {booking.tutor}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {booking.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {booking.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                    <IconWorldPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${booking.location}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {booking.location}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                    <IconClock className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span>{booking.duration} min</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <IconUsers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span>
                    {booking.peopleBooked} / {booking.maxBooked} booked
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <IconLanguage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>{booking.level} level</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <IconMoneybag className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="font-medium">{booking.price} EUR</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <IconCalendar className="w-3.5 h-3.5" />
                <span>
                  {toZonedTime(
                    booking.date,
                    "Europe/Ljubljana"
                  ).toLocaleDateString("sl-SI", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {!loading && !booking && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center mb-3">
              <IconSearch className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {bookingId ? "No booking found" : "Search for a booking above"}
            </p>
          </div>
        )}
      </div>

      {/* Event selection dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-fit min-w-[500px] !max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Select Event
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500">
              {bookings.length} event{bookings.length !== 1 ? "s" : ""} found
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`cursor-pointer p-3 border rounded-xl transition-all ${
                  selectedEventId === booking.id
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 ring-1 ring-blue-500/30"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
                onClick={() => setSelectedEventId(booking.id)}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                    <IconBrush className="w-3.5 h-3.5 text-blue-500" />
                    {booking.theme}
                  </p>
                  <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                    <IconUser className="w-3.5 h-3.5" />
                    {booking.tutor}
                  </p>
                  <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                    <IconCalendar className="w-3.5 h-3.5" />
                    {toZonedTime(
                      new Date(booking.date),
                      "Europe/Ljubljana"
                    ).toLocaleDateString("sl-SI", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                    <IconMapPin className="w-3.5 h-3.5" />
                    {booking.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-center pt-2">
            <Button
              disabled={!selectedEventId}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl px-6"
              onClick={() => {
                setOpen(false);
                if (selectedEventId) {
                  router.push(`/language-club/booking?id=${selectedEventId}`);
                } else {
                  toast.error("Please select an event");
                }
              }}
            >
              View Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Bookings;
