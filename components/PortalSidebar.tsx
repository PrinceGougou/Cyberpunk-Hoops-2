"use client";

import { Activity, CalendarClock, Database, ExternalLink, Star, Trophy, User } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import type { DataSourceStatus, MatchData } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function formatCoverageDate(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function sourceStatus(source: DataSourceStatus) {
  if (source.status === "fresh") return { label: "已连接", cls: "text-emerald-300" };
  if (source.status === "stale") return { label: "降级可用", cls: "text-amber-300" };
  return { label: "暂不可用", cls: "text-red-300" };
}

export function PortalSidebar({
  matches,
  sources,
  entityLabel
}: {
  matches: MatchData[];
  sources: DataSourceStatus[];
  entityLabel: "球队" | "战队";
}) {
  const { favoritePlayerIds, favoriteTeamIds } = useFavorites();
  const now = Date.now();
  const liveCount = matches.filter((match) => match.status === "LIVE").length;
  const upcomingCount = matches.filter((match) => match.status === "UPCOMING").length;
  const finishedCount = matches.filter((match) => match.status === "FINISHED").length;
  const timestamps = matches
    .map((match) => new Date(match.startsAt).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const favoriteTeamMatches = matches
    .filter((match) => favoriteTeamIds.includes(match.homeTeam.id) || favoriteTeamIds.includes(match.awayTeam.id))
    .sort((a, b) => Math.abs(new Date(a.startsAt).getTime() - now) - Math.abs(new Date(b.startsAt).getTime() - now));
  const visibleFavoriteTeamCount = new Set(
    matches.flatMap((match) => [match.homeTeam.id, match.awayTeam.id])
      .filter((teamId) => favoriteTeamIds.includes(teamId))
  ).size;

  const playerInfo = favoritePlayerIds.map((playerId) => {
    const relatedMatches = matches.filter((match) =>
      [match.homeTeam, match.awayTeam].some((team) => team.roster.some((player) => player.id === playerId))
    );
    const lastMatch = relatedMatches
      .filter((match) => match.status === "FINISHED")
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())[0];
    const nextMatch = relatedMatches
      .filter((match) => match.status === "UPCOMING")
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
    let playerName = playerId;

    for (const match of relatedMatches) {
      for (const team of [match.homeTeam, match.awayTeam]) {
        const player = team.roster.find((item) => item.id === playerId);
        if (player) playerName = player.nameZh || player.name;
      }
    }

    return { playerId, playerName, lastMatch, nextMatch };
  }).filter((player) => player.lastMatch || player.nextMatch);

  return (
    <aside className="grid self-start gap-4 lg:sticky lg:top-6">
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
              <CalendarClock className="h-3.5 w-3.5 text-cyan-400" />
              已确认赛程
            </span>
            <span className="text-cyan-400">{upcomingCount}</span>
          </div>
          <div className="flex items-center justify-between border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50">
              <Trophy className="h-3.5 w-3.5 text-white/40" />
              已完赛
            </span>
            <span className="text-white/50">{finishedCount}</span>
          </div>
          <div className="flex items-center justify-between border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50">
              <Star className="h-3.5 w-3.5 text-cyan-400" />
              关注{entityLabel}
            </span>
            <span className="text-cyan-400">{visibleFavoriteTeamCount}</span>
          </div>
        </div>
        {timestamps.length > 0 && (
          <p className="mt-3 text-[0.65rem] leading-5 text-white/25">
            数据覆盖 {formatCoverageDate(timestamps[0])} — {formatCoverageDate(timestamps[timestamps.length - 1])}
          </p>
        )}
      </section>

      <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-white/60">
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          数据来源
        </h2>
        <div className="grid gap-2">
          {sources.map((source) => {
            const status = sourceStatus(source);
            return (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 transition hover:border-cyan-400/30"
              >
                <span className="flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="text-white/70">{source.name}</span>
                  <span className={`inline-flex items-center gap-1 ${status.cls}`}>
                    {status.label}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </span>
                </span>
                {source.updatedAt && (
                  <span className="mt-1 block text-[0.6rem] text-white/25">更新 {formatDate(source.updatedAt)}</span>
                )}
                {source.message && (
                  <span className="mt-1 block text-[0.6rem] leading-4 text-white/30">{source.message}</span>
                )}
              </a>
            );
          })}
          {sources.length === 0 && <p className="py-2 text-xs text-white/25">正在检测数据来源…</p>}
        </div>
      </section>

      {playerInfo.length > 0 && (
        <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-white/60">
            <User className="h-3.5 w-3.5 text-cyan-400" />
            关注球员
          </h2>
          <div className="grid gap-2">
            {playerInfo.slice(0, 5).map(({ playerId, playerName, lastMatch, nextMatch }) => (
              <div key={playerId} className="border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                <div className="mb-1 text-xs font-bold text-white/80">{playerName}</div>
                {lastMatch && (
                  <div className="text-[0.6rem] text-white/40">
                    最近：{lastMatch.homeTeam.nameZh} {lastMatch.homeScore}-{lastMatch.awayScore} {lastMatch.awayTeam.nameZh}
                  </div>
                )}
                {nextMatch && (
                  <div className="text-[0.6rem] text-cyan-400">
                    下场：{nextMatch.homeTeam.nameZh} vs {nextMatch.awayTeam.nameZh}（{formatDate(nextMatch.startsAt)}）
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {favoriteTeamMatches.length > 0 && (
        <section className="border border-white/[0.06] bg-black/40 p-4 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-white/60">
            <Trophy className="h-3.5 w-3.5 text-cyan-400" />
            关注{entityLabel}最近比赛
          </h2>
          <div className="grid gap-2">
            {favoriteTeamMatches.slice(0, 5).map((match) => (
              <div key={match.id} className="border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs">
                <div className="font-bold text-white/90">{match.homeTeam.nameZh} vs {match.awayTeam.nameZh}</div>
                <div className="mt-0.5 text-[0.65rem] text-white/35">
                  {formatDate(match.startsAt)}
                  {typeof match.homeScore === "number" && typeof match.awayScore === "number" && (
                    <span className="ml-2 text-cyan-400">{match.homeScore}-{match.awayScore}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
