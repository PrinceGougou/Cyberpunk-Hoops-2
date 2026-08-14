import type { MatchData, ScheduleScope } from "@/lib/types";

const MAX_ITEMS = 60;

/**
 * 将完整数据集收敛到用户真正需要浏览的时间范围。
 * “近日”保留过去 14 天和未来 21 天；赛程、赛果各自按时间排序并限量。
 */
export function filterMatchesByScope(
  matches: MatchData[],
  scope: ScheduleScope,
  now = new Date()
): MatchData[] {
  if (scope === "UPCOMING") {
    return matches
      .filter((match) => match.status === "UPCOMING" || match.status === "LIVE")
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, MAX_ITEMS);
  }

  if (scope === "RESULTS") {
    return matches
      .filter((match) => match.status === "FINISHED")
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      .slice(0, MAX_ITEMS);
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + 21);
  end.setHours(23, 59, 59, 999);

  return matches
    .filter((match) => {
      const timestamp = new Date(match.startsAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp <= end.getTime();
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, MAX_ITEMS);
}
