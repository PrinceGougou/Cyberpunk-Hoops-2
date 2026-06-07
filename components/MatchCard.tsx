"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, Image, MapPin, Play, RadioTower, Zap } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { TeamLogo } from "@/components/TeamLogo";
import type { MatchData, Team } from "@/lib/types";

const STATUS_META = {
  UPCOMING: { className: "border-cyan-500/60 text-cyan-400", glow: "" },
  LIVE: { className: "border-magpunk bg-magpunk/20 text-white animate-pulse-glow", glow: "shadow-glow-magenta" },
  FINISHED: { className: "border-white/20 text-white/50", glow: "" },
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function TeamBlock({
  team,
  label,
  score,
}: {
  team: Team;
  label: "主队" | "客队";
  score?: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TeamLogo team={team} />
      <div className="min-w-0">
        <span className="mb-1 inline-block text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/40">
          {label}
        </span>
        <div className="truncate text-lg font-black tracking-tight text-white sm:text-xl">{team.nameZh}</div>
        <div className="truncate text-[0.65rem] uppercase tracking-[0.16em] text-cyanpunk">{team.name}</div>
      </div>
      {typeof score === "number" ? (
        <div className="ml-auto font-mono text-3xl font-black tabular-nums text-acid drop-shadow-[0_0_8px_rgba(240,255,0,0.5)]">
          {score}
        </div>
      ) : null}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function MatchCard({
  match,
  expanded,
  onToggle,
  index = 0,
}: {
  match: MatchData;
  expanded: boolean;
  onToggle: () => void;
  index?: number;
}) {
  const statusMeta = STATUS_META[match.status] ?? STATUS_META.UPCOMING;

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="group relative cursor-pointer overflow-hidden border border-cyan-500/30 bg-black/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-cyanpunk hover:shadow-glow-cyan"
      onClick={onToggle}
    >
      {/* Subtle top-edge neon line */}
      <div className="absolute left-4 right-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyanpunk to-transparent opacity-60" />

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-purplepunk/40 bg-purplepunk/10 px-2 py-1 font-mono text-[0.6rem] font-black uppercase tracking-[0.18em] text-purple-300">
              {match.league === "TEAM_CHINA" ? "TEAM CHINA" : match.league}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.6rem] font-black uppercase tracking-[0.18em] ${statusMeta.className} ${statusMeta.glow}`}
            >
              {match.status}
              {match.status === "LIVE" && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-magpunk opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-magpunk" />
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            aria-label={expanded ? "收起" : "展开"}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="grid h-9 w-9 place-items-center border border-cyan-500/40 text-cyanpunk transition hover:bg-cyanpunk hover:text-black"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Meta row */}
        <div className="mb-4 flex flex-wrap gap-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/50">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyanpunk" />
            {formatDateTime(match.startsAt)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-magpunk" />
            <span className="truncate">{match.venue}</span>
          </span>
        </div>

        {/* Score row */}
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <TeamBlock team={match.homeTeam} label="主队" score={match.homeScore} />
          <div className="mx-auto hidden border border-acid/60 px-4 py-1.5 font-mono text-xs font-black text-acid shadow-[0_0_14px_rgba(240,255,0,0.25)] xl:block">
            VS
          </div>
          <TeamBlock team={match.awayTeam} label="客队" score={match.awayScore} />
        </div>

        {/* Media row */}
        <div className="mt-5 border-t border-white/[0.08] pt-4" onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 font-mono text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/40">
            MEDIA ACCESS
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={match.videoHighlightUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 border border-magpunk/60 px-3 font-mono text-[0.65rem] font-black uppercase tracking-[0.12em] text-magpunk transition hover:bg-magpunk hover:text-white hover:shadow-glow-magenta"
            >
              <Play className="h-4 w-4" />
              HIGHLIGHTS
            </a>
            <a
              href={match.galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 border border-cyanpunk/60 px-3 font-mono text-[0.65rem] font-black uppercase tracking-[0.12em] text-cyanpunk transition hover:bg-cyanpunk hover:text-black hover:shadow-glow-cyan"
            >
              <Image className="h-4 w-4" />
              GALLERY
            </a>
          </div>
          <div className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/30">
            {match.broadcastProvider}
          </div>
        </div>

        {/* Roster drawer */}
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 overflow-hidden border-t border-white/[0.08] pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[0.65rem] font-black uppercase tracking-[0.16em] text-cyanpunk">
                  <Zap className="h-3 w-3" />
                  {match.homeTeam.nameZh}
                </div>
                <DataTable players={match.homeTeam.roster} />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[0.65rem] font-black uppercase tracking-[0.16em] text-magpunk">
                  <Zap className="h-3 w-3" />
                  {match.awayTeam.nameZh}
                </div>
                <DataTable players={match.awayTeam.roster} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.article>
  );
}
