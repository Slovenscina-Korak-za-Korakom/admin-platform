"use server";

import {auth, clerkClient} from "@clerk/nextjs/server";
import db from "@/db";
import {cancelledRegularSessionsTable, regularInvitationsTable, timeblocksTable, tutorsTable} from "@/db/schema";
import {and, asc, eq, gt, lt, sql} from "drizzle-orm";

export interface RegularSession {
  id: number;
  tutorId: number;
  tutorName: string;
  tutorColor: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  color: string | null;
  updatedAt: Date;
}

interface SessionInfo {
  sessionType: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface TutorHoursByType {
  tutorId: number;
  tutorName: string;
  tutorEmail: string;
  tutorColor: string;
  tutorLevel: string;
  sessions: SessionInfo[];
}

export interface CancelData {
  id: number;
  invitationId: number;
  date: Date;
}

export const getTutors = async () => {
  const {userId} = await auth();

  if (!userId) {
    return {message: "Unauthorized", status: 401};
  }

  try {
    const data = await db.select({
      id: tutorsTable.id,
      name: tutorsTable.name,
      email: tutorsTable.email,
      avatar: tutorsTable.avatar,
      level: tutorsTable.level,
      color: tutorsTable.color,
    }).from(tutorsTable);

    return {message: "Success", data, status: 200};

  } catch (error) {
    console.error(error);
    return {message: "Error getting tutor avatar", status: 500}
  }
}

export const isAdmin = async () => {
  const {userId} = await auth();
  if (!userId) {
    return false;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.privateMetadata?.isAdmin;
};

export const checkTutorActivation = async (userId: string) => {
  const client = await clerkClient();
  const response = await client.users.getUser(userId);

  return response.privateMetadata?.isActivated;
};

export const activateTutorAccount = async (formData: FormData) => {
  const {userId} = await auth();
  const client = await clerkClient();

  if (!userId) {
    return {message: "Unauthorized", status: 401};
  }

  const userData = await client.users.getUser(userId);
  if (!userData) {
    return {message: "User not found", status: 404};
  }

  try {
    // Extract form fields
    const phone = formData.get("phone") as string | null;
    const bio = formData.get("bio") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    // Use provided image URL or fallback to Clerk's default
    const avatarUrl = imageUrl || userData.imageUrl || "";

    // Create tutor record
    await db.insert(tutorsTable).values({
      name: userData.fullName || "Unknown",
      email: userData.emailAddresses[0].emailAddress,
      avatar: avatarUrl,
      phone: phone?.trim() || "-",
      bio: bio?.trim() || "-",
      color: "#6366f1",
      clerkId: userId,
    });

    // Set activation flag
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        isActivated: true,
      },
    });

    return {message: "Account activated successfully", status: 200};
  } catch (error) {
    console.error("Activation error:", error);
    return {message: "Error activating account", status: 500};
  }
};


// @formatter:off
export const getTutorHoursByDate = async (date: Date | undefined) => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401, data: []};
  }

  try {
    // Group timeblocks by tutor and sessionType, calculate total hours
    const  results = await db
        .select({
          tutorId: tutorsTable.id,
          tutorName: tutorsTable.name,
          tutorEmail: tutorsTable.email,
          tutorColor: tutorsTable.color,
          tutorLevel: tutorsTable.level,
          sessionType: timeblocksTable.sessionType,
          totalMinutes: sql<number>`SUM(${timeblocksTable.duration})::int`,
          sessionCount: sql<number>`COUNT(*)::int`,
        })
        .from(timeblocksTable)
        .where(
          and(
            eq(timeblocksTable.status, "booked"),
            lt(timeblocksTable.startTime, new Date()),
            date ? gt(timeblocksTable.startTime, date) : undefined,
          )
        )
        .innerJoin(tutorsTable, eq(tutorsTable.id, timeblocksTable.tutorId))
        .groupBy(
          tutorsTable.id,
          tutorsTable.name,
          tutorsTable.email,
          tutorsTable.color,
          timeblocksTable.sessionType
        )
        .orderBy(asc(tutorsTable.name), asc(timeblocksTable.sessionType));


    // Transform the data to include total hours
    const tutorMap = new Map<number, TutorHoursByType>();
    for (const row of results) {
      if (!tutorMap.has(row.tutorId)) {
        tutorMap.set(row.tutorId, {
          tutorId: row.tutorId,
          tutorName: row.tutorName,
          tutorEmail: row.tutorEmail,
          tutorColor: row.tutorColor,
          tutorLevel: row.tutorLevel,
          sessions: [],
        });
      }
      tutorMap.get(row.tutorId)!.sessions.push({
        sessionType: row.sessionType,
        totalMinutes: row.totalMinutes,
        sessionCount: row.sessionCount,
      });

    }
    const data = Array.from(tutorMap.values());

    return {message: "Success", status: 200, data};
  } catch (error) {
    console.error(error);
    return {message: "Error fetching tutor hours", status: 500, data: []};
  }
};
// @formatter:on

export interface DailySessionStat {
  date: string;
  tutorId: number;
  tutorName: string;
  tutorColor: string;
  sessionCount: number;
  totalMinutes: number;
}

// @formatter:off
export const getDailySessionStats = async (date: Date | undefined) => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401, data: [] as DailySessionStat[]};
  }

  try {
    const results = await db
      .select({
        date: sql<string>`TO_CHAR(${timeblocksTable.startTime} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        tutorId: tutorsTable.id,
        tutorName: tutorsTable.name,
        tutorColor: tutorsTable.color,
        sessionCount: sql<number>`COUNT(*)::int`,
        totalMinutes: sql<number>`SUM(${timeblocksTable.duration})::int`,
      })
      .from(timeblocksTable)
      .where(and(
        eq(timeblocksTable.status, "booked"),
        lt(timeblocksTable.startTime, new Date()),
        date ? gt(timeblocksTable.startTime, date) : undefined,
      ))
      .innerJoin(tutorsTable, eq(tutorsTable.id, timeblocksTable.tutorId))
      .groupBy(
        sql`TO_CHAR(${timeblocksTable.startTime} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        tutorsTable.id,
        tutorsTable.name,
        tutorsTable.color,
      )
      .orderBy(asc(sql`TO_CHAR(${timeblocksTable.startTime} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`));

    return {message: "Success", status: 200, data: results as DailySessionStat[]};
  } catch (error) {
    console.error(error);
    return {message: "Error fetching daily session stats", status: 500, data: [] as DailySessionStat[]};
  }
};
// @formatter:on

export const getRegularSessions = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401, data: [] as RegularSession[], cancelData: [] as CancelData[]};
  }

  try {
    const regularSessions = await db.select({
      id: regularInvitationsTable.id,
      tutorId: regularInvitationsTable.tutorId,
      tutorName: tutorsTable.name,
      tutorColor: tutorsTable.color,
      dayOfWeek: regularInvitationsTable.dayOfWeek,
      startTime: regularInvitationsTable.startTime,
      duration: regularInvitationsTable.duration,
      color: regularInvitationsTable.color,
      updatedAt: regularInvitationsTable.updatedAt,
    })
      .from(regularInvitationsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(eq(regularInvitationsTable.status, "accepted"));

    const cancelledSessions = await db.select({
      id: cancelledRegularSessionsTable.id,
      invitationId: cancelledRegularSessionsTable.invitationId,
      date: cancelledRegularSessionsTable.cancelledDate
    }).from(cancelledRegularSessionsTable);


    return {
      message: "Success",
      status: 200,
      data: regularSessions as RegularSession[],
      cancelData: cancelledSessions as CancelData[]
    };

  } catch (error) {
    console.error(error);
    return {
      message: "Error fetching regular sessions",
      status: 500,
      data: [] as RegularSession[],
      cancelData: [] as CancelData[]
    };
  }
}
