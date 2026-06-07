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
  const { isFavorite, toggleFavorite } = useFavorites();
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
            <div className="mb-2 inline-flex border border-magpunk/40 px-2 py-1 text-[0.65rem] font-black text-magpunk">
              {group.position}
            </div>
            <div className="space-y-2">
              {group.players.map((player) => {
                const favorite = isFavorite(player.id);

                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-[2.75rem_1fr_2.5rem] items-center gap-3 border px-3 py-2 text-sm transition ${
                      favorite
                        ? "border-acid/70 bg-acid/10 shadow-[0_0_16px_rgba(248,255,0,0.20)]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <span className="font-black text-acid">#{player.number}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-white">{player.nameZh || player.name}</span>
                      <span className="block truncate text-[0.7rem] uppercase tracking-[0.12em] text-white/45">
                        {player.name}
                      </span>
                    </span>
                    <button
                      type="button"
                      title={favorite ? "取消关注球星" : "关注球星"}
                      onClick={() => toggleFavorite(player.id)}
                      className={`grid h-9 w-9 place-items-center border transition ${
                        favorite
                          ? "border-acid bg-acid text-black"
                          : "border-cyanpunk/35 text-cyanpunk hover:border-acid hover:text-acid"
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
          <div className="border border-cyanpunk/20 bg-cyanpunk/5 p-4 text-xs font-bold uppercase tracking-[0.14em] text-cyanpunk/70">
            Roster feed pending / 球员名单等待官方数据同步
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RosterDrawer({ homeTeam, awayTeam }: { homeTeam: Team; awayTeam: Team }) {
  return (
    <div className="mt-5 border-t border-cyanpunk/20 pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Active Roster / 球队队员展示</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-cyanpunk/60 via-magpunk/40 to-transparent" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamRoster team={homeTeam} />
        <TeamRoster team={awayTeam} />
      </div>
    </div>
  );
}
