"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Star, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { MatchData } from "@/lib/types";

function formatHeroTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false
  }).format(new Date(value));
}

export function HeroCarousel({
  matches,
  favoritePlayerIds
}: {
  matches: MatchData[];
  favoritePlayerIds: string[];
}) {
  const featured = useMemo(() => {
  const starMatches = matches.filter((match) => {
    // 安全读取 roster，如果不存在则退化为空数组 []
    const homeRoster = match.homeTeam?.roster || [];
    const awayRoster = match.awayTeam?.roster || [];
    
    return [...homeRoster, ...awayRoster].some((player) => 
      favoritePlayerIds.includes(player.id)
    );
  });
  
  return (starMatches.length > 0 ? starMatches : matches)
// ...
      .filter((match) => match.status !== "FINISHED")
      .slice(0, 5);
  }, [favoritePlayerIds, matches]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeMatch = featured[activeIndex % Math.max(featured.length, 1)];

  if (!activeMatch) {
    return (
      <section className="cyber-panel min-h-64 p-6 shadow-panel">
        <div className="grid h-full place-items-center text-center">
          <div>
            <Trophy className="mx-auto mb-4 h-10 w-10 text-cyanpunk" />
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Awaiting Signal</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cyber-panel min-h-[22rem] overflow-hidden p-0 shadow-panel">
      <div className="relative h-full min-h-[22rem] bg-neon-sheen">
        <div className="absolute inset-0 bg-cyber-grid bg-[length:36px_36px] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/55 to-black/90" />

        <div className="relative grid min-h-[22rem] gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 border border-acid bg-acid/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-acid">
              <Star className="h-4 w-4" />
              Hero Match / 主视觉轮播
            </div>
            <h2 className="neon-text max-w-4xl text-4xl font-black uppercase leading-tight text-white sm:text-5xl">
              {activeMatch.homeTeam.nameZh} VS {activeMatch.awayTeam.nameZh}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.14em] text-white/70">
              <span className="border border-cyanpunk/40 bg-black/35 px-3 py-2 text-cyanpunk">{activeMatch.league}</span>
              <span className="border border-white/10 bg-black/35 px-3 py-2">{formatHeroTime(activeMatch.startsAt)}</span>
              <span className="border border-magpunk/40 bg-black/35 px-3 py-2 text-magpunk">{activeMatch.venue}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={activeMatch.videoHighlightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 border border-magpunk bg-magpunk px-4 text-xs font-black uppercase tracking-[0.14em] text-white shadow-magenta transition hover:brightness-125"
              >
                <ExternalLink className="h-4 w-4" />
                Watch Official
              </a>
              <a
                href={activeMatch.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 border border-cyanpunk px-4 text-xs font-black uppercase tracking-[0.14em] text-cyanpunk transition hover:bg-cyanpunk hover:text-black"
              >
                Match Center
              </a>
            </div>
          </div>

          <div className="grid gap-3 border border-white/10 bg-black/35 p-4">
            {featured.map((match, index) => (
              <button
                key={`hero-dot-${match.id}`}
                type="button"
                title={`切换到 ${match.homeTeam.nameZh} VS ${match.awayTeam.nameZh}`}
                onClick={() => setActiveIndex(index)}
                className={`min-h-12 border px-3 text-left text-xs font-black uppercase tracking-[0.12em] transition ${
                  index === activeIndex
                    ? "border-cyanpunk bg-cyanpunk text-black shadow-cyan"
                    : "border-white/10 text-white/60 hover:border-magpunk hover:text-white"
                }`}
              >
                {match.homeTeam.abbreviation} / {match.awayTeam.abbreviation}
              </button>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                title="Previous hero"
                onClick={() => setActiveIndex((current) => (current - 1 + featured.length) % featured.length)}
                className="grid h-11 place-items-center border border-white/15 text-white transition hover:border-cyanpunk hover:text-cyanpunk"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Next hero"
                onClick={() => setActiveIndex((current) => (current + 1) % featured.length)}
                className="grid h-11 place-items-center border border-white/15 text-white transition hover:border-cyanpunk hover:text-cyanpunk"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
