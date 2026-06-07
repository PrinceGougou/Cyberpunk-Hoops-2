"use client";

import { RadioTower } from "lucide-react";
import type { MatchData } from "@/lib/types";

function scoreLabel(match: MatchData) {
  if (typeof match.homeScore === "number" && typeof match.awayScore === "number") {
    return `${match.homeScore} - ${match.awayScore}`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(match.startsAt));
}

export function ScoreTicker({ matches }: { matches: MatchData[] }) {
  const tickerMatches = matches
    .filter((match) => match.status === "LIVE" || match.status === "FINISHED")
    .concat(matches.filter((match) => match.status === "UPCOMING"))
    .slice(0, 16);

  return (
    <section className="sticky top-0 z-40 border-b border-cyanpunk/30 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex h-10 shrink-0 items-center gap-2 border border-magpunk bg-magpunk/15 px-3 text-xs font-black uppercase tracking-[0.16em] text-magpunk shadow-magenta">
          <RadioTower className="h-4 w-4 animate-pulse" />
          Score Tape
        </div>
        <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tickerMatches.map((match) => (
            <a
              key={`ticker-${match.id}`}
              href={match.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 shrink-0 items-center gap-3 border border-white/10 bg-white/[0.03] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-cyanpunk hover:text-cyanpunk hover:shadow-cyan"
            >
              <span className={match.status === "LIVE" ? "text-magpunk" : "text-white/45"}>{match.status}</span>
              <span>{match.homeTeam.abbreviation}</span>
              <span className="text-acid">{scoreLabel(match)}</span>
              <span>{match.awayTeam.abbreviation}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
