export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options = {
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
    // hour: "2-digit" as const,
    // minute: "2-digit" as const,
    // hour12: true,
  };
  return date.toLocaleDateString("en-US", options);
};
