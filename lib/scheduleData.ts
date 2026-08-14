import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DataSourceStatus, MatchData, ScheduleResponse } from "@/lib/types";

const TENCENT_SPORTS_URL = "https://sports.qq.com/kbsweb/";
const CHINA_BASKETBALL_URL = "https://www.cba.net.cn/gjdgjnl/index.jhtml";
const LOL_ESPORTS_URL = "https://lolesports.com/en-US/";
const CACHE_STALE_AFTER_MS = 36 * 60 * 60 * 1000;
const BASKETBALL_ACQUISITION_KEYS = ["NBA", "CBA"] as const;
const CHINA_MEN_ACQUISITION_KEYS = ["CHINA_MEN_OFFICIAL"] as const;
const LOL_ACQUISITION_KEYS = ["LOL_LPL", "LOL_LCK", "LOL_WORLDS", "LOL_MSI", "LOL_FIRST_STAND"] as const;

type AcquisitionState = {
  mode?: "live" | "cache" | "unavailable";
  updatedAt?: string;
  message?: string;
};

type CachedSchedule = {
  generatedAt?: string;
  matches?: MatchData[];
  errors?: string[];
  acquisition?: Record<string, AcquisitionState>;
};

type CachedScheduleResult = {
  generatedAt: string;
  matches: MatchData[];
  sources: DataSourceStatus[];
  errors: string[];
};

function validTimestamp(value: string | undefined) {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function sanitizeAndDedupe(matches: MatchData[]) {
  const now = Date.now();
  const unique = new Map<string, MatchData>();

  for (const match of matches) {
    const startsAt = validTimestamp(match.startsAt);
    if (!startsAt || !match.homeTeam?.nameZh || !match.awayTeam?.nameZh) continue;

    // 已经过时的“直播中/即将开始”缓存不能继续当作实时信息展示。
    if (match.status !== "FINISHED" && startsAt < now - 12 * 60 * 60 * 1000) continue;

    const identity = [
      match.league,
      new Date(startsAt).toISOString(),
      match.homeTeam.id || match.homeTeam.nameZh,
      match.awayTeam.id || match.awayTeam.nameZh
    ].join("|");
    const existing = unique.get(identity);

    if (!existing) {
      unique.set(identity, match);
      continue;
    }

    const existingScore = typeof existing.homeScore === "number" && typeof existing.awayScore === "number";
    const incomingScore = typeof match.homeScore === "number" && typeof match.awayScore === "number";
    if (!existingScore && incomingScore) unique.set(identity, match);
  }

  return Array.from(unique.values()).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

function buildSourceStatus(
  id: DataSourceStatus["id"],
  name: string,
  url: string,
  keys: readonly string[],
  acquisition: Record<string, AcquisitionState>,
  payloadGeneratedAt: string | undefined
): DataSourceStatus {
  const states = keys.map((key) => ({ key, state: acquisition[key] }));
  const timestamps = states
    .map(({ state }) => validTimestamp(state?.updatedAt))
    .filter((timestamp): timestamp is number => timestamp !== undefined);
  const oldestTimestamp = timestamps.length > 0
    ? Math.min(...timestamps)
    : validTimestamp(payloadGeneratedAt);
  const updatedAt = oldestTimestamp ? new Date(oldestTimestamp).toISOString() : payloadGeneratedAt;
  const expired = !oldestTimestamp || Date.now() - oldestTimestamp > CACHE_STALE_AFTER_MS;
  const cached = states.filter(({ state }) => state?.mode === "cache").map(({ key }) => key);
  const unavailable = states.filter(({ state }) => state?.mode === "unavailable").map(({ key }) => key);
  const messages = [
    expired ? "赛程数据已超过 36 小时未更新" : "",
    cached.length > 0 ? `${cached.join("、")} 使用历史缓存` : "",
    unavailable.length > 0 ? `${unavailable.join("、")} 当前无可用数据` : ""
  ].filter(Boolean);

  return {
    id,
    name,
    url,
    status: expired || cached.length > 0 || unavailable.length > 0 ? "stale" : "fresh",
    updatedAt,
    message: messages.length > 0 ? messages.join("；") : undefined
  };
}

async function readScheduleCache(): Promise<CachedScheduleResult> {
  try {
    const schedulePath = join(process.cwd(), "data", "schedule.json");
    const payload = JSON.parse(await readFile(schedulePath, "utf8")) as CachedSchedule;
    const acquisition = payload.acquisition || {};

    return {
      generatedAt: payload.generatedAt || new Date(0).toISOString(),
      matches: payload.matches || [],
      sources: [
        buildSourceStatus(
          "TENCENT_SPORTS",
          "腾讯体育 NBA / CBA 赛程",
          TENCENT_SPORTS_URL,
          BASKETBALL_ACQUISITION_KEYS,
          acquisition,
          payload.generatedAt
        ),
        buildSourceStatus(
          "CHINA_BASKETBALL_OFFICIAL",
          "中国篮协官网 · 中国男篮",
          CHINA_BASKETBALL_URL,
          CHINA_MEN_ACQUISITION_KEYS,
          acquisition,
          payload.generatedAt
        ),
        buildSourceStatus(
          "LOL_ESPORTS_OFFICIAL",
          "LoL Esports 官网赛程",
          LOL_ESPORTS_URL,
          LOL_ACQUISITION_KEYS,
          acquisition,
          payload.generatedAt
        )
      ],
      errors: (payload.errors || []).filter(Boolean)
    };
  } catch (error) {
    const message = `赛程文件不可用：${error instanceof Error ? error.message : String(error)}`;
    return {
      generatedAt: new Date(0).toISOString(),
      matches: [],
      sources: [
        {
          id: "TENCENT_SPORTS",
          name: "腾讯体育 NBA / CBA 赛程",
          url: TENCENT_SPORTS_URL,
          status: "unavailable",
          message
        },
        {
          id: "CHINA_BASKETBALL_OFFICIAL",
          name: "中国篮协官网 · 中国男篮",
          url: CHINA_BASKETBALL_URL,
          status: "unavailable",
          message
        },
        {
          id: "LOL_ESPORTS_OFFICIAL",
          name: "LoL Esports 官网赛程",
          url: LOL_ESPORTS_URL,
          status: "unavailable",
          message
        }
      ],
      errors: [message]
    };
  }
}

function buildResponse(cache: CachedScheduleResult, matches = cache.matches, sources = cache.sources): ScheduleResponse {
  return {
    generatedAt: cache.generatedAt,
    matches: sanitizeAndDedupe(matches),
    // 赛程结果不能替代官方联盟排名；保留字段仅用于兼容既有接口消费者。
    standings: [],
    sources,
    isStale: sources.some((source) => source.status !== "fresh"),
    errors: cache.errors.length > 0 ? cache.errors : undefined
  };
}

export async function getNbaSchedule(): Promise<ScheduleResponse> {
  const cache = await readScheduleCache();
  return buildResponse(
    cache,
    cache.matches.filter((match) => match.league === "NBA"),
    cache.sources.filter((source) => source.id === "TENCENT_SPORTS")
  );
}

export async function getCombinedSchedule(): Promise<ScheduleResponse> {
  const cache = await readScheduleCache();
  return buildResponse(cache);
}
