"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import type { Player } from "@/lib/types";

const POSITION_COLORS: Record<string, string> = {
  PG: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  SG: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  SF: "text-green-400 bg-green-400/10 border-green-400/30",
  PF: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  C: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  G: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  F: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
};

export function PlayerRow({ player }: { player: Player }) {
  const { isFavoritePlayer, toggleFavoritePlayer } = useFavorites();
  const fav = isFavoritePlayer(player.id);
  const posClass = POSITION_COLORS[player.position] || "text-white/30 bg-white/5 border-white/10";

  return (
    <div className={`flex items-center gap-2 border-b border-white/[0.04] px-3 py-2 transition hover:bg-white/[0.02] ${fav ? "bg-cyan-500/[0.06]" : ""}`}>
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavoritePlayer(player.id); }}
        className="grid h-6 w-6 shrink-0 place-items-center transition"
      >
        <Star className={`h-3.5 w-3.5 ${fav ? "fill-cyan-400 text-cyan-400" : "text-white/20"}`} />
      </button>
      <span className="w-5 text-center font-mono text-xs font-bold text-white/40">{player.number}</span>
      <span className="flex-1 truncate text-sm font-bold text-white/90">{player.nameZh || player.name}</span>
      <span className={`shrink-0 border px-1.5 py-0.5 text-[0.6rem] font-black ${posClass}`}>
        {player.position}
      </span>
    </div>
  );
}
