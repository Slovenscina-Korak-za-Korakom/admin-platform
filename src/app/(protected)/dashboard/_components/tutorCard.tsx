import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {TutorHoursByType} from "@/actions/admin-actions";
import {IconChartBar, IconClock, IconMail} from "@tabler/icons-react";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {useMemo} from "react";
import {formatTime} from "@/app/(protected)/dashboard/_components/tutor-hours-overview";


export const TutorCard = ({data, regularStats, tutors}: {
  data: TutorHoursByType[];
  regularStats: Map<number, { sessions: number; minutes: number }>;
  tutors: {
    id: number,
    email: string;
    name: string;
    avatar: string;
    level: string;
    color: string;
  }[]
}) => {

  const avatarMap = useMemo(
    () => new Map(tutors.map(a => [a.email, a.avatar])),
    [tutors]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tutors.map((tutor) => {
        const tutorRegular = regularStats.get(tutor.id);
        const tutorData = data.find((t) => t.tutorId === tutor.id);
        const totalMinutes =
          tutorData === undefined ? 0 : tutorData.sessions.reduce((sum, s) => sum + s.totalMinutes, 0) + (tutorRegular?.minutes ?? 0);
        const totalSessions =
          tutorData === undefined ? 0 : tutorData?.sessions.reduce((sum, s) => sum + s.sessionCount, 0) + (tutorRegular?.sessions ?? 0);
        const color = tutor.color || "#6366f1";

        const allSessions = [
          ...(tutorData?.sessions.map(s => ({
            type: s.sessionType,
            sessions: s.sessionCount,
            minutes: s.totalMinutes
          })) ?? []),
          ...(tutorRegular && tutorRegular.sessions !== 0 ? [{
            type: "regular",
            sessions: tutorRegular.sessions,
            minutes: tutorRegular.minutes
          }] : []),
        ];

        const avatarUrl = avatarMap.get(tutor.email);

        return (
          <Dialog key={tutor.id}>
            <DialogTrigger asChild>
              {/* Card */}
              <div
                className="group relative rounded-2xl bg-card border border-border/60 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden select-none"
              >
                {/* Top color stripe */}
                <div
                  className="h-1 w-full"
                  style={{background: `linear-gradient(90deg, ${color}, ${color}88)`}}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Avatar */}
                    <Avatar
                      className="shrink-0 w-11 h-11 rounded-xl shadow-sm"
                      style={!avatarUrl ? {background: `linear-gradient(135deg, ${color}, ${color}cc)`} : undefined}
                    >
                      <AvatarImage src={avatarUrl} className="object-cover"/>
                      <AvatarFallback
                        className="rounded-xl text-white font-bold text-lg"
                        style={{background: `linear-gradient(135deg, ${color}, ${color}cc)`}}
                      >
                        {tutor.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm capitalize leading-snug truncate">
                        {tutor.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {tutor.email}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: `${color}18`,
                        color,
                        border: `1px solid ${color}35`,
                      }}
                    >
                        {tutor.level}
                      </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/50 mb-4"/>

                  {/* Stats */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span
                        className="text-3xl font-bold tabular-nums leading-none"
                        style={{color}}
                      >
                        {totalSessions}
                      </span>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <IconChartBar className="h-3 w-3"/>
                        <span>sessions</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="text-3xl font-bold tabular-nums leading-none"
                        style={{color}}
                      >
                        {formatTime(totalMinutes)}
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3"/>
                        <span>total time</span>
                      </div>
                    </div>
                  </div>

                  {/* Session type pills */}
                  {allSessions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 pt-3.5 border-t border-border/50">
                      {allSessions.map(s => (
                        <span
                          key={s.type}
                          className="text-[10px] px-2 py-0.5 rounded-md capitalize font-medium tracking-wide"
                          style={{backgroundColor: `${color}15`, color}}
                        >
                          {s.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogTrigger>

            {/* Detail Dialog */}
            <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
              {/* Gradient header */}
              <div
                className="relative px-6 pt-6 pb-5 overflow-hidden"
                style={{background: `linear-gradient(135deg, ${color}20 0%, ${color}08 60%, transparent 100%)`}}
              >
                {/* Decorative blobs */}
                <div
                  className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15 blur-sm"
                  style={{backgroundColor: color}}
                />
                <div
                  className="absolute top-4 right-12 w-16 h-16 rounded-full opacity-10 blur-[2px]"
                  style={{backgroundColor: color}}
                />

                <DialogHeader className="relative z-10">
                  <DialogTitle asChild>
                    <div className="flex items-start gap-4">
                      {/* Large avatar */}
                      <Avatar
                        className="shrink-0 w-14 h-14 rounded-2xl shadow-md"
                      >
                        <AvatarImage src={avatarUrl} className="object-cover"/>
                        <AvatarFallback
                          className="rounded-2xl text-white font-bold text-2xl"
                          style={{background: `linear-gradient(135deg, ${color}, ${color}bb)`}}
                        >
                          {tutor.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-bold text-base capitalize leading-tight truncate">
                          {tutor.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <IconMail className="h-3 w-3 text-muted-foreground shrink-0"/>
                          <p className="text-xs text-muted-foreground truncate">{tutor.email}</p>
                        </div>
                        <Badge
                          className="inline-block text-[10px] font-semibold rounded-full capitalize mt-2"
                          variant="outline"
                          style={{
                            backgroundColor: `${color}22`,
                            color,
                            border: `1px solid ${color}45`,
                          }}
                        >
                          {tutor.level}
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="px-6 pb-6 space-y-5 pt-4">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {label: "Sessions", value: String(totalSessions)},
                    {label: "Time", value: formatTime(totalMinutes)},
                    {label: "Minutes", value: String(totalMinutes)},
                  ].map(({label, value}) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center"
                      style={{
                        background: `linear-gradient(145deg, ${color}16, ${color}08)`,
                        border: `1px solid ${color}28`,
                      }}
                    >
                      <div className="text-lg font-bold tabular-nums leading-none" style={{color}}>
                        {value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Breakdown with progress bars */}
                {allSessions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                      Breakdown by type
                    </p>
                    <div className="space-y-3.5">
                      {allSessions.map((s) => {
                        const pct = Math.round((s.minutes / Math.max(totalMinutes, 1)) * 100);
                        return (
                          <div key={s.type}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{backgroundColor: color}}
                                />
                                <span className="text-sm font-medium capitalize">{s.type}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {s.sessions} {s.sessions === 1 ? "session" : "sessions"}
                                </span>
                                <span
                                  className="text-xs font-semibold tabular-nums"
                                  style={{color}}
                                >
                                  {formatTime(s.minutes)}
                                </span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 rounded-full bg-muted/70 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: `linear-gradient(90deg, ${color}, ${color}99)`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
};
