"use client";

import type { MatchData, MatchStatus } from "@/lib/types";

const STATUS_LABELS: Record<MatchStatus, string> = {
  UPCOMING: "即将开始",
  LIVE: "直播中",
  FINISHED: "已结束"
};

const STATUS_CLASSES: Record<MatchStatus, string> = {
  UPCOMING: "border-blue-400/60 text-blue-400",
  LIVE: "border-red-500/60 bg-red-500/20 text-red-300 animate-pulse",
  FINISHED: "border-white/15 text-white/40"
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function ScoreTicker({ matches }: { matches: MatchData[] }) {
  const liveMatches = matches.filter((m) => m.status === "LIVE");
  const recentFinished = matches.filter((m) => m.status === "FINISHED" && typeof m.homeScore === "number");
  const items = [...liveMatches, ...recentFinished.slice(-8)];

  if (items.length === 0) return null;

  return (
    <div className="border-b border-white/5 bg-black/60">
      <div className="overflow-hidden">
        <div className="flex animate-marquee gap-8 py-2 px-4">
          {items.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold">
              <span className="text-white/70">{m.homeTeam.abbreviation}</span>
              {typeof m.homeScore === "number" ? (
                <>
                  <span className="tabular-nums text-cyan-400">{m.homeScore}</span>
                  <span className="text-white/30">-</span>
                  <span className="tabular-nums text-cyan-400">{m.awayScore}</span>
                </>
              ) : (
                <span className="text-white/20">VS</span>
              )}
              <span className="text-white/70">{m.awayTeam.abbreviation}</span>
              <span className={`ml-1 text-[0.6rem] ${STATUS_CLASSES[m.status]}`}>
                {STATUS_LABELS[m.status]}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
