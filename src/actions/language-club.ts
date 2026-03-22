"use server";

import {eventSchema} from "@/app/(protected)/language-club/_components/add-event-form";
import db from "@/db";
import {langClubBookingsTable, langClubTable} from "@/db/schema";
import {clerkClient} from "@clerk/nextjs/server";
import {eq, ilike} from "drizzle-orm";
import z from "zod";
import {fromZonedTime} from "date-fns-tz";

export async function addEvent(values: z.infer<typeof eventSchema>) {
  const date = fromZonedTime(`${values.date}T${values.time}:00`, values.timezone);
  try {
    await db.insert(langClubTable).values({
      theme: values.theme,
      tutor: values.tutor,
      date,
      description: values.description,
      price: values.price,
      level: values.level,
      duration: Number(values.duration),
      location: values.location,
      peopleBooked: 0,
      maxBooked: Number(values.spots),
      stripeProductId: null,
      stripePriceId: null,
    });
    return {message: "Event added", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error adding event", success: false};
  }
}

export async function editEvent(
  values: z.infer<typeof eventSchema>,
  id: number
) {
  const date = fromZonedTime(`${values.date}T${values.time}:00`, values.timezone);
  try {
    await db
      .update(langClubTable)
      .set({
        theme: values.theme,
        tutor: values.tutor,
        date,
        description: values.description,
        price: values.price,
        level: values.level,
        duration: Number(values.duration),
        location: values.location,
        maxBooked: Number(values.spots),
      })
      .where(eq(langClubTable.id, id));
    return {message: "Event edited", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error editing event", success: false};
  }
}

export async function getBookingById(id: number) {
  try {
    return await db.query.langClubTable.findFirst({
      where: eq(langClubTable.id, id),
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getBookingByTheme(theme: string) {
  try {
    return await db.query.langClubTable.findMany({
      where: ilike(langClubTable.theme, `%${theme}%`),
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export const getPeopleBooked = async (bookingId: number) => {
  const client = await clerkClient();
  try {
    const users = await db
      .select({
        status: langClubBookingsTable.status,
        userId: langClubBookingsTable.userId,
      })
      .from(langClubBookingsTable)
      .innerJoin(
        langClubTable,
        eq(langClubBookingsTable.eventId, langClubTable.id)
      )
      .where(eq(langClubTable.id, bookingId));
    return await Promise.all(
      users.map(async (user: { userId: string; status: string }) => {
        const userData = await client.users.getUser(user.userId);
        return {
          ...user,
          status: user.status,
          coverImage: userData.imageUrl,
          name: userData.fullName,
          email: userData.emailAddresses[0].emailAddress,
        };
      })
    );
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const deleteEvent = async (id: number) => {
  try {
    await db.delete(langClubTable).where(eq(langClubTable.id, id));
    return {message: "Event deleted", success: true};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    if (error?.cause?.code === "23503") {
      return {message: "Event is associated with a booking", success: false};
    }
    return {message: "Error deleting event", success: false};
  }
};
