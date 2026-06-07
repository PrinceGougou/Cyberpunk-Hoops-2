"use client";

import { Activity, Star, Trophy, User } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import type { MatchData, StandingsRow } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export function PortalSidebar({
  matches, standings
}: {
  matches: MatchData[];
  standings: StandingsRow[];
}) {
  const { favoritePlayerIds, favoriteTeamIds } = useFavorites();
  const liveCount = matches.filter((m) => m.status === "LIVE").length;

  // 关注球队比赛
  const favoriteTeamMatches = matches.filter((m) =>
    favoriteTeamIds.includes(m.homeTeam.id) || favoriteTeamIds.includes(m.awayTeam.id)
  ).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  // 关注球员信息：从所有比赛中找到包含该球员的球队，列出最近一场和下一场
  const playerInfo = favoritePlayerIds.map((pid) => {
    const playerMatches: { player: { id: string; nameZh: string; name: string; number: string }; lastMatch?: MatchData; nextMatch?: MatchData }[] = [];
    return { playerId: pid, lastMatch: null as MatchData | null, nextMatch: null as MatchData | null };
  }).filter((p) => {
    // 在所有比赛中搜索该球员
    for (const m of matches) {
      for (const team of [m.homeTeam, m.awayTeam]) {
        const player = team.roster.find((pl) => pl.id === p.playerId);
        if (player) {
          if (m.status === "FINISHED" && !p.lastMatch) p.lastMatch = m;
          if (m.status === "UPCOMING" && !p.nextMatch) p.nextMatch = m;
        }
      }
    }
    return p.lastMatch || p.nextMatch;
  });

  return (
    <aside className="grid gap-4 lg:sticky lg:top-24 self-start">
      {/* Stats */}
      <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
        <h2 className="mb-3 text-xs font-black tracking-wide text-white/60">数据概览</h2>
        <div className="grid gap-2">
          <div className="flex items-center justify-between border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50">
              <Activity className="h-3.5 w-3.5 text-red-400" />
              直播中
            </span>
            <span className="text-red-400">{liveCount}</span>
          </div>
          <div className="flex items-center justify-between border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50">
              <Star className="h-3.5 w-3.5 text-cyan-400" />
              关注球员
            </span>
            <span className="text-cyan-400">{favoritePlayerIds.length}</span>
          </div>
          <div className="flex items-center justify-between border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50">
              <Trophy className="h-3.5 w-3.5 text-cyan-400" />
              关注球队
            </span>
            <span className="text-cyan-400">{favoriteTeamIds.length}</span>
          </div>
        </div>
      </section>

      {/* 关注球员动态 */}
      {playerInfo.length > 0 && (
        <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-white/60">
            <User className="h-3.5 w-3.5 text-cyan-400" />
            关注球员
          </h2>
          <div className="grid gap-2">
            {playerInfo.slice(0, 5).map(({ playerId, lastMatch, nextMatch }) => {
              // 找到球员名字
              let playerName = playerId;
              for (const m of matches) {
                for (const team of [m.homeTeam, m.awayTeam]) {
                  const pl = team.roster.find((p) => p.id === playerId);
                  if (pl) { playerName = pl.nameZh || pl.name; break; }
                }
                if (playerName !== playerId) break;
              }

              return (
                <div key={playerId} className="border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                  <div className="mb-1 text-xs font-bold text-white/80">{playerName}</div>
                  {lastMatch && (
                    <div className="text-[0.6rem] text-white/40">
                      最近: {lastMatch.homeTeam.nameZh} {lastMatch.homeScore}-{lastMatch.awayScore} {lastMatch.awayTeam.nameZh}
                    </div>
                  )}
                  {nextMatch && (
                    <div className="text-[0.6rem] text-cyan-400">
                      下场: {nextMatch.homeTeam.nameZh} vs {nextMatch.awayTeam.nameZh} ({formatDate(nextMatch.startsAt)})
                    </div>
                  )}
                  {!lastMatch && !nextMatch && (
                    <div className="text-[0.6rem] text-white/25">暂无比赛数据</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 关注球队比赛 */}
      {favoriteTeamMatches.length > 0 && (
        <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-white/60">
            <Trophy className="h-3.5 w-3.5 text-cyan-400" />
            关注球队最近比赛
          </h2>
          <div className="grid gap-2">
            {favoriteTeamMatches.slice(0, 5).map((m) => (
              <div key={m.id} className="border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs">
                <div className="font-bold text-white/90">{m.homeTeam.nameZh} vs {m.awayTeam.nameZh}</div>
                <div className="mt-0.5 text-[0.65rem] text-white/35">
                  {formatDate(m.startsAt)}
                  {typeof m.homeScore === "number" && <span className="ml-2 text-cyan-400">{m.homeScore}-{m.awayScore}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NBA 排名 */}
      <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-white/60">
          <Trophy className="h-3.5 w-3.5 text-cyan-400" />
          NBA 排名
        </h2>
        <div className="grid gap-1">
          {standings.slice(0, 10).map((row) => (
            <div
              key={row.teamId}
              className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 border border-white/[0.04] bg-white/[0.01] px-3 py-2 text-xs font-bold"
            >
              <span className="text-cyan-400 tabular-nums">{row.rank}</span>
              <span className="truncate text-white/80">{row.teamName}</span>
              <span className="tabular-nums text-white/35">{row.wins}-{row.losses}</span>
            </div>
          ))}
          {standings.length === 0 && (
            <p className="py-3 text-center text-xs text-white/25">暂无排名数据</p>
          )}
        </div>
      </section>

      {/* NBA 球队完整排名 */}
      {standings.length > 10 && (
        <details className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
          <summary className="text-xs font-bold text-white/40 cursor-pointer hover:text-white/70">
            查看全部 {standings.length} 支 NBA 球队排名
          </summary>
          <div className="mt-3 grid gap-1">
            {standings.slice(10).map((row) => (
              <div
                key={row.teamId}
                className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 border border-white/[0.04] bg-white/[0.01] px-3 py-2 text-xs font-bold"
              >
                <span className="text-cyan-400 tabular-nums">{row.rank}</span>
                <span className="truncate text-white/80">{row.teamName}</span>
                <span className="tabular-nums text-white/35">{row.wins}-{row.losses}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </aside>
  );
}
