import type { League, MatchData, MatchStatus, Team } from "@/lib/types";

const NBA_SOURCE_URL = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json";
const NBA_VIDEO_URL = "https://www.nba.com/watch/featured";
const NBA_GALLERY_URL = "https://www.nba.com/photos";

type RawNbaTeam = {
  teamId?: number | string;
  teamCity?: string;
  teamName?: string;
  teamTricode?: string;
  score?: number | string;
};

type RawNbaGame = {
  gameId?: string;
  gameCode?: string;
  gameDateTimeUTC?: string;
  gameDateTimeEst?: string;
  gameDateTime?: string;
  arenaName?: string;
  arenaCity?: string;
  arenaState?: string;
  gameStatus?: number;
  gameStatusText?: string;
  homeTeam?: RawNbaTeam;
  awayTeam?: RawNbaTeam;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeStatus(gameStatus?: number | string, statusText = ""): MatchStatus {
  const statusCode = Number(gameStatus);

  if (statusCode === 2 || /live|q\d|halftime|进行|直播/i.test(statusText)) return "LIVE";
  if (statusCode === 3 || /final|finished|结束/i.test(statusText)) return "FINISHED";
  return "UPCOMING";
}

function normalizeNbaTeam(rawTeam: RawNbaTeam | undefined, fallback: string, colorIndex: 1 | 2): Team {
  const city = rawTeam?.teamCity || "";
  const nickname = rawTeam?.teamName || fallback;
  const fullName = `${city} ${nickname}`.trim();
  const abbreviation = rawTeam?.teamTricode || fullName.slice(0, 3).toUpperCase();

  return {
    id: String(rawTeam?.teamId || slugify(fullName || fallback)),
    name: fullName || fallback,
    nameZh: fullName || fallback,
    abbreviation,
    primaryColor: colorIndex === 1 ? "#00f0ff" : "#ff0055",
    secondaryColor: colorIndex === 1 ? "#bc00dd" : "#f8ff00",
    roster: []
  };
}

function parseScore(value: unknown) {
  const score = Number(value);
  return Number.isFinite(score) ? score : undefined;
}

export function normalizeNbaGame(rawGame: RawNbaGame): MatchData {
  const startsAt = rawGame.gameDateTimeUTC || rawGame.gameDateTimeEst || rawGame.gameDateTime || new Date().toISOString();
  const homeTeam = normalizeNbaTeam(rawGame.homeTeam, "Home Team", 1);
  const awayTeam = normalizeNbaTeam(rawGame.awayTeam, "Away Team", 2);
  const venueParts = [rawGame.arenaName, rawGame.arenaCity, rawGame.arenaState].filter(Boolean);

  return {
    id: `nba-${rawGame.gameId || rawGame.gameCode || `${homeTeam.id}-${awayTeam.id}-${startsAt}`}`,
    league: "NBA",
    startsAt,
    venue: venueParts.join(" / ") || "NBA Arena",
    status: normalizeStatus(rawGame.gameStatus, rawGame.gameStatusText),
    homeScore: parseScore(rawGame.homeTeam?.score),
    awayScore: parseScore(rawGame.awayTeam?.score),
    homeTeam,
    awayTeam,
    videoHighlightUrl: NBA_VIDEO_URL,
    galleryUrl: NBA_GALLERY_URL,
    broadcastProvider: "NBA.com",
    sourceUrl: NBA_SOURCE_URL
  };
}

export function normalizeNbaSchedule(rawData: unknown): MatchData[] {
  const data = rawData as {
    leagueSchedule?: {
      gameDates?: Array<{
        games?: RawNbaGame[];
      }>;
    };
  };

  return (data.leagueSchedule?.gameDates || [])
    .flatMap((gameDate) => gameDate.games || [])
    .map(normalizeNbaGame)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function buildFallbackTeam(league: League, name: string, index: 1 | 2): Team {
  const fallbackName = name || (index === 1 ? "Home Team" : "Away Team");

  return {
    id: slugify(`${league}-${fallbackName}`),
    name: fallbackName,
    nameZh: fallbackName,
    abbreviation: fallbackName.slice(0, 3).toUpperCase(),
    primaryColor: index === 1 ? "#00f0ff" : "#ff0055",
    secondaryColor: index === 1 ? "#bc00dd" : "#f8ff00",
    roster: []
  };
}
