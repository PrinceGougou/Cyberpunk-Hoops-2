import type { MatchData } from "@/lib/types";

/** 筛选最近两周 + 未来两周的比赛 */
export function filterByWeek(matches: MatchData[]): MatchData[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + 14);
  end.setHours(23, 59, 59, 999);

  return matches.filter((match) => {
    const date = new Date(match.startsAt);
    return date >= start && date <= end;
  });
}
