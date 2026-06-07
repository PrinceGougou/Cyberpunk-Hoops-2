import type { MatchData, StandingsRow } from "@/lib/types";

export function buildStandings(matches: MatchData[]): StandingsRow[] {
  const table = new Map<string, StandingsRow>();

  for (const match of matches) {
    if (match.status !== "FINISHED") continue;
    if (typeof match.homeScore !== "number" || typeof match.awayScore !== "number") continue;

    const teams = [
      { team: match.homeTeam, won: match.homeScore > match.awayScore },
      { team: match.awayTeam, won: match.awayScore > match.homeScore }
    ];

    for (const entry of teams) {
      const row = table.get(entry.team.id) || {
        teamId: entry.team.id,
        teamName: entry.team.nameZh || entry.team.name,
        league: match.league,
        wins: 0,
        losses: 0,
        rank: 0
      };

      if (entry.won) row.wins += 1;
      else row.losses += 1;

      table.set(entry.team.id, row);
    }
  }

  return Array.from(table.values())
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.teamName.localeCompare(b.teamName))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
