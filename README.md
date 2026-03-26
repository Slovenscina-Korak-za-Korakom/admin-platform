# Slovenščina Korak za Korkom - Admin Panel

A modern, feature-rich admin dashboard for managing the **Slovenščina Korak za Korakom** (Slovenščina Korak za Korkom) language
learning platform. Built for tutors and administrators to efficiently manage tutoring sessions, language club events,
team scheduling, and student bookings.

## Overview

This admin panel serves as the central hub for running a language tutoring business. It streamlines the day-to-day
operations of managing one-on-one tutoring sessions, group language club events, and team coordination - all from a
single, intuitive interface.

### Key Features

- **Dashboard Overview** - At-a-glance view of today's events, sessions, pending actions, and recent activity with smart
  alerts for items requiring attention
- **Language Club Management** - Create, edit, and manage group language learning events with capacity tracking,
  pricing, and Stripe payment integration
- **Session Scheduling** - Manage individual tutoring timeblocks with flexible duration settings and location support (
  online/in-person)
- **Team Coordination** - Overview of all tutors, their schedules, and hours breakdown
- **Personal Schedule** - Each tutor can manage their own availability and view their assigned sessions
- **Payment Tracking** - Monitor booking payments with status tracking (pending, paid, cancelled, refunded)

## Tech Stack

| Category       | Technology                         |
|----------------|------------------------------------|
| Framework      | Next.js 16 (App Router, Turbopack) |
| Frontend       | React 19, Tailwind CSS 4           |
| UI Components  | Radix UI, shadcn/ui                |
| Authentication | Clerk (role-based access)          |
| Database       | PostgreSQL (Neon) with Drizzle ORM |
| Calendar       | FullCalendar                       |
| Forms          | React Hook Form + Zod              |
| Drag & Drop    | dnd-kit                            |

## Project Structure

```
src/
├── app/
│   ├── (protected)/          # Authenticated routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── language-club/    # Language club events
│   │   ├── my-schedule/      # Tutor's personal schedule
│   │   ├── sessions/         # Session management
│   │   ├── team/             # Team overview
│   │   └── course-management/# Course management
│   └── sign-in/              # Authentication
├── actions/                  # Server actions
├── components/               # Reusable components
│   └── ui/                   # UI primitives
├── db/                       # Database schema & config
└── lib/                      # Utilities
```

## Architecture Highlights

- **Server Actions** - All data mutations go through type-safe server actions with built-in authentication checks
- **Role-Based Access** - Admin users are managed via environment configuration with Clerk handling authentication
- **Tutor Activation Flow** - New tutors must be activated before accessing the system
- **Timezone Support** - Full timezone handling with `date-fns-tz` for accurate scheduling across regions

## License

Private project - All rights reserved.
