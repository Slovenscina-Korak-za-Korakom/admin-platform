import {OverviewCards} from "./overview-cards";
import {type TodaysEvent, TodaysEvents} from "./todays-events";
import {type TodaysSession, TodaysSessions,} from "./todays-sessions";
import {type Alert, AlertsSection} from "./alerts-section";
import {UpcomingEvents} from "./upcoming-events";
import {type ActivityItem, RecentActivity,} from "./recent-activity";
import {QuickActions} from "./quick-actions";

export const TutorDashboard = () => {

// Placeholder data - realistic data for staff dashboard
  function getPlaceholderData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 3);

    // Today's events
    const todaysEvents: TodaysEvent[] = [
      {
        id: 1,
        theme: "Slovenian Conversation Practice",
        tutor: "Ana Novak",
        date: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
        time: "14:00",
        location: "Online (Zoom)",
        peopleBooked: 8,
        maxBooked: 10,
        price: "25.00",
        level: "Intermediate",
        description: "Practice conversational Slovenian in a relaxed setting",
      },
      {
        id: 2,
        theme: "Grammar Fundamentals",
        tutor: "Marko Petek",
        date: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
        time: "18:00",
        location: "Ljubljana Center",
        peopleBooked: 3,
        maxBooked: 15,
        price: "30.00",
        level: "Beginner",
        description: "Master the basics of Slovenian grammar",
      },
    ];

    // Today's sessions
    const todaysSessions: TodaysSession[] = [
      {
        id: 1,
        studentName: "Sarah Johnson",
        studentId: "user_123",
        tutorName: "Ana Novak",
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
        duration: 60,
        status: "booked",
        sessionType: "private",
        location: "Online",
      },
      {
        id: 2,
        studentName: "Michael Chen",
        studentId: "user_456",
        tutorName: "Marko Petek",
        startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM
        duration: 45,
        status: "booked",
        sessionType: "private",
        location: "Ljubljana Center",
      },
      {
        id: 3,
        studentName: "Emma Williams",
        studentId: "user_789",
        tutorName: "Ana Novak",
        startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4 PM
        duration: 60,
        status: "booked",
        sessionType: "private",
        location: "Online",
      },
      {
        id: 4,
        studentName: "Available Slot",
        studentId: "",
        tutorName: "Marko Petek",
        startTime: new Date(today.getTime() + 20 * 60 * 60 * 1000), // 8 PM
        duration: 60,
        status: "available",
        sessionType: "private",
        location: "Online",
      },
    ];

    // Upcoming events (next 7 days)
    const upcomingEvents: TodaysEvent[] = [
      {
        id: 3,
        theme: "Cultural Immersion Workshop",
        tutor: "Ana Novak",
        date: new Date(tomorrow.getTime() + 16 * 60 * 60 * 1000),
        time: "16:00",
        location: "Ljubljana Center",
        peopleBooked: 12,
        maxBooked: 15,
        price: "35.00",
        level: "All Levels",
      },
      {
        id: 4,
        theme: "Pronunciation Mastery",
        tutor: "Marko Petek",
        date: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
        time: "10:00",
        location: "Online (Zoom)",
        peopleBooked: 2,
        maxBooked: 12,
        price: "28.00",
        level: "Intermediate",
      },
      {
        id: 5,
        theme: "Business Slovenian",
        tutor: "Ana Novak",
        date: new Date(nextWeek.getTime() + 14 * 60 * 60 * 1000),
        time: "14:00",
        location: "Ljubljana Center",
        peopleBooked: 6,
        maxBooked: 10,
        price: "40.00",
        level: "Advanced",
      },
      {
        id: 6,
        theme: "Reading Circle",
        tutor: "Marko Petek",
        date: new Date(nextWeek.getTime() + 18 * 60 * 60 * 1000),
        time: "18:00",
        location: "Online (Zoom)",
        peopleBooked: 9,
        maxBooked: 12,
        price: "25.00",
        level: "Intermediate",
      },
    ];

    // Alerts
    const alerts: Alert[] = [
      {
        id: "alert_1",
        type: "pending-payment",
        title: "3 Pending Payments Over 24 Hours",
        description:
          "Payment status 'pending' for bookings: Event #3 (Sarah Johnson), Event #5 (Michael Chen), Event #7 (Emma Williams)",
        priority: "high",
        actionUrl: "/language-club/booking",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "alert_2",
        type: "low-capacity",
        title: "Low Booking: Pronunciation Mastery",
        description:
          "Event starting tomorrow has only 2/12 bookings (17% capacity). Consider cancellation or promotion.",
        priority: "high",
        actionUrl: "/language-club",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        id: "alert_3",
        type: "upcoming-event",
        title: "Event Starting in 2 Hours",
        description:
          "Slovenian Conversation Practice with Ana Novak starts at 14:00. 8/10 spots filled.",
        priority: "medium",
        actionUrl: "/language-club/booking?id=1",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: "alert_4",
        type: "cancellation",
        title: "Cancellation Request",
        description:
          "John Smith requested cancellation for Event #8. Refund processing needed.",
        priority: "medium",
        actionUrl: "/language-club/booking",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    // Recent activity
    const recentActivity: ActivityItem[] = [
      {
        id: "act_1",
        type: "payment",
        title: "Payment Confirmed",
        description:
          "Sarah Johnson paid €25.00 for Slovenian Conversation Practice",
        user: "Sarah Johnson",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: "paid",
      },
      {
        id: "act_2",
        type: "booking",
        title: "New Booking",
        description: "Michael Chen booked Grammar Fundamentals event",
        user: "Michael Chen",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: "act_3",
        type: "status-change",
        title: "Status Updated",
        description: "Session #12 status changed to 'completed'",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "act_4",
        type: "booking",
        title: "New Booking",
        description: "Emma Williams booked Cultural Immersion Workshop",
        user: "Emma Williams",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: "act_5",
        type: "payment",
        title: "Payment Pending",
        description: "David Brown's payment for Business Slovenian is pending",
        user: "David Brown",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        status: "pending",
      },
      {
        id: "act_6",
        type: "cancellation",
        title: "Booking Cancelled",
        description: "Lisa Anderson cancelled her booking for Reading Circle",
        user: "Lisa Anderson",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
    ];

    return {
      todaysEvents,
      todaysSessions,
      upcomingEvents,
      alerts,
      recentActivity,
      stats: {
        eventsToday: todaysEvents.length,
        sessionsToday: todaysSessions.length,
        pendingActions: alerts.filter((a) => a.priority === "high").length + 3, // 3 pending payments
        newBookingsToday: recentActivity.filter((a) => a.type === "booking")
          .length,
      },
    };
  }

  const data = getPlaceholderData();

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of today&apos;s events, sessions, and priority tasks
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <OverviewCards
          eventsToday={data.stats.eventsToday}
          sessionsToday={data.stats.sessionsToday}
          pendingActions={data.stats.pendingActions}
          newBookingsToday={data.stats.newBookingsToday}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alerts Section */}
            <AlertsSection alerts={data.alerts}/>

            {/* Today's Events */}
            <TodaysEvents events={data.todaysEvents}/>

            {/* Today's Sessions */}
            <TodaysSessions sessions={data.todaysSessions}/>

            {/* Upcoming Events */}
            <UpcomingEvents events={data.upcomingEvents}/>
          </div>

          {/* Right Column - Activity & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions/>

            {/* Recent Activity */}
            <RecentActivity activities={data.recentActivity}/>
          </div>
        </div>
      </div>
    </>
  );
};
