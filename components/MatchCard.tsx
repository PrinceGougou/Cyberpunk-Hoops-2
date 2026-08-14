"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, ExternalLink, MapPin, Radio, Star, Zap } from "lucide-react";
import { PlayerRow } from "@/components/PlayerRow";
import { useFavorites } from "@/context/FavoritesContext";
import type { MatchData } from "@/lib/types";

const STATUS_CONFIG = {
  UPCOMING: { label: "即将开始", cls: "border-blue-400/50 text-blue-400" },
  LIVE: { label: "直播中", cls: "border-red-500/60 bg-red-500/15 text-red-300 animate-pulse" },
  FINISHED: { label: "已结束", cls: "border-white/15 text-white/35" }
};

const LEAGUE_LABELS: Record<string, string> = {
  NBA: "NBA",
  CBA: "CBA",
  TEAM_CHINA: "国家队",
  LOL_LPL: "LPL",
  LOL_LCK: "LCK",
  LOL_INTL: "国际赛"
};

const LEAGUE_COLORS: Record<string, string> = {
  NBA: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  CBA: "border-red-400/40 bg-red-400/10 text-red-300",
  TEAM_CHINA: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  LOL_LPL: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300",
  LOL_LCK: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  LOL_INTL: "border-amber-400/40 bg-amber-400/10 text-amber-300"
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
  const mediaLinks = [
    { label: "赛事来源", url: match.sourceUrl },
    { label: "视频 / 集锦", url: match.videoHighlightUrl },
    { label: "图片", url: match.galleryUrl }
  ].filter((item, index, items) =>
    item.url && items.findIndex((candidate) => candidate.url === item.url) === index
  );

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
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "收起比赛详情" : "展开比赛详情"}
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
              type="button"
              aria-label={homeFav ? `取消关注${match.homeTeam.nameZh}` : `关注${match.homeTeam.nameZh}`}
              aria-pressed={homeFav}
              onClick={(e) => { e.stopPropagation(); toggleFavoriteTeam(match.homeTeam.id); }}
              className="shrink-0"
            >
              <Star className={`h-4 w-4 ${homeFav ? "fill-cyan-400 text-cyan-400" : "text-white/15"}`} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-white">{match.homeTeam.nameZh}</div>
              {match.homeTeam.name !== match.homeTeam.nameZh && (
                <div className="truncate text-xs text-white/35">{match.homeTeam.name}</div>
              )}
            </div>
          </div>

          <div className="text-center">
            {typeof match.homeScore === "number" && typeof match.awayScore === "number" ? (
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
              {match.awayTeam.name !== match.awayTeam.nameZh && (
                <div className="truncate text-xs text-white/35">{match.awayTeam.name}</div>
              )}
            </div>
            <button
              type="button"
              aria-label={awayFav ? `取消关注${match.awayTeam.nameZh}` : `关注${match.awayTeam.nameZh}`}
              aria-pressed={awayFav}
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
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <div className="border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
              <div className="mb-1 inline-flex items-center gap-2 text-[0.65rem] font-black text-white/35">
                <Radio className="h-3 w-3 text-cyan-400" /> 数据提供
              </div>
              <div className="text-xs font-bold text-white/75">{match.broadcastProvider || "官方赛事来源"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
              {mediaLinks.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border border-cyan-400/20 px-2 py-1 text-[0.65rem] font-bold text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/10"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
              {mediaLinks.length === 0 && <span className="text-xs text-white/25">暂无外部媒体入口</span>}
            </div>
          </div>

          {(match.homeTeam.roster.length > 0 || match.awayTeam.roster.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-cyan-400">
                  <Zap className="h-3 w-3" /> {match.homeTeam.nameZh} 阵容
                </div>
                {match.homeTeam.roster.map((player) => <PlayerRow key={player.id} player={player} />)}
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-magpunk">
                  <Zap className="h-3 w-3" /> {match.awayTeam.nameZh} 阵容
                </div>
                {match.awayTeam.roster.map((player) => <PlayerRow key={player.id} player={player} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
