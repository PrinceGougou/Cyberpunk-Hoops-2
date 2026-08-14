"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MonitorCog, RefreshCw, Search, X, Zap } from "lucide-react";
import { AppStatusControls } from "@/components/AppStatusControls";
import { LeagueTabs } from "@/components/LeagueTabs";
import { MatchCard } from "@/components/MatchCard";
import { PortalSidebar } from "@/components/PortalSidebar";
import { ScheduleScopeTabs } from "@/components/ScheduleScopeTabs";
import { ScoreTicker } from "@/components/ScoreTicker";
import { FavoriteBar } from "@/components/FavoriteBar";
import { WatchLinks } from "@/components/WatchLinks";
import { useFavorites } from "@/context/FavoritesContext";
import { filterMatchesByScope } from "@/lib/filterMatches";
import { matchBelongsToFilter } from "@/lib/league";
import type {
  DataSourceStatus,
  LeagueFilter,
  MatchData,
  ScheduleResponse,
  ScheduleScope
} from "@/lib/types";

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function ScheduleDashboard() {
  const { favoriteTeamIds, scanlinesEnabled, setScanlinesEnabled } = useFavorites();
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("LOL");
  const [scheduleScope, setScheduleScope] = useState<ScheduleScope>("NEARBY");
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const refreshInFlight = useRef(false);

  const loadSchedule = useCallback(async (initial = false) => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    if (initial) setInitialLoading(true);
    else setRefreshing(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/schedule", {
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`API 返回 ${response.status}`);
      const payload = (await response.json()) as ScheduleResponse;
      if (!Array.isArray(payload.matches) || !Array.isArray(payload.sources)) {
        throw new Error("API 数据结构不完整");
      }

      setMatches(payload.matches);
      setSources(payload.sources);
      setErrors(payload.errors || []);
      setGeneratedAt(payload.generatedAt);
      setLastRefresh(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "赛程请求超过 15 秒，请检查网络或稍后重试"
        : error instanceof Error ? error.message : String(error);
      setErrors([message]);
    } finally {
      window.clearTimeout(timeout);
      refreshInFlight.current = false;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule(true);

    // 仅在页面可见且网络在线时轮询，避免后台标签页持续消耗流量。
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void loadSchedule(false);
      }
    };
    const interval = window.setInterval(refreshWhenActive, 60_000);
    window.addEventListener("online", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [loadSchedule]);

  // 顶部栏目筛选：LOL 汇总 LPL、LCK 与国际赛事，其余栏目是篮球联赛。
  const leagueMatches = useMemo(() => {
    return matches.filter((match) => matchBelongsToFilter(match, leagueFilter));
  }, [leagueFilter, matches]);

  const visibleSources = useMemo(() => sources.filter((source) =>
    leagueFilter === "LOL"
      ? source.id === "LOL_ESPORTS_OFFICIAL"
      : leagueFilter === "TEAM_CHINA"
        ? source.id === "CHINA_BASKETBALL_OFFICIAL"
        : source.id === "TENCENT_SPORTS"
  ), [leagueFilter, sources]);
  const visibleIsStale = visibleSources.some((source) => source.status !== "fresh");

  const searchedMatches = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase("zh-CN");
    if (!keyword) return leagueMatches;

    return leagueMatches.filter((match) => [
      match.homeTeam.name,
      match.homeTeam.nameZh,
      match.homeTeam.abbreviation,
      match.awayTeam.name,
      match.awayTeam.nameZh,
      match.awayTeam.abbreviation,
      match.venue
    ].some((value) => value.toLocaleLowerCase("zh-CN").includes(keyword)));
  }, [leagueMatches, searchQuery]);

  // 时间范围
  const windowedMatches = useMemo(
    () => filterMatchesByScope(searchedMatches, scheduleScope),
    [searchedMatches, scheduleScope]
  );

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
    <main className={`min-h-screen w-full max-w-full overflow-x-hidden ${scanlinesEnabled ? "scanlines" : ""}`}>
      {scanlinesEnabled && <div className="scan-beam animate-scan" aria-hidden="true" />}
      <ScoreTicker matches={leagueMatches} />

      <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex flex-wrap items-center gap-2 border border-cyan-500/30 bg-black/40 px-3 py-1.5 text-xs font-black tracking-wider text-cyan-400">
                <Zap className="h-3.5 w-3.5" />
                篮球 / 电竞赛程数据中心
                {generatedAt && (
                  <span className={visibleIsStale ? "text-amber-300/80" : "text-white/30"}>
                    数据生成 {formatUpdatedAt(generatedAt)}{visibleIsStale ? " · 含降级数据" : ""}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Cyberpunk Hoops
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AppStatusControls />
              <button
                type="button"
                aria-pressed={scanlinesEnabled}
                onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
                className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-black/40 px-3 text-xs font-bold text-white/40 transition hover:border-cyan-400/40 hover:text-cyan-300"
              >
                <MonitorCog className="h-3.5 w-3.5" />
                扫描线 {scanlinesEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </header>

          {/* 球队 / 战队关注栏 */}
          <div className="mb-4">
            <FavoriteBar matches={matches} selected={leagueFilter} />
          </div>

          {/* 联赛 Tab */}
          <div className="mb-4">
            <LeagueTabs selected={leagueFilter} onSelect={setLeagueFilter} />
          </div>

          <WatchLinks />

          <div className="mb-3 flex min-h-10 items-center gap-2 border border-white/[0.06] bg-black/40 px-3 focus-within:border-cyan-400/30">
            <Search className="h-3.5 w-3.5 shrink-0 text-cyan-400/50" />
            <label htmlFor="match-search" className="sr-only">搜索球队、战队或赛事阶段</label>
            <input
              id="match-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={leagueFilter === "LOL" ? "搜索战队、简称或赛事阶段" : "搜索球队、简称或场馆"}
              className="min-w-0 flex-1 bg-transparent py-2 text-xs font-bold text-white/75 outline-none placeholder:text-white/20"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="清除搜索"
                onClick={() => setSearchQuery("")}
                className="text-white/30 transition hover:text-cyan-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ScheduleScopeTabs selected={scheduleScope} onSelect={setScheduleScope} />
            <span className="text-[0.65rem] font-bold text-white/25">
              当前 {windowedMatches.length} 场
              {lastRefresh ? ` · 页面同步 ${lastRefresh}` : ""}
              {refreshing ? " · 刷新中" : ""}
            </span>
          </div>

          {/* 仅在完全无数据时展示底层错误，降级数据状态由侧栏来源卡片说明。 */}
          {errors.length > 0 && matches.length === 0 && (
            <div className="mb-4 border border-red-400/30 bg-red-400/10 p-3 text-xs font-bold text-red-400">
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* 主内容 */}
            <section className="grid gap-3">
              {initialLoading && (
                <div className="flex min-h-48 flex-col items-center justify-center border border-white/[0.06] bg-black/40 p-8">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-sm font-bold text-white/50">正在同步数据...</p>
                </div>
              )}

              {/* 关注球队的比赛（置顶） */}
              {!initialLoading && favoriteMatches.map((m) => (
                <MatchCard key={m.id} match={m} isFavorite />
              ))}

              {/* 关注和非关注之间的分隔 */}
              {!initialLoading && favoriteMatches.length > 0 && normalMatches.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <span className="text-[0.6rem] font-black tracking-widest text-white/15">其他比赛</span>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
              )}

              {/* 普通比赛 */}
              {!initialLoading && normalMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}

              {/* 空状态 */}
              {!initialLoading && !hasMatches && (
                <div className="flex flex-col items-center border border-white/[0.06] bg-black/40 py-12 text-center">
                  <Zap className="mb-3 h-10 w-10 text-white/10" />
                  <p className="text-sm font-bold text-white/30">暂无比赛</p>
                  <p className="mt-1 max-w-md px-6 text-xs leading-5 text-white/20">
                    {searchQuery
                      ? `没有找到与“${searchQuery}”匹配的比赛，请清除搜索或切换筛选。`
                      : "当前联赛与时间范围内没有已确认赛事。你可以切换到“最近赛果”，或刷新数据后再查看。"}
                  </p>
                </div>
              )}

              {/* 手动刷新 */}
              {!initialLoading && (
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() => void loadSchedule(false)}
                  className="flex items-center justify-center gap-2 border border-white/[0.06] bg-black/40 py-2 text-xs font-bold text-white/25 transition hover:text-white/50 disabled:cursor-wait disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "正在刷新" : "手动刷新数据"}
                </button>
              )}
            </section>

            {/* 侧边栏 */}
            <PortalSidebar
              matches={leagueMatches}
              sources={visibleSources}
              entityLabel={leagueFilter === "LOL" ? "战队" : "球队"}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
