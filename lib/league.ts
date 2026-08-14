import type { League, LeagueFilter, MatchData } from "@/lib/types";

export const LOL_LEAGUES = new Set<League>(["LOL_LPL", "LOL_LCK", "LOL_INTL"]);

export function isLolLeague(league: League) {
  return LOL_LEAGUES.has(league);
}

export function matchBelongsToFilter(match: MatchData, filter: LeagueFilter) {
  if (filter === "LOL") return isLolLeague(match.league);
  return match.league === filter;
}
