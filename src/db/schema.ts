import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  decimal,
  // pgEnum,
  jsonb, pgEnum,
} from "drizzle-orm/pg-core";

// export const sessionStatus = pgEnum("session_status", [
//   "available",
//   "booked",
//   "cancelled",
//   "completed",
//   "no-show",
// ]);

export const tutorLevelEnum = pgEnum("tutor_level", ["junior", "senior"]);
export const courseLevelEnum = pgEnum("course_level", ["A1", "A2", "B1", "B2", "C1"]);
export const courseStatusEnum = pgEnum("course_status", ["upcoming", "active", "deleted"]);

export const langClubTable = pgTable("lang_club", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tutor: varchar({length: 255}).notNull(),
  date: timestamp({withTimezone: true}).notNull(),
  theme: varchar({length: 255}).notNull(),
  description: text(),
  level: text(),
  location: text().notNull(),
  peopleBooked: integer().notNull().default(0),
  maxBooked: integer().notNull().default(0),
  duration: integer(),
  price: decimal({precision: 10, scale: 2}).notNull().default("0"),
  stripeProductId: varchar({length: 255}),
  stripePriceId: varchar({length: 255}),
});

export const langClubBookingsTable = pgTable("lang_club_bookings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer()
    .notNull()
    .references(() => langClubTable.id),
  userId: varchar({length: 255}).notNull(),
  stripeSessionId: varchar({length: 255}),
  stripePaymentIntentId: varchar({length: 255}),
  status: varchar({length: 50}).notNull().default("pending"), // pending, paid, cancelled, refunded
  amount: decimal({precision: 10, scale: 2}).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const timeblocksTable = pgTable("timeblocks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tutorId: integer()
    .notNull()
    .references(() => tutorsTable.id),
  startTime: timestamp({withTimezone: true}).notNull(),
  duration: integer().notNull(),
  status: varchar({length: 255}).notNull(),
  sessionType: varchar({length: 255}).notNull(),
  location: varchar({length: 255}).notNull(),
  studentId: varchar({length: 128}).notNull(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const tutorsTable = pgTable("tutors", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({length: 255}).notNull(),
  email: varchar({length: 255}).notNull().unique(),
  phone: varchar({length: 255}).notNull(),
  bio: text().notNull(),
  avatar: varchar({length: 255}).notNull(),
  color: varchar({length: 255}).notNull(),
  clerkId: varchar({length: 255}).notNull().unique(),
  level: tutorLevelEnum().notNull().default("junior"),
});

export const schedulesTable = pgTable("schedules", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  ownerId: varchar({length: 255}).notNull(),
  schedule: jsonb().notNull(),
  timezone: varchar({length: 100}).notNull(), // IANA name, e.g. 'America/Los_Angeles'
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const regularInvitationsTable = pgTable("regular_invitations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  token: varchar({length: 255}).notNull().unique(),
  tutorId: integer()
    .notNull()
    .references(() => tutorsTable.id),
  studentEmail: varchar({length: 255}).notNull(),
  studentClerkId: varchar({length: 255}),
  status: varchar({length: 50}).notNull().default("pending"),
  dayOfWeek: integer().notNull(),
  startTime: varchar({length: 10}).notNull(), // wall-clock HH:mm in `timezone`
  duration: integer().notNull(),
  location: varchar({length: 255}).notNull(),
  description: text(),
  pricePerSession: decimal({precision: 10, scale: 2}),
  timezone: varchar({length: 100}), // IANA name, e.g. 'America/Los_Angeles'
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  confirmedAt: timestamp({withTimezone: true}),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow(),
});

export const cancelledRegularSessionsTable = pgTable("cancelled_regular_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  invitationId: integer()
    .notNull()
    .references(() => regularInvitationsTable.id),
  cancelledDate: timestamp({withTimezone: true}).notNull(),
  reason: text(),
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
});

export const availableSlotsTable = pgTable("available_slots", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tutorId: integer()
    .notNull()
    .references(() => tutorsTable.id),
  startTime: timestamp({withTimezone: true}).notNull(),
  duration: integer().notNull(),
  sessionType: varchar({length: 255}).notNull(),
  location: varchar({length: 255}).notNull(),
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({length: 128}).notNull(),
  description: text(),
  thumbnail: varchar({length: 255}).notNull().default("https://www.slovenscinakzk.com/meta-image-link.jpg"),
  level: courseLevelEnum().notNull().default("A1"),
  order: integer().notNull().default(0),
  status: courseStatusEnum().notNull().default("upcoming"),
});

export const sectionsTable = pgTable("sections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({length: 128}).notNull(),
  description: text(),
  courseId: integer().notNull().references(() => coursesTable.id),
  isFinished: boolean().default(false),
  order: integer().notNull().default(0),
})

export const videosTable = pgTable("videos", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({length: 128}).notNull(),
  description: text(),
  duration: integer().notNull().default(0),
  videoLink: varchar({length: 128}).notNull().default(""),
  order: integer().notNull().default(0),
  sectionId: integer().notNull().references(() => sectionsTable.id),
  isFinished: boolean().default(false),
})

export const coursesRelations = relations(coursesTable, ({ many }) => ({
  sections: many(sectionsTable),
}));

export const sectionsRelations = relations(sectionsTable, ({ one, many }) => ({
  course: one(coursesTable, { fields: [sectionsTable.courseId], references: [coursesTable.id] }),
  videos: many(videosTable),
}));

export const videosRelations = relations(videosTable, ({ one }) => ({
  section: one(sectionsTable, { fields: [videosTable.sectionId], references: [sectionsTable.id] }),
}));
