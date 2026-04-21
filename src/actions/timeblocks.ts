/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import db from "@/db";
import {
  availableSlotsTable,
  cancelledRegularSessionsTable,
  regularInvitationsTable,
  schedulesTable,
  timeblocksTable,
  tutorsTable
} from "@/db/schema";
import {auth, clerkClient} from "@clerk/nextjs/server";
import {and, desc, eq} from "drizzle-orm";
import {fromZonedTime} from "date-fns-tz";
import {randomUUID} from "crypto";
import {resend} from "@/lib/resend";
import {InvitationEmail} from "@/emails/invitation-email";
import {SessionCancelledEmail} from "@/emails/session-cancelled-email";
import {ScheduleRemovedEmail} from "@/emails/schedule-removed-email";
import {OneTimeSessionEmail} from "@/emails/one-time-session-email";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3001";
}

export const createSchedule = async (data: any, timezone: string, newRegularSlotIds?: string[]) => {
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
          timezone: timezone,
          updatedAt: new Date(),
        })
        .where(eq(schedulesTable.ownerId, userId));
    } else {
      // Create a new schedule
      await db.insert(schedulesTable).values({
        ownerId: userId,
        schedule: data,
        timezone: timezone,
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

      const studentEmail = slot.email as string;
      const studentClerkId = slot.studentClerkId as string;
      const isNewSlot = newSlotIds === undefined || newSlotIds.includes(slot.id);

      // Check if an invitation already exists for this tutor + email + day + time
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

      if (existing.length > 0) {
        // Always sync pricePerSession on existing invitations (handles edits)
        await db
          .update(regularInvitationsTable)
          .set({
            pricePerSession: slot.pricePerSession != null ? String(slot.pricePerSession) : null,
            updatedAt: new Date(),
          })
          .where(eq(regularInvitationsTable.id, existing[0].id));
        continue; // Don't resend the invitation email
      }

      // Only create a new invitation + send email for genuinely new slots
      if (!isNewSlot) continue;

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
        pricePerSession: slot.pricePerSession != null ? String(slot.pricePerSession) : null,
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
          privateMetadata: {testSession: null},
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
  const meta = user.privateMetadata as {
    preferences?: {
      languageLevel?: string;
      learningGoals?: string[];
      preferredTutor?: number;
      preferredSchedule?: string;
    };
  } | null;

  return {
    user: {
      name: user.fullName,
      email: user.emailAddresses[0].emailAddress,
      image: user.imageUrl,
      languageLevel: meta?.preferences?.languageLevel ?? null,
      preferences: meta?.preferences ?? null,
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
    const schedule = await db.query.schedulesTable.findFirst({
      columns: {
        id: true,
        schedule: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
      where: eq(schedulesTable.ownerId, userId),
      orderBy: desc(schedulesTable.updatedAt)

    })
    if (!schedule) {
      return {data: null, status: 404};
    }

    return {data: schedule, status: 200};
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

export const searchStudents = async (query: string) => {
  const {userId} = await auth();
  if (!userId) {
    return {data: [], status: 401};
  }

  if (!query || query.trim().length < 2) {
    return {data: [], status: 200};
  }

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({query: query.trim(), limit: 10});

    const students = users.data.map((user) => ({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown",
      image: user.imageUrl,
    }));

    return {data: students, status: 200};
  } catch (error) {
    console.error("Error searching students:", error);
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
        timezone: regularInvitationsTable.timezone,
        confirmedAt: regularInvitationsTable.confirmedAt,
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

export const createOneTimeSession = async (data: {
  date: string;          // "YYYY-MM-DD"
  startTime: string;     // "HH:mm"
  duration: number;      // minutes
  sessionType: "individual" | "group" | "test";
  location: "online" | "classroom";
  studentClerkId: string;
  timezone: string;
}) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", status: 401};

  try {
    // 1. Get tutor record
    const tutors = await db
      .select({id: tutorsTable.id, name: tutorsTable.name, email: tutorsTable.email})
      .from(tutorsTable)
      .where(eq(tutorsTable.clerkId, userId))
      .limit(1);

    if (tutors.length === 0) return {message: "Tutor not found", status: 404};
    const tutor = tutors[0];

    // 2. Get student info from Clerk
    const client = await clerkClient();
    const studentUser = await client.users.getUser(data.studentClerkId);
    const studentEmail = studentUser.emailAddresses[0]?.emailAddress ?? "";
    const studentName =
      studentUser.fullName ||
      studentUser.firstName ||
      studentEmail ||
      "Student";

    // 3. Build startTime Date — convert from tutor's local timezone to UTC
    const [year, month, day] = data.date.split("-").map(Number);
    const [h, m] = data.startTime.split(":").map(Number);
    const startDateTime = fromZonedTime(
      new Date(year, month - 1, day, h, m, 0, 0),
      data.timezone
    );

    // 4. Compute end time string for email
    const totalMinutes = h * 60 + m + data.duration;
    const endTime =
      `${Math.floor(totalMinutes / 60) % 24}`.padStart(2, "0") +
      ":" +
      `${totalMinutes % 60}`.padStart(2, "0");

    // 5. Format date for email
    const formattedDate = startDateTime.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 6. Insert timeblock
    const [inserted] = await db
      .insert(timeblocksTable)
      .values({
        tutorId: tutor.id,
        startTime: startDateTime,
        duration: data.duration,
        status: "booked",
        sessionType: data.sessionType,
        location: data.location,
        studentId: data.studentClerkId,
      })
      .returning({id: timeblocksTable.id});

    // 7. If test session, set student Clerk metadata
    if (data.sessionType === "test") {
      try {
        await client.users.updateUserMetadata(data.studentClerkId, {
          privateMetadata: {
            testSession: {
              status: "booked",
              sessionId: inserted.id,
            },
          },
        });
      } catch (e) {
        console.error("Failed to update student test session metadata:", e);
      }
    }

    const emailProps = {
      tutorName: tutor.name,
      studentName,
      date: formattedDate,
      startTime: data.startTime,
      endTime,
      duration: data.duration,
      sessionType: data.sessionType,
      location: data.location,
    } as const;

    // 8. Send confirmation email to student
    try {
      await resend.emails.send({
        from: "Slovenščina Korak za Korakom <noreply@slovenscinakzk.com>",
        to: studentEmail,
        subject: `Session with ${tutor.name} confirmed for ${formattedDate}`,
        react: OneTimeSessionEmail({...emailProps, recipientType: "student"}),
      });
    } catch (emailError) {
      console.error("Failed to send student confirmation email:", emailError);
    }

    // 9. Send notification email to tutor
    try {
      await resend.emails.send({
        from: "Slovenščina Korak za Korakom <noreply@slovenscinakzk.com>",
        to: tutor.email,
        subject: `Session with ${studentName} booked for ${formattedDate}`,
        react: OneTimeSessionEmail({...emailProps, recipientType: "tutor"}),
      });
    } catch (emailError) {
      console.error("Failed to send tutor notification email:", emailError);
    }

    return {message: "Session booked successfully", status: 200, data: {id: inserted.id}};
  } catch (error) {
    console.error("Failed to create one-time session:", error);
    return {message: "Failed to create session", status: 500};
  }
};

export const createAvailableSlot = async (data: {
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  duration: number;   // minutes
  sessionType: "individual" | "group" | "test";
  location: "online" | "classroom";
  timezone: string;
}) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", status: 401};

  try {
    const tutors = await db
      .select({id: tutorsTable.id})
      .from(tutorsTable)
      .where(eq(tutorsTable.clerkId, userId))
      .limit(1);

    if (tutors.length === 0) return {message: "Tutor not found", status: 404};

    const [year, month, day] = data.date.split("-").map(Number);
    const [h, m] = data.startTime.split(":").map(Number);
    const startDateTime = fromZonedTime(
      new Date(year, month - 1, day, h, m, 0, 0),
      data.timezone
    );

    await db.insert(availableSlotsTable).values({
      tutorId: tutors[0].id,
      startTime: startDateTime,
      duration: data.duration,
      sessionType: data.sessionType,
      location: data.location,
    });

    return {message: "Available slot created successfully", status: 200};
  } catch (error) {
    console.error("Failed to create available slot:", error);
    return {message: "Failed to create available slot", status: 500};
  }
};

export const deleteAvailableSlot = async (slotId: number) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", status: 401};

  try {
    const tutors = await db
      .select({id: tutorsTable.id})
      .from(tutorsTable)
      .where(eq(tutorsTable.clerkId, userId))
      .limit(1);

    if (tutors.length === 0) return {message: "Tutor not found", status: 404};

    const deleted = await db
      .delete(availableSlotsTable)
      .where(and(eq(availableSlotsTable.id, slotId), eq(availableSlotsTable.tutorId, tutors[0].id)))
      .returning({id: availableSlotsTable.id});

    if (deleted.length === 0) return {message: "Slot not found or unauthorized", status: 404};

    return {message: "Available slot deleted", status: 200};
  } catch (error) {
    console.error("Failed to delete available slot:", error);
    return {message: "Failed to delete available slot", status: 500};
  }
};

export const getAvailableSlots = async () => {
  const {userId} = await auth();
  if (!userId) return {data: [], status: 401};

  try {
    const data = await db
      .select({
        id: availableSlotsTable.id,
        tutorId: availableSlotsTable.tutorId,
        startTime: availableSlotsTable.startTime,
        duration: availableSlotsTable.duration,
        sessionType: availableSlotsTable.sessionType,
        location: availableSlotsTable.location,
      })
      .from(availableSlotsTable)
      .innerJoin(tutorsTable, eq(tutorsTable.id, availableSlotsTable.tutorId))
      .where(eq(tutorsTable.clerkId, userId));

    return {data, status: 200};
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return {data: [], status: 500};
  }
};
