export const SESSION_COLORS: Record<string, string> = {
  individual: "#3b82f6",
  group: "#8b5cf6",
  regular: "#ec4899",
  test: "#f97316",
  cancelled: "#6B7280",
};

export const getSessionColor = (sessionType: string): string =>
  SESSION_COLORS[sessionType?.toLowerCase()] ?? SESSION_COLORS.individual;
