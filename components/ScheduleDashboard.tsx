"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Zap, RefreshCw } from "lucide-react";
import { LeagueTabs } from "@/components/LeagueTabs";
import { MatchCard } from "@/components/MatchCard";
import { PortalSidebar } from "@/components/PortalSidebar";
import { ScoreTicker } from "@/components/ScoreTicker";
import { FavoriteBar } from "@/components/FavoriteBar";
import { useFavorites } from "@/context/FavoritesContext";
import { filterByWeek } from "@/lib/filterByWeek";
import type { LeagueFilter, MatchData, ScheduleResponse, StandingsRow } from "@/lib/types";

export function ScheduleDashboard() {
  const { favoritePlayerIds, favoriteTeamIds } = useFavorites();
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("ALL");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/schedule", { cache: "no-store" });
      if (!response.ok) throw new Error(`API 返回 ${response.status}`);
      const payload = (await response.json()) as ScheduleResponse;
      setMatches(payload.matches);
      setStandings(payload.standings);
      setErrors(payload.errors || []);
      setLastRefresh(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    } catch (error) {
      setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
    // 每 30 秒轮询一次实时比分
    const interval = setInterval(loadSchedule, 30_000);
    return () => clearInterval(interval);
  }, []);

  // 联赛筛选
  const leagueMatches = useMemo(() => {
    return matches.filter((m) => leagueFilter === "ALL" || m.league === leagueFilter);
  }, [leagueFilter, matches]);

  // 时间窗口
  const windowedMatches = useMemo(() => filterByWeek(leagueMatches), [leagueMatches]);

  // 分离关注和非关注比赛
  const { favoriteMatches, normalMatches } = useMemo(() => {
    const fav: MatchData[] = [];
    const norm: MatchData[] = [];
    for (const m of windowedMatches) {
      if (favoriteTeamIds.includes(m.homeTeam.id) || favoriteTeamIds.includes(m.awayTeam.id)) {
        fav.push(m);
      } else {
        norm.push(m);
      }
    }
    return { favoriteMatches: fav, normalMatches: norm };
  }, [windowedMatches, favoriteTeamIds]);

  const hasMatches = favoriteMatches.length > 0 || normalMatches.length > 0;

  return (
    <main className="min-h-screen">
      <ScoreTicker matches={matches} />

      <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-6">
            <div className="mb-2 inline-flex items-center gap-2 border border-cyan-500/30 bg-black/40 px-3 py-1.5 text-xs font-black tracking-wider text-cyan-400">
              <Zap className="h-3.5 w-3.5" />
              实时篮球数据中心
              {lastRefresh && (
                <span className="ml-3 text-white/25">
                  更新于 {lastRefresh}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Cyberpunk Hoops
            </h1>
          </header>

          {/* 球队关注栏 */}
          <div className="mb-4">
            <FavoriteBar matches={matches} />
          </div>

          {/* 联赛 Tab */}
          <div className="mb-4">
            <LeagueTabs selected={leagueFilter} onSelect={setLeagueFilter} />
          </div>

          {/* 错误 */}
          {errors.length > 0 && (
            <div className="mb-4 border border-red-400/30 bg-red-400/10 p-3 text-xs font-bold text-red-400">
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* 主内容 */}
            <section className="grid gap-3">
              {loading && (
                <div className="flex min-h-48 flex-col items-center justify-center border border-white/[0.06] bg-black/40 p-8">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-sm font-bold text-white/50">正在同步数据...</p>
                </div>
              )}

              {/* 关注球队的比赛（置顶） */}
              {!loading && favoriteMatches.map((m) => (
                <MatchCard key={m.id} match={m} isFavorite />
              ))}

              {/* 关注和非关注之间的分隔 */}
              {!loading && favoriteMatches.length > 0 && normalMatches.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <span className="text-[0.6rem] font-black tracking-widest text-white/15">其他比赛</span>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
              )}

              {/* 普通比赛 */}
              {!loading && normalMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}

              {/* 空状态 */}
              {!loading && !hasMatches && (
                <div className="flex flex-col items-center border border-white/[0.06] bg-black/40 py-12 text-center">
                  <Zap className="mb-3 h-10 w-10 text-white/10" />
                  <p className="text-sm font-bold text-white/30">暂无比赛</p>
                  <p className="mt-1 text-xs text-white/15">当前筛选条件下没有找到比赛</p>
                </div>
              )}

              {/* 手动刷新 */}
              {!loading && (
                <button
                  onClick={loadSchedule}
                  className="flex items-center justify-center gap-2 border border-white/[0.06] bg-black/40 py-2 text-xs font-bold text-white/25 transition hover:text-white/50"
                >
                  <RefreshCw className="h-3 w-3" />
                  手动刷新数据
                </button>
              )}
            </section>

            {/* 侧边栏 */}
            <PortalSidebar matches={matches} standings={standings} />
          </div>
        </div>
      </div>
    </main>
  );
}
