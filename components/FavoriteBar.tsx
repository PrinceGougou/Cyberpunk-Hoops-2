"use client";

import { Star, StarOff, Users, Flag } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import type { MatchData } from "@/lib/types";

export function FavoriteBar({ matches }: { matches: MatchData[] }) {
  const { favoriteTeamIds, toggleFavoriteTeam } = useFavorites();

  // 获取所有球队
  const allTeams = new Map<string, { id: string; nameZh: string; abbreviation: string; league: string }>();
  for (const m of matches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!allTeams.has(t.id)) {
        allTeams.set(t.id, { id: t.id, nameZh: t.nameZh, abbreviation: t.abbreviation, league: m.league });
      }
    }
  }

  const leagueLabels: Record<string, string> = { NBA: "NBA", CBA: "CBA", TEAM_CHINA: "国家队" };
  const uniqueTeams = Array.from(allTeams.values());
  const favoriteTeams = uniqueTeams.filter((t) => favoriteTeamIds.includes(t.id));
  const otherTeams = uniqueTeams.filter((t) => !favoriteTeamIds.includes(t.id))
    .sort((a, b) => a.nameZh.localeCompare(b.nameZh));

  if (uniqueTeams.length === 0) return null;

  return (
    <section className="border-b border-white/5 bg-black/40 px-4 py-3 backdrop-blur">
      {/* 已关注球队 */}
      {favoriteTeams.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400">
            <Star className="h-3.5 w-3.5 fill-cyan-400" />
            已关注
          </span>
          {favoriteTeams.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleFavoriteTeam(t.id)}
              className="inline-flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-cyan-500/25"
            >
              <StarOff className="h-3 w-3 text-cyan-400" />
              <span className="text-[0.6rem] text-white/40">{leagueLabels[t.league]}</span>
              {t.nameZh}
            </button>
          ))}
        </div>
      )}

      {/* 可关注球队 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-white/30">
          <Flag className="h-3 w-3" />
          关注球队
        </span>
        {otherTeams.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleFavoriteTeam(t.id)}
            className="inline-flex items-center gap-1 border border-white/5 bg-white/[0.02] px-2 py-0.5 text-xs text-white/50 transition hover:border-cyan-500/30 hover:text-cyan-300"
          >
            <Star className="h-2.5 w-2.5" />
            <span className="text-[0.6rem] text-white/30">{leagueLabels[t.league]}</span>
            {t.nameZh}
          </button>
        ))}
      </div>

      {favoriteTeams.length === 0 && (
        <p className="mt-2 text-xs text-white/25">点击星星关注你喜欢的球队，关注后比赛将置顶显示</p>
      )}
    </section>
  );
}
