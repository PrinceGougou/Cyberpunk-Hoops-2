export type League = "NBA" | "CBA" | "TEAM_CHINA";

export type MatchStatus = "UPCOMING" | "LIVE" | "FINISHED";

export type Position = "PG" | "SG" | "SF" | "PF" | "C" | "G" | "F";

export type Player = {
  id: string;
  name: string;
  nameZh?: string;
  number: string;
  position: Position;
  role?: string;
};

export type Team = {
  id: string;
  name: string;
  nameZh: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  roster: Player[];
};

export type MatchData = {
  id: string;
  league: League;
  startsAt: string;
  venue: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  homeTeam: Team;
  awayTeam: Team;
  videoHighlightUrl: string;
  galleryUrl: string;
  broadcastProvider: string;
  sourceUrl: string;
};

export type Match = MatchData;

export type StandingsRow = {
  teamId: string;
  teamName: string;
  league: League;
  wins: number;
  losses: number;
  rank: number;
};

export type LeagueFilter = "ALL" | League;

export type ScheduleResponse = {
  generatedAt: string;
  matches: MatchData[];
  standings: StandingsRow[];
  errors?: string[];
};
