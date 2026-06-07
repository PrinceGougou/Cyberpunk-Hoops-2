"use client";

import { Activity, CircleDot, DatabaseZap, Trophy } from "lucide-react";
import { ScanlineToggle } from "@/components/ScanlineToggle";
import type { MatchData, StandingsRow } from "@/lib/types";

export function PortalSidebar({
  matches,
  standings,
  starFilterEnabled,
  onStarFilterChange,
  favoriteCount
}: {
  matches: MatchData[];
  standings: StandingsRow[];
  starFilterEnabled: boolean;
  onStarFilterChange: (enabled: boolean) => void;
  favoriteCount: number;
}) {
  const liveCount = matches.filter((match) => match.status === "LIVE").length;
  const teamCount = new Set(matches.flatMap((match) => [match.homeTeam.id, match.awayTeam.id])).size;
  const nextMatch = matches.find((match) => match.status === "UPCOMING");

  return (
    <aside className="grid gap-5 lg:sticky lg:top-24">
      <section className="cyber-panel p-4 shadow-panel">
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white">Control Deck / 侧栏控制</h2>
        <ScanlineToggle starFilterEnabled={starFilterEnabled} onStarFilterChange={onStarFilterChange} />
      </section>

      <section className="cyber-panel p-4 shadow-panel">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-white">
          <DatabaseZap className="h-4 w-4 text-cyanpunk" />
          Quick Stats
        </h2>
        <div className="grid gap-2">
          <div className="flex min-h-12 items-center justify-between border border-white/10 bg-black/30 px-3 text-xs font-black uppercase tracking-[0.14em]">
            <span className="inline-flex items-center gap-2 text-white/55">
              <Activity className="h-4 w-4 text-magpunk" />
              Live
            </span>
            <span className="text-magpunk">{liveCount}</span>
          </div>
          <div className="flex min-h-12 items-center justify-between border border-white/10 bg-black/30 px-3 text-xs font-black uppercase tracking-[0.14em]">
            <span className="inline-flex items-center gap-2 text-white/55">
              <CircleDot className="h-4 w-4 text-acid" />
              Stars
            </span>
            <span className="text-acid">{favoriteCount}</span>
          </div>
          <div className="flex min-h-12 items-center justify-between border border-white/10 bg-black/30 px-3 text-xs font-black uppercase tracking-[0.14em]">
            <span className="inline-flex items-center gap-2 text-white/55">
              <Trophy className="h-4 w-4 text-cyanpunk" />
              Teams
            </span>
            <span className="text-cyanpunk">{teamCount}</span>
          </div>
        </div>
        {nextMatch ? (
          <div className="mt-4 border border-cyanpunk/25 bg-cyanpunk/5 p-3">
            <div className="mb-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-cyanpunk">Next Signal</div>
            <div className="text-sm font-black text-white">
              {nextMatch.homeTeam.abbreviation} VS {nextMatch.awayTeam.abbreviation}
            </div>
          </div>
        ) : null}
      </section>

      <section className="cyber-panel p-4 shadow-panel">
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white">Standings / 排名</h2>
        <div className="space-y-2">
          {standings.slice(0, 8).map((row) => (
            <div
              key={row.teamId}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 border border-white/10 bg-black/30 px-3 py-2 text-xs font-black uppercase tracking-[0.12em]"
            >
              <span className="text-acid">#{row.rank}</span>
              <span className="truncate text-white">{row.teamName}</span>
              <span className="text-cyanpunk">
                {row.wins}-{row.losses}
              </span>
            </div>
          ))}
          {standings.length === 0 ? (
            <div className="border border-white/10 bg-black/25 p-4 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
              Waiting for finished games
            </div>
          ) : null}
        </div>
      </section>
    </aside>
  );
}
