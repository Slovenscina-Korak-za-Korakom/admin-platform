import {
  IconChalkboard,
  IconDashboard,
  IconLanguage,
  IconSettings,
  IconVideo,
  IconClock,
} from "@tabler/icons-react";

export const SIDEBAR_DATA = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Language Club",
      url: "/language-club",
      icon: IconLanguage,
    },
    {
      title: "My Schedule",
      url: "/my-schedule",
      icon: IconClock,
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: IconChalkboard,
    },
    {
      title: "Course Management",
      url: "/course-management",
      icon: IconVideo,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
};
