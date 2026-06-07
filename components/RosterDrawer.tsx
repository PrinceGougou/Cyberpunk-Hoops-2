"use client";

import { Shield, Star, StarOff } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import type { Player, Team } from "@/lib/types";

const POSITION_ORDER = ["PG", "SG", "SF", "PF", "C", "G", "F"];

function groupPlayers(players: Player[]) {
  return POSITION_ORDER.map((position) => ({
    position,
    players: players.filter((player) => player.position === position)
  })).filter((group) => group.players.length > 0);
}

function TeamRoster({ team }: { team: Team }) {
  const { isFavoritePlayer, toggleFavoritePlayer } = useFavorites();
  const groupedPlayers = groupPlayers(team.roster);

  return (
    <div className="min-w-0 border border-white/10 bg-black/25 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyanpunk">
        <Shield className="h-4 w-4" />
        {team.nameZh}
      </div>

      <div className="space-y-4">
        {groupedPlayers.map((group) => (
          <div key={group.position}>
            <div className="mb-2 inline-flex border border-red-400/40 px-2 py-1 text-[0.65rem] font-black text-red-400">
              {group.position}
            </div>
            <div className="space-y-2">
              {group.players.map((player) => {
                const favorite = isFavoritePlayer(player.id);

                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-[2.75rem_1fr_2.5rem] items-center gap-3 border px-3 py-2 text-sm transition ${
                      favorite
                        ? "border-yellow-400/70 bg-yellow-400/10 shadow-[0_0_16px_rgba(248,255,0,0.20)]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <span className="font-black text-yellow-400">#{player.number}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-white">{player.nameZh || player.name}</span>
                      <span className="block truncate text-[0.7rem] uppercase tracking-[0.12em] text-white/45">
                        {player.name}
                      </span>
                    </span>
                    <button
                      type="button"
                      title={favorite ? "取消关注球员" : "关注球员"}
                      onClick={() => toggleFavoritePlayer(player.id)}
                      className={`grid h-9 w-9 place-items-center border transition ${
                        favorite
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-cyan-400/35 text-cyan-400 hover:border-yellow-400 hover:text-yellow-400"
                      }`}
                    >
                      {favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groupedPlayers.length === 0 ? (
          <div className="border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs font-bold tracking-[0.14em] text-cyan-400/70">
            球员名单等待官方数据同步
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RosterDrawer({ homeTeam, awayTeam }: { homeTeam: Team; awayTeam: Team }) {
  return (
    <div className="mt-5 border-t border-cyan-400/20 pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black tracking-[0.22em] text-white">队伍队员展示</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/60 via-transparent to-transparent" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamRoster team={homeTeam} />
        <TeamRoster team={awayTeam} />
      </div>
    </div>
  );
}
