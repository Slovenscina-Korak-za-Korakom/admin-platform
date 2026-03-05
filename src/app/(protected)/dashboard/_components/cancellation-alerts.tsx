import {IconAlertTriangle, IconX} from "@tabler/icons-react";
import {Badge} from "@/components/ui/badge";
import {AllCancelledSessions} from "@/actions/admin-actions";

export const CancellationAlerts = ({data}: {data: AllCancelledSessions[]}) => {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.cancelledAt.getTime() - a.cancelledAt.getTime());

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
        Cancellation Alerts
      </p>
      {sorted.map((alert) => (
        <div
          key={`${alert.studentId}-${alert.startTime.toISOString()}`}
          className="relative flex items-start gap-3 rounded-xl border border-orange-300/60 bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-transparent dark:from-orange-950/40 dark:via-amber-950/20 dark:to-transparent px-4 py-3 shadow-sm"
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 border border-orange-200/60">
            <IconAlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-orange-900 dark:text-orange-100">{alert.studentName}</span>
              <span className="text-xs text-orange-600/80 dark:text-orange-400/80">{alert.startTime.toLocaleDateString('en-GB', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
              })}</span>
              <Badge
                variant="outline"
                className="text-[10px] capitalize border-orange-300/60 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40"
              >
                {alert.type}
              </Badge>
            </div>
            <p className="text-xs text-orange-700/70 dark:text-orange-400/70 mt-0.5">{alert.cancelledAt.toLocaleDateString('en-GB', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: false,
            })}</p>
          </div>
          <button className="shrink-0 text-orange-400 hover:text-orange-600 transition-colors">
            <IconX className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
