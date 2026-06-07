"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, MapPin, Star, Zap } from "lucide-react";
import { PlayerRow } from "@/components/PlayerRow";
import { useFavorites } from "@/context/FavoritesContext";
import type { MatchData } from "@/lib/types";

const STATUS_CONFIG = {
  UPCOMING: { label: "即将开始", cls: "border-blue-400/50 text-blue-400" },
  LIVE: { label: "直播中", cls: "border-red-500/60 bg-red-500/15 text-red-300 animate-pulse" },
  FINISHED: { label: "已结束", cls: "border-white/15 text-white/35" }
};

const LEAGUE_LABELS: Record<string, string> = {
  NBA: "NBA", CBA: "CBA", TEAM_CHINA: "国家队"
};

const LEAGUE_COLORS: Record<string, string> = {
  NBA: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  CBA: "border-red-400/40 bg-red-400/10 text-red-300",
  TEAM_CHINA: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

export function MatchCard({
  match, isFavorite = false
}: {
  match: MatchData; isFavorite?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toggleFavoriteTeam, isFavoriteTeam } = useFavorites();
  const status = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.FINISHED;
  const leagueCls = LEAGUE_COLORS[match.league] || "";

  const homeFav = isFavoriteTeam(match.homeTeam.id);
  const awayFav = isFavoriteTeam(match.awayTeam.id);

  return (
    <article className={`group border bg-black/40 backdrop-blur transition-all ${
      isFavorite
        ? "border-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.15)]"
        : "border-white/[0.06]"
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`border px-2 py-0.5 text-[0.65rem] font-black ${leagueCls}`}>
              {LEAGUE_LABELS[match.league]}
            </span>
            <span className={`border px-2 py-0.5 text-[0.65rem] font-black ${status.cls}`}>
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-white/40">
              <Clock className="h-3 w-3" />
              {formatDateTime(match.startsAt)}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="grid h-7 w-7 place-items-center border border-white/10 text-white/40 transition hover:text-white"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Teams */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavoriteTeam(match.homeTeam.id); }}
              className="shrink-0"
            >
              <Star className={`h-4 w-4 ${homeFav ? "fill-cyan-400 text-cyan-400" : "text-white/15"}`} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-white">{match.homeTeam.nameZh}</div>
              <div className="truncate text-xs text-white/35">{match.homeTeam.name}</div>
            </div>
          </div>

          <div className="text-center">
            {typeof match.homeScore === "number" ? (
              <div className="font-mono text-2xl font-black tabular-nums text-cyan-400">
                {match.homeScore}<span className="text-white/20"> - </span>{match.awayScore}
              </div>
            ) : (
              <div className="px-3 py-1 font-mono text-xs font-black text-white/25 border border-white/10">VS</div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end text-right">
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-white">{match.awayTeam.nameZh}</div>
              <div className="truncate text-xs text-white/35">{match.awayTeam.name}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavoriteTeam(match.awayTeam.id); }}
              className="shrink-0"
            >
              <Star className={`h-4 w-4 ${awayFav ? "fill-cyan-400 text-cyan-400" : "text-white/15"}`} />
            </button>
          </div>
        </div>

        {/* Venue */}
        <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black text-cyan-400">
                <Zap className="h-3 w-3" /> {match.homeTeam.nameZh} 阵容
              </div>
              {match.homeTeam.roster.length > 0 ? (
                match.homeTeam.roster.map((p) => <PlayerRow key={p.id} player={p} />)
              ) : (
                <p className="py-2 text-xs text-white/25">暂无球员数据</p>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black text-magpunk">
                <Zap className="h-3 w-3" /> {match.awayTeam.nameZh} 阵容
              </div>
              {match.awayTeam.roster.length > 0 ? (
                match.awayTeam.roster.map((p) => <PlayerRow key={p.id} player={p} />)
              ) : (
                <p className="py-2 text-xs text-white/25">暂无球员数据</p>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
