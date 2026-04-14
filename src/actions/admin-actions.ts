"use server";

import {auth, clerkClient} from "@clerk/nextjs/server";
import db from "@/db";
import {cancelledRegularSessionsTable, regularInvitationsTable, timeblocksTable, tutorsTable} from "@/db/schema";
import {and, asc, count, eq, gt, gte, lt, sql, sum} from "drizzle-orm";
import {addDays, startOfDay} from "date-fns";
import {fromZonedTime, toZonedTime} from "date-fns-tz";


export interface TodaySessions {
  id: number;
  tutorId: number;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  startTime: Date;
  type: string;
  duration: number;
  status: string;
}

export interface AllCancelledSessions {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  reason: string;
  startTime: Date;
  type: string;
  cancelledAt: Date;
}

export interface DailySessionStat {
  date: string;
  tutorId: number;
  tutorName: string;
  tutorColor: string;
  sessionCount: number;
  totalMinutes: number;
}

export interface RegularSessionsWithName {
  id: number;
  tutorId: number;
  studentId: string;
  dayOfWeek: number;
  startTime: string; // wall-clock HH:mm in `timezone`
  status: string;
  duration: number;
  timezone: string | null; // IANA name
  updatedAt: Date;
  studentName: string;
  studentAvatar: string;
}

export interface RegularSession {
  id: number;
  tutorId: number;
  tutorName: string;
  tutorColor: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
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
          totalMinutes: sum(timeblocksTable.duration),
          sessionCount: count(),
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
        totalMinutes: Number(row.totalMinutes) || 0,
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
        sessionCount: count(),
        totalMinutes: sum(timeblocksTable.duration),
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

    const data = results.map(r => ({...r, totalMinutes: Number(r.totalMinutes) || 0}));
    return {message: "Success", status: 200, data: data as DailySessionStat[]};
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



export const getAllRegularSessions = async () => {

  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401, data: [] as RegularSessionsWithName[]};
  }

  try {
    const regularSessions = await db.select({
      id: regularInvitationsTable.id,
      tutorId: regularInvitationsTable.tutorId,
      studentId: regularInvitationsTable.studentClerkId,
      dayOfWeek: regularInvitationsTable.dayOfWeek,
      startTime: regularInvitationsTable.startTime,
      status: regularInvitationsTable.status,
      duration: regularInvitationsTable.duration,
      timezone: regularInvitationsTable.timezone,
      updatedAt: regularInvitationsTable.updatedAt,
    })
      .from(regularInvitationsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(eq(tutorsTable.clerkId, userId)).orderBy(regularInvitationsTable.dayOfWeek, regularInvitationsTable.startTime);


    const studentIds = [...new Set(regularSessions.map(s => s.studentId).filter((id): id is string => id !== null))];
    const userMap = await getUserInfo(studentIds);
    const data = regularSessions.map(s => ({
      ...s,
      studentName: s.studentId ? (userMap.get(s.studentId)?.name ?? "Unknown") : "Unknown",
      studentAvatar: s.studentId ? (userMap.get(s.studentId)?.avatar ?? "") : "",
    }));

    return {
      message: "Success",
      status: 200,
      data: data as RegularSessionsWithName[],
    };

  } catch (error) {
    console.error(error);
    return {
      message: "Error fetching regular sessions",
      status: 500,
      data: [] as RegularSessionsWithName[],
    };
  }
}


export const getUserInfo = async (studentIds: string[]): Promise<Map<string, { name: string; avatar: string }>> => {
  const client = await clerkClient();
  const {data: users} = await client.users.getUserList({userId: studentIds});
  return new Map(users.map(u => [u.id, {name: u.fullName ?? "Unknown", avatar: u.imageUrl}]));
}

export const getTodaySessions = async (timezone: string = "UTC") => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401, data: [] as TodaySessions[]};
  }

  try {
    const nowInTZ = toZonedTime(new Date(), timezone);
    const startOfToday = fromZonedTime(startOfDay(nowInTZ), timezone);
    const startOfTomorrow = fromZonedTime(addDays(startOfDay(nowInTZ), 1), timezone);
    const todayDayOfWeek = nowInTZ.getDay();

    const sessions = await db.select({
      id: timeblocksTable.id,
      tutorId: timeblocksTable.tutorId,
      studentId: timeblocksTable.studentId,
      startTime: timeblocksTable.startTime,
      type: timeblocksTable.sessionType,
      duration: timeblocksTable.duration,
      status: timeblocksTable.status,
    }).from(timeblocksTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, timeblocksTable.tutorId))
      .where(and(
        eq(tutorsTable.clerkId, userId),
        gte(timeblocksTable.startTime, startOfToday),
        lt(timeblocksTable.startTime, startOfTomorrow),
      )).orderBy(timeblocksTable.startTime);

    const regularSessions = await db.select({
      id: regularInvitationsTable.id,
      tutorId: regularInvitationsTable.tutorId,
      studentId: regularInvitationsTable.studentClerkId,
      startTime: regularInvitationsTable.startTime,
      duration: regularInvitationsTable.duration,
      timezone: regularInvitationsTable.timezone,
    }).from(regularInvitationsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(and(
        eq(tutorsTable.clerkId, userId),
        eq(regularInvitationsTable.dayOfWeek, todayDayOfWeek),
        eq(regularInvitationsTable.status, "accepted"),
      ));

    const cancelledToday = await db.select({
      invitationId: cancelledRegularSessionsTable.invitationId,
    }).from(cancelledRegularSessionsTable)
      .where(and(
        gte(cancelledRegularSessionsTable.cancelledDate, startOfToday),
        lt(cancelledRegularSessionsTable.cancelledDate, startOfTomorrow),
      ));

    const cancelledIds = new Set(cancelledToday.map(c => c.invitationId));

    const allStudentIds = [...new Set([
      ...sessions.map(s => s.studentId),
      ...regularSessions.map(s => s.studentId).filter((id): id is string => id !== null),
    ])];
    const userMap = await getUserInfo(allStudentIds);

    const timeblocksData = sessions.map(s => ({
      ...s,
      studentName: userMap.get(s.studentId)?.name ?? "Unknown",
      studentAvatar: userMap.get(s.studentId)?.avatar ?? "",
    }));

    const regularData = regularSessions.map(s => {
      const [hours, minutes] = s.startTime.split(":").map(Number);
      const tz = s.timezone ?? timezone;
      const nowInTZ = toZonedTime(new Date(), tz);
      const wallClockDate = new Date(nowInTZ.getFullYear(), nowInTZ.getMonth(), nowInTZ.getDate(), hours, minutes, 0, 0);
      const startTimeUtc = fromZonedTime(wallClockDate, tz);
      return {
        id: s.id,
        tutorId: s.tutorId,
        studentId: s.studentId ?? "",
        studentName: s.studentId ? (userMap.get(s.studentId)?.name ?? "Unknown") : "Unknown",
        studentAvatar: s.studentId ? (userMap.get(s.studentId)?.avatar ?? "") : "",
        startTime: startTimeUtc,
        type: "regular",
        duration: s.duration,
        status: !cancelledIds.has(s.id) ? "regular": "cancelled",
      };
    });

    const data = [...timeblocksData, ...regularData].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    return {message: "Success", status: 200, data: data as TodaySessions[]};

  } catch (error) {
    console.error(error);
    return {message: "Error fetching today sessions", status: 500, data: [] as TodaySessions[]};
  }
}


export const getAllCancelledSessions = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401, data: [] as AllCancelledSessions[]};
  }


  try {
    const timeblockData = await db.select({
      studentId: timeblocksTable.studentId,
      startTime: timeblocksTable.startTime,
      type: timeblocksTable.sessionType,
      cancelledAt: timeblocksTable.updatedAt
    })
      .from(timeblocksTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, timeblocksTable.tutorId))
      .where(and(
        eq(tutorsTable.clerkId, userId),
        eq(timeblocksTable.status, "cancelled"),
        gte(timeblocksTable.startTime, new Date()),
      ));

    const regularData = await db.select({
      studentId: regularInvitationsTable.studentClerkId,
      startTime: cancelledRegularSessionsTable.cancelledDate,
      reason: cancelledRegularSessionsTable.reason,
      cancelledAt: cancelledRegularSessionsTable.createdAt,
    })
      .from(cancelledRegularSessionsTable)
      .innerJoin(regularInvitationsTable, eq(regularInvitationsTable.id, cancelledRegularSessionsTable.invitationId))
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(and(
        eq(tutorsTable.clerkId, userId),
        gte(cancelledRegularSessionsTable.cancelledDate, new Date()),
      ))

    const studentIdsTimeblock = [...new Set(timeblockData.map(s => s.studentId))];
    const userMapTimeblock = await getUserInfo(studentIdsTimeblock);
    const dataTimeblock = timeblockData.map(s => ({
      ...s,
      reason: "",
      studentName: userMapTimeblock.get(s.studentId)?.name ?? "Unknown",
      studentAvatar: userMapTimeblock.get(s.studentId)?.avatar ?? "",
    }));

    const studentIdsRegular = [...new Set(regularData.map(s => s.studentId).filter((id): id is string => id !== null))];
    const userMapRegular = await getUserInfo(studentIdsRegular);
    const dataRegular = regularData.map(s => ({
      ...s,
      type: "regular",
      studentName: s.studentId ? (userMapRegular.get(s.studentId)?.name ?? "Unknown") : "Unknown",
      studentAvatar: s.studentId ? (userMapRegular.get(s.studentId)?.avatar ?? "") : "",
    }));



    return {message: "Success", status: 200, data: [...dataTimeblock, ...dataRegular] as AllCancelledSessions[]}


  } catch (error) {
    console.error(error);
    return {message: "Error fetching cancelled sessions", status: 500, data: [] as AllCancelledSessions[]};
  }
}
