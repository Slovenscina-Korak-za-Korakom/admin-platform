import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {IconCircleCheck, IconUsers} from "@tabler/icons-react";
import {formatDuration} from "@/app/(protected)/dashboard/_components/tutor-dashboard";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {RegularSessionsWithName} from "@/actions/admin-actions";
import {Badge} from "@/components/ui/badge";

export const RegularClientsCard = ({data}: { data: RegularSessionsWithName[] }) => {

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const byDay = data.reduce<Record<number, RegularSessionsWithName[]>>((acc, session) => {
    if (!acc[session.dayOfWeek]) acc[session.dayOfWeek] = [];
    acc[session.dayOfWeek].push(session);
    return acc;
  }, {});

  const sortedDayNumbers = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg bg-gradient-to-br from-violet-400/20 to-purple-500/20 border border-violet-400/40">
            <IconUsers className="h-4 w-4 text-violet-600 dark:text-violet-400"/>
          </div>
          <CardTitle className="text-base font-semibold">Regular Clients</CardTitle>
          <span className="ml-auto text-xs text-muted-foreground">{data.length} total</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {sortedDayNumbers.map((dayNum) => (
          <div key={dayNum}>
            <p
              className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{dayNames[dayNum]}</p>
            <div className="space-y-1.5">
              {byDay[dayNum].map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors group"
                >
                  <Avatar className="h-7 w-7 rounded-lg shrink-0">
                    <AvatarFallback
                      className="rounded-lg text-white text-xs font-bold"
                      style={{background: "linear-gradient(135deg, #6366f1, #8b5cf6)"}}
                    >
                      {client.studentName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex-1 truncate">{client.studentName}</span>
                  <span className="text-xs text-muted-foreground font-mono">{client.startTime}</span>
                  <span className="text-xs text-muted-foreground">{formatDuration(client.duration)}</span>
                  <div className="w-16 flex justify-center shrink-0">
                    {client.status === "accepted" ? (
                      <IconCircleCheck className="h-4 w-4 text-emerald-500"/>
                    ) : client.status === "pending" ? (
                      <Badge variant="outline" className="text-[10px] border-amber-300/60 text-amber-600 bg-amber-50">
                        pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-red-300/60 text-red-600 bg-red-50">
                        declined
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
