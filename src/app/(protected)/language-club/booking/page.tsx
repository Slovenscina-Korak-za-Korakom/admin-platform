import BookingList from "./_components/booking-list";
import Bookings from "./_components/bookings";
import { IconCalendarEvent, IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

const BookingsPage = () => {
  return (
    <div className="flex flex-col gap-6 w-full p-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="relative">
          <Link
            href="/language-club"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <IconChevronLeft className="w-4 h-4" />
            Back to Language Club
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shrink-0">
              <IconCalendarEvent className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Event Bookings
              </h1>
              <p className="text-blue-100 text-sm mt-0.5">
                View booking details and participant lists
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <Bookings />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <BookingList />
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
