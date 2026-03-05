import {IconAlertTriangle, IconCalendar, IconClock} from "@tabler/icons-react";
import {Badge} from "@/components/ui/badge";
import {AllCancelledSessions} from "@/actions/admin-actions";

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

export const CancellationAlerts = ({data}: {data: AllCancelledSessions[]}) => {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
        Cancellation Alerts
      </p>
      {sorted.map((alert) => (
        <div
          key={`${alert.studentId}-${alert.startTime.toISOString()}`}
          className="flex items-center gap-3 rounded-lg border border-orange-300/60 bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-transparent dark:from-orange-950/40 dark:via-amber-950/20 dark:to-transparent px-3 py-2 shadow-sm"
        >
          <IconAlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-sm text-orange-900 dark:text-orange-100 capitalize">{alert.studentName}</span>
            <Badge
              variant="outline"
              className="text-[10px] capitalize border-orange-300/60 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40"
            >
              {alert.type}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-orange-800/80 dark:text-orange-300/80">
              <IconCalendar className="h-3 w-3 shrink-0" />
              <span className="font-medium">{formatDate(alert.startTime)}</span>
              <span className="text-orange-600/60">·</span>
              <span>{formatTime(alert.startTime)}</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-orange-600/60 dark:text-orange-400/50">
              <IconClock className="h-3 w-3 shrink-0" />
              <span>cancelled {formatDate(alert.cancelledAt)}</span>
            </span>
            {alert.reason && (
              <span className="w-full text-xs text-orange-700/70 dark:text-orange-400/70 italic truncate">
                &ldquo;{alert.reason}&rdquo;
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
