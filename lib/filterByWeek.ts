import type { MatchData } from "@/lib/types";

/**
 * Filter matches to show only those within [Today - 7 days, Today + 7 days].
 * Past finished matches within the window are included; future upcoming
 * matches up to 7 days ahead are included.
 */
export function filterByWeek(matches: MatchData[]): MatchData[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return matches.filter((match) => {
    const date = new Date(match.startsAt);
    return date >= start && date <= end;
  });
}
