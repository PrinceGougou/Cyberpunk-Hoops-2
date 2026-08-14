"use client";

import { useMemo } from "react";
import { ChevronDown, Flag, Star, StarOff } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import type { LeagueFilter, MatchData, Team } from "@/lib/types";

type FavoriteGroup = "NBA_EAST" | "NBA_WEST" | "CBA" | "TEAM_CHINA" | "LOL_LPL" | "LOL_LCK";

type PickableTeam = {
  id: string;
  nameZh: string;
  abbreviation: string;
  group: FavoriteGroup;
};

const GROUP_LABELS: Record<FavoriteGroup, string> = {
  NBA_EAST: "NBA 东部",
  NBA_WEST: "NBA 西部",
  CBA: "CBA",
  TEAM_CHINA: "国家队",
  LOL_LPL: "LPL 战队",
  LOL_LCK: "LCK 战队"
};

const GROUP_ORDER: FavoriteGroup[] = ["LOL_LPL", "LOL_LCK", "NBA_EAST", "NBA_WEST", "CBA", "TEAM_CHINA"];

function groupForTeam(match: MatchData, team: Team): FavoriteGroup | null {
  if (match.league === "LOL_LPL" || match.league === "LOL_LCK") return match.league;
  if (match.league === "CBA" || match.league === "TEAM_CHINA") return match.league;
  if (match.league === "NBA" && (team.group === "NBA_EAST" || team.group === "NBA_WEST")) return team.group;
  return null;
}

function matchesSelectedPicker(match: MatchData, selected: LeagueFilter) {
  if (selected === "LOL") return match.league === "LOL_LPL" || match.league === "LOL_LCK";
  return match.league === selected;
}

export function FavoriteBar({
  matches,
  selected
}: {
  matches: MatchData[];
  selected: LeagueFilter;
}) {
  const { favoriteTeamIds, toggleFavoriteTeam } = useFavorites();

  const teamsByGroup = useMemo(() => {
    const groups = new Map<FavoriteGroup, Map<string, PickableTeam>>();

    for (const match of matches) {
      if (!matchesSelectedPicker(match, selected)) continue;
      for (const team of [match.homeTeam, match.awayTeam]) {
        if (/^(TBD|待定)$/i.test(team.nameZh.trim()) || /^(TBD|待定)$/i.test(team.abbreviation.trim())) continue;
        const group = groupForTeam(match, team);
        if (!group) continue;
        const teams = groups.get(group) || new Map<string, PickableTeam>();
        teams.set(team.id, {
          id: team.id,
          nameZh: team.nameZh,
          abbreviation: team.abbreviation,
          group
        });
        groups.set(group, teams);
      }
    }

    return GROUP_ORDER
      .filter((group) => groups.has(group))
      .map((group) => ({
        group,
        teams: Array.from(groups.get(group)?.values() || [])
          .sort((a, b) => a.nameZh.localeCompare(b.nameZh))
      }));
  }, [matches, selected]);

  const uniqueTeams = teamsByGroup.flatMap(({ teams }) => teams);
  const favoriteTeams = uniqueTeams.filter((team) => favoriteTeamIds.includes(team.id));
  const otherGroups = teamsByGroup
    .map(({ group, teams }) => ({
      group,
      teams: teams.filter((team) => !favoriteTeamIds.includes(team.id))
    }))
    .filter(({ teams }) => teams.length > 0);
  const isLol = selected === "LOL";

  if (uniqueTeams.length === 0) return null;

  return (
    <section className="border-b border-white/5 bg-black/40 px-4 py-3 backdrop-blur">
      {favoriteTeams.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400">
            <Star className="h-3.5 w-3.5 fill-cyan-400" />
            已关注{isLol ? "战队" : "球队"}
          </span>
          {favoriteTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => toggleFavoriteTeam(team.id)}
              className="inline-flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-cyan-500/25"
            >
              <StarOff className="h-3 w-3 text-cyan-400" />
              <span className="text-[0.6rem] text-white/40">{GROUP_LABELS[team.group]}</span>
              {team.nameZh}
            </button>
          ))}
        </div>
      )}

      {otherGroups.length > 0 && (
        <details className="group/team-picker">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-white/35 transition hover:text-cyan-300">
            <Flag className="h-3 w-3" />
            选择关注{isLol ? "战队" : "球队"}
            <span className="text-white/20">{otherGroups.reduce((count, item) => count + item.teams.length, 0)}</span>
            <ChevronDown className="h-3 w-3 transition group-open/team-picker:rotate-180" />
          </summary>
          <div className="mt-3 grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {otherGroups.map(({ group, teams }) => (
              <div key={group} className="border border-white/[0.05] bg-white/[0.015] p-2.5">
                <div className="mb-2 flex items-center justify-between text-[0.65rem] font-black text-cyan-300/70">
                  <span>{GROUP_LABELS[group]}</span>
                  <span className="text-white/20">{teams.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      aria-pressed="false"
                      onClick={() => toggleFavoriteTeam(team.id)}
                      className="inline-flex items-center gap-1 border border-white/5 bg-white/[0.02] px-2 py-1 text-xs text-white/50 transition hover:border-cyan-500/30 hover:text-cyan-300"
                    >
                      <Star className="h-2.5 w-2.5" />
                      <span className="text-[0.6rem] text-white/30">{team.abbreviation}</span>
                      {team.nameZh}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {favoriteTeams.length === 0 && (
        <p className="mt-2 text-xs text-white/25">
          点击星星关注你喜欢的{isLol ? "战队" : "球队"}，相关比赛会置顶显示
        </p>
      )}
    </section>
  );
}
