"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { HeroCarousel } from "@/components/HeroCarousel";
import { LeagueTabs } from "@/components/LeagueTabs";
import { MatchCard } from "@/components/MatchCard";
import { PortalSidebar } from "@/components/PortalSidebar";
import { ScoreTicker } from "@/components/ScoreTicker";
import { useFavorites } from "@/context/FavoritesContext";
import { filterByWeek } from "@/lib/filterByWeek";
import type { LeagueFilter, MatchData, ScheduleResponse, StandingsRow } from "@/lib/types";

function matchContainsStar(match: MatchData, favoritePlayerIds: string[]) {
  return [...match.homeTeam.roster, ...match.awayTeam.roster].some((player) => favoritePlayerIds.includes(player.id));
}

export function ScheduleDashboard() {
  const { favoritePlayerIds, scanlinesEnabled } = useFavorites();
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("ALL");
  const [starFilterEnabled, setStarFilterEnabled] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 统一从 Next.js Route Handler 获取 NBA CDN + CBA/国家队抓取产物，前端不再 import 静态 mock。
  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      try {
        setLoading(true);
        const response = await fetch("/api/schedule", { cache: "no-store" });
        if (!response.ok) throw new Error(`Schedule API returned ${response.status}`);

        const payload = (await response.json()) as ScheduleResponse;
        if (cancelled) return;

        setMatches(payload.matches);
        setStandings(payload.standings);
        setErrors(payload.errors || []);
        setExpandedMatchId(payload.matches[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;
        setErrors([error instanceof Error ? error.message : String(error)]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleMatches = useMemo(() => {
    return matches.filter((match) => {
      const leagueMatches = leagueFilter === "ALL" || match.league === leagueFilter;
      const starMatches = !starFilterEnabled || matchContainsStar(match, favoritePlayerIds);

      return leagueMatches && starMatches;
    });
  }, [favoritePlayerIds, leagueFilter, matches, starFilterEnabled]);

  const weekFilteredMatches = useMemo(() => filterByWeek(visibleMatches), [visibleMatches]);

  return (
    <main className={scanlinesEnabled ? "scanlines" : ""}>
      {scanlinesEnabled ? <div className="scan-beam animate-scan" /> : null}
      <ScoreTicker matches={matches} />

      <div className="min-h-screen bg-cyber-grid bg-[length:42px_42px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 border border-cyanpunk/40 bg-black/45 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyanpunk shadow-cyan">
              <Zap className="h-4 w-4" />
              REAL-TIME BASKETBALL PORTAL
            </div>
            <h1 className="neon-text text-4xl font-black uppercase leading-tight text-white sm:text-5xl lg:text-6xl">
              Cyberpunk Hoops
            </h1>
          </header>

          <div className="mb-6">
            <HeroCarousel matches={matches} favoritePlayerIds={favoritePlayerIds} />
          </div>

          <div className="mb-6">
            <LeagueTabs selected={leagueFilter} onSelect={setLeagueFilter} />
          </div>

          {errors.length > 0 ? (
            <section className="mb-6 border border-acid/40 bg-acid/10 p-4 text-xs font-bold uppercase tracking-[0.12em] text-acid">
              {errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="grid gap-5">
              {loading ? (
                <div className="cyber-panel grid min-h-64 place-items-center p-8 text-center shadow-panel">
                  <div>
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-cyanpunk" />
                    <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">Syncing Live Data</h2>
                  </div>
                </div>
              ) : null}

              {!loading &&
                weekFilteredMatches.map((match, i) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    expanded={expandedMatchId === match.id}
                    index={i}
                    onToggle={() => setExpandedMatchId((current) => (current === match.id ? null : match.id))}
                  />
                ))}

              {!loading && weekFilteredMatches.length === 0 ? (
                <section className="cyber-panel p-8 text-center shadow-panel">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center border border-acid text-acid shadow-[0_0_18px_rgba(248,255,0,0.32)]">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">NO SIGNAL</h2>
                  <p className="mt-2 text-sm uppercase tracking-[0.14em] text-white/55">FILTER TARGET EMPTY</p>
                </section>
              ) : null}
            </section>

            <PortalSidebar
              matches={matches}
              standings={standings}
              starFilterEnabled={starFilterEnabled}
              onStarFilterChange={setStarFilterEnabled}
              favoriteCount={favoritePlayerIds.length}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
