/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import db from "@/db";
import {schedulesTable, timeblocksTable, tutorsTable, regularInvitationsTable, cancelledRegularSessionsTable} from "@/db/schema";
import {auth, clerkClient} from "@clerk/nextjs/server";
import {eq, desc, and} from "drizzle-orm";
import {randomUUID} from "crypto";
import {resend} from "@/lib/resend";
import {InvitationEmail} from "@/emails/invitation-email";
import {SessionCancelledEmail} from "@/emails/session-cancelled-email";
import {ScheduleRemovedEmail} from "@/emails/schedule-removed-email";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3001";
}

export const createSchedule = async (data: any, newRegularSlotIds?: string[], timezone?: string) => {
  const {userId} = await auth();
  if (!userId) {
    return {success: false, error: "Unauthorized"};
  }

  if (!data) {
    return {success: false, error: "No data provided"};
  }

  try {
    // Check if a schedule already exists for this user
    const existingSchedule = await db
      .select({
        id: schedulesTable.id,
      })
      .from(schedulesTable)
      .where(eq(schedulesTable.ownerId, userId))
      .limit(1);

    if (existingSchedule.length > 0) {
      // Update existing schedule
      await db
        .update(schedulesTable)
        .set({
          schedule: data,
          timezone: timezone ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schedulesTable.ownerId, userId));
    } else {
      // Create a new schedule
      await db.insert(schedulesTable).values({
        ownerId: userId,
        schedule: data,
        timezone: timezone ?? null,
      });
    }

    // Process regular invitations (only for genuinely new slots)
    await processRegularInvitations(userId, data, newRegularSlotIds, timezone);

    return {success: true, message: "Schedule saved successfully"};
  } catch (error) {
    console.error(error);
    return {success: false, message: "Failed to save schedule"};
  }
};

async function processRegularInvitations(userId: string, daySchedules: any[], newSlotIds?: string[], timezone?: string) {
  // Get tutor info
  const tutors = await db
    .select({id: tutorsTable.id, name: tutorsTable.name})
    .from(tutorsTable)
    .where(eq(tutorsTable.clerkId, userId))
    .limit(1);

  if (tutors.length === 0) return;

  const tutor = tutors[0];
  const baseUrl = getBaseUrl();

  for (const daySchedule of daySchedules) {
    const day = daySchedule.day as number;
    const timeSlots = daySchedule.timeSlots as any[];

    for (const slot of timeSlots) {
      if (slot.sessionType !== "regular" || !slot.email || !slot.studentClerkId) continue;

      // If the caller supplied a specific list of new slot IDs, skip any slot
      // not in that list — this prevents re-inviting students on every save.
      if (newSlotIds !== undefined && !newSlotIds.includes(slot.id)) continue;

      const studentEmail = slot.email as string;
      const studentClerkId = slot.studentClerkId as string;

      // Safety-net: check if an invitation already exists for this tutor + email + day + time
      const existing = await db
        .select({id: regularInvitationsTable.id})
        .from(regularInvitationsTable)
        .where(
          and(
            eq(regularInvitationsTable.tutorId, tutor.id),
            eq(regularInvitationsTable.studentEmail, studentEmail),
            eq(regularInvitationsTable.dayOfWeek, day),
            eq(regularInvitationsTable.startTime, slot.startTime)
          )
        )
        .limit(1);

      if (existing.length > 0) continue;

      const token = randomUUID();

      await db.insert(regularInvitationsTable).values({
        token,
        tutorId: tutor.id,
        studentEmail,
        studentClerkId,
        dayOfWeek: day,
        startTime: slot.startTime,
        duration: slot.duration,
        location: slot.location,
        description: slot.description || null,
        color: slot.color || null,
        timezone: timezone ?? null,
      });

      const acceptUrl = `${baseUrl}/api/invitations/${token}?action=accept`;
      const declineUrl = `${baseUrl}/api/invitations/${token}?action=decline`;

      try {
        await resend.emails.send({
          from: "Slovenščina Korak za Korakom <noreply@slovenscinakzk.com>",
          to: studentEmail,
          subject: `${tutor.name} invited you to a recurring session`,
          react: InvitationEmail({
            tutorName: tutor.name,
            dayOfWeek: day,
            startTime: slot.startTime,
            duration: slot.duration,
            location: slot.location,
            acceptUrl,
            declineUrl,
          })
        });

      } catch (emailError) {
        console.error(`Failed to send invitation email to ${studentEmail}:`, emailError);
      }
    }
  }
}

export const cancelSession = async (sessionId: number) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", status: 401};

  try {
    const session = await db
      .select({
        id: timeblocksTable.id,
        sessionType: timeblocksTable.sessionType,
        studentId: timeblocksTable.studentId,
      })
      .from(timeblocksTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, timeblocksTable.tutorId))
      .where(and(eq(timeblocksTable.id, sessionId), eq(tutorsTable.clerkId, userId)))
      .limit(1);

    if (session.length === 0) return {message: "Session not found", status: 404};

    await db
      .update(timeblocksTable)
      .set({status: "cancelled", updatedAt: new Date()})
      .where(eq(timeblocksTable.id, sessionId));

    // If a booked test session is cancelled, clear the student's one-time-booking metadata
    if (session[0].sessionType === "test" && session[0].studentId) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(session[0].studentId, {
          privateMetadata: { testSession: null },
        });

      } catch (e) {
        console.error("Failed to clear student test session metadata:", e);
        return {message: "Failed to clear student test session metadata!", status: 500};
      }
    }

    return {message: "Session cancelled", status: 200};
  } catch (error) {
    console.error(error);
    return {message: "Failed to cancel session", status: 500};
  }
};

export const getStudentInfo = async (studentId: string) => {
  const {userId} = await auth();
  const client = await clerkClient();
  if (!userId) {
    return {message: "Unauthorized", status: 401};
  }
  const user = await client.users.getUser(studentId);

  if (!user) {
    return {message: "User not found", status: 404};
  }
  return {
    user: {
      name: user.fullName,
      email: user.emailAddresses[0].emailAddress,
      image: user.imageUrl,
    },
    status: 200,
  };
};

export const getScheduleData = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401};
  }

  try {
    const data = await db
      .select({
        id: timeblocksTable.id,
        tutorId: timeblocksTable.tutorId,
        startTime: timeblocksTable.startTime,
        duration: timeblocksTable.duration,
        status: timeblocksTable.status,
        sessionType: timeblocksTable.sessionType,
        location: timeblocksTable.location,
        studentId: timeblocksTable.studentId,
      })
      .from(timeblocksTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, timeblocksTable.tutorId))
      .where(eq(tutorsTable.clerkId, userId));

    return {data: data, status: 200};
  } catch (error) {
    console.log(error);
    return {message: "Error fetching schedule data", status: 500};
  }
};

export const getUserSchedule = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", data: null, status: 401};
  }

  try {
    const schedule = await db
      .select({
        id: schedulesTable.id,
        schedule: schedulesTable.schedule,
        timezone: schedulesTable.timezone,
        createdAt: schedulesTable.createdAt,
        updatedAt: schedulesTable.updatedAt,
      })
      .from(schedulesTable)
      .where(eq(schedulesTable.ownerId, userId))
      .orderBy(desc(schedulesTable.updatedAt))
      .limit(1);

    if (schedule.length === 0) {
      return {data: null, timezone: null, status: 404};
    }

    return {data: schedule[0].schedule, timezone: schedule[0].timezone, status: 200};
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    return {message: "Error fetching user schedule", data: null, status: 500};
  }
};

export const getStudents = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {data: [], status: 401};
  }

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({limit: 100});

    const students = users.data.map((user) => ({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown",
      image: user.imageUrl,
    }));

    return {data: students, status: 200};
  } catch (error) {
    console.error("Error fetching students:", error);
    return {data: [], status: 500};
  }
};

export const getAcceptedRegulars = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {data: [], status: 401};
  }

  try {
    const invitations = await db
      .select({
        id: regularInvitationsTable.id,
        tutorId: regularInvitationsTable.tutorId,
        studentEmail: regularInvitationsTable.studentEmail,
        studentClerkId: regularInvitationsTable.studentClerkId,
        dayOfWeek: regularInvitationsTable.dayOfWeek,
        startTime: regularInvitationsTable.startTime,
        duration: regularInvitationsTable.duration,
        location: regularInvitationsTable.location,
        description: regularInvitationsTable.description,
        color: regularInvitationsTable.color,
        timezone: regularInvitationsTable.timezone,
      })
      .from(regularInvitationsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(
        and(
          eq(tutorsTable.clerkId, userId),
          eq(regularInvitationsTable.status, "accepted")
        )
      );

    return {data: invitations, status: 200};
  } catch (error) {
    console.error("Error fetching accepted regular sessions:", error);
    return {data: [], status: 500};
  }
};

export const getCancelledSessions = async () => {
  const {userId} = await auth();
  if (!userId) {
    return {data: [], status: 401};
  }

  try {
    const cancelled = await db
      .select({
        invitationId: cancelledRegularSessionsTable.invitationId,
        cancelledDate: cancelledRegularSessionsTable.cancelledDate,
      })
      .from(cancelledRegularSessionsTable)
      .innerJoin(
        regularInvitationsTable,
        eq(regularInvitationsTable.id, cancelledRegularSessionsTable.invitationId)
      )
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(eq(tutorsTable.clerkId, userId));

    return {data: cancelled, status: 200};
  } catch (error) {
    console.error("Error fetching cancelled sessions:", error);
    return {data: [], status: 500};
  }
};

export const cancelRegularSession = async (
  invitationId: number,
  cancelledDate: Date,
  reason?: string
) => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401};
  }

  try {
    // Verify the invitation belongs to this tutor
    const invitation = await db
      .select({
        id: regularInvitationsTable.id,
        studentEmail: regularInvitationsTable.studentEmail,
        dayOfWeek: regularInvitationsTable.dayOfWeek,
        startTime: regularInvitationsTable.startTime,
        tutorName: tutorsTable.name,
      })
      .from(regularInvitationsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(
        and(
          eq(regularInvitationsTable.id, invitationId),
          eq(tutorsTable.clerkId, userId)
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return {message: "Invitation not found or unauthorized", status: 404};
    }

    const inv = invitation[0];

    // Insert the cancelled session record
    await db.insert(cancelledRegularSessionsTable).values({
      invitationId,
      cancelledDate,
      reason: reason || null,
    });

    // Format the date for the email
    const formattedDate = cancelledDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send cancellation email to student
    try {
      await resend.emails.send({
        from: "Slovenščina Korak za Korakom <noreply@slovenscinakzk.com>",
        to: inv.studentEmail,
        subject: `Session cancelled for ${formattedDate}`,
        react: SessionCancelledEmail({
          tutorName: inv.tutorName,
          dayOfWeek: inv.dayOfWeek,
          startTime: inv.startTime,
          cancelledDate: formattedDate,
          reason: reason,
        }),
      });
    } catch (emailError) {
      console.error(`Failed to send cancellation email to ${inv.studentEmail}:`, emailError);
    }

    return {message: "Session cancelled successfully", status: 200};
  } catch (error) {
    console.error("Error cancelling session:", error);
    return {message: "Failed to cancel session", status: 500};
  }
};

export const removeRegularScheduleBySlot = async (
  studentEmail: string,
  dayOfWeek: number,
  startTime: string
) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", status: 401};

  try {
    const tutors = await db
      .select({id: tutorsTable.id})
      .from(tutorsTable)
      .where(eq(tutorsTable.clerkId, userId))
      .limit(1);

    if (tutors.length === 0) return {message: "Tutor not found", status: 404};

    const invitation = await db
      .select({id: regularInvitationsTable.id})
      .from(regularInvitationsTable)
      .where(
        and(
          eq(regularInvitationsTable.tutorId, tutors[0].id),
          eq(regularInvitationsTable.studentEmail, studentEmail),
          eq(regularInvitationsTable.dayOfWeek, dayOfWeek),
          eq(regularInvitationsTable.startTime, startTime)
        )
      )
      .limit(1);

    if (invitation.length === 0) return {message: "Invitation not found", status: 404};

    return removeRegularSchedule(invitation[0].id);
  } catch (error) {
    console.error("Error removing regular schedule by slot:", error);
    return {message: "Failed to remove schedule", status: 500};
  }
};

export const removeRegularSchedule = async (invitationId: number) => {
  const {userId} = await auth();
  if (!userId) {
    return {message: "Unauthorized", status: 401};
  }

  try {
    // Verify the invitation belongs to this tutor and get details
    const invitation = await db
      .select({
        id: regularInvitationsTable.id,
        studentEmail: regularInvitationsTable.studentEmail,
        dayOfWeek: regularInvitationsTable.dayOfWeek,
        startTime: regularInvitationsTable.startTime,
        duration: regularInvitationsTable.duration,
        tutorName: tutorsTable.name,
      })
      .from(regularInvitationsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, regularInvitationsTable.tutorId))
      .where(
        and(
          eq(regularInvitationsTable.id, invitationId),
          eq(tutorsTable.clerkId, userId)
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return {message: "Invitation not found or unauthorized", status: 404};
    }

    const inv = invitation[0];

    // Update the invitation status to "removed"
    await db
      .update(regularInvitationsTable)
      .set({
        status: "removed",
        updatedAt: new Date(),
      })
      .where(eq(regularInvitationsTable.id, invitationId));

    // Send schedule removed email to student
    try {
      await resend.emails.send({
        from: "Slovenščina Korak za Korakom <noreply@slovenscinakzk.com>",
        to: inv.studentEmail,
        subject: `Your recurring sessions with ${inv.tutorName} have been discontinued`,
        react: ScheduleRemovedEmail({
          tutorName: inv.tutorName,
          dayOfWeek: inv.dayOfWeek,
          startTime: inv.startTime,
          duration: inv.duration,
        }),
      });
    } catch (emailError) {
      console.error(`Failed to send schedule removal email to ${inv.studentEmail}:`, emailError);
    }

    return {message: "Schedule removed successfully", status: 200};
  } catch (error) {
    console.error("Error removing schedule:", error);
    return {message: "Failed to remove schedule", status: 500};
  }
};
