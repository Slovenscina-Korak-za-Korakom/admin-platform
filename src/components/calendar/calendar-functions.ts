import {SESSION_COLORS, getSessionColor} from "@/lib/session-colors";

export const getStatusColor = (status: string, startTime: Date, sessionType?: string) => {
  if (status?.toLowerCase() === "cancelled") {
    return SESSION_COLORS.cancelled;
  }

  return getSessionColor(sessionType ?? "");
};
