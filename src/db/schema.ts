import {
  integer,
  pgTable,
  text,
  timestamp,
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

export const langClubTable = pgTable("lang_club", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tutor: varchar({length: 255}).notNull(),
  date: timestamp().notNull(),
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
  timezone: varchar({length: 100}), // IANA name, e.g. 'America/Los_Angeles'
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
  color: varchar({length: 50}),
  timezone: varchar({length: 100}), // IANA name, e.g. 'America/Los_Angeles'
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
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
