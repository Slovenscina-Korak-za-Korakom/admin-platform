"use client";
import { getPeopleBooked } from "@/actions/language-club";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconUsers } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

type User = {
  userId: string;
  coverImage: string;
  name: string | null;
  email: string;
  status: string;
};

const BookingList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const bookingId = useSearchParams().get("id");

  useEffect(() => {
    if (!bookingId) {
      setUsers([]);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await getPeopleBooked(Number(bookingId));
        setUsers(users);
      } catch (error) {
        console.error(error);
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [bookingId]);

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center mb-3">
          <IconUsers className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Select a booking to see participants
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Section header */}
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Participants
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        People who have booked this event.
      </p>

      {loading ? (
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, idx: number) => (
            <li
              key={idx}
              className="flex items-center gap-3 px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl"
            >
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full shrink-0" />
            </li>
          ))}
        </ul>
      ) : users && users.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {users.map((user: User, idx: number) => (
            <li
              key={user.userId || idx}
              className="flex items-center gap-3 px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.coverImage} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                  {user.name?.split(" ")[0][0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                  {user.name || "Unknown"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email || "No email"}
                </p>
              </div>
              <Badge
                variant={
                  user.status === "paid"
                    ? "paid"
                    : user.status === "cancelled"
                    ? "destructive"
                    : "success"
                }
                className="shrink-0 rounded-lg"
              >
                {user.status || "—"}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <IconUsers className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No participants yet
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingList;
