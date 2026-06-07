"use client";

import { Monitor, Radar, Star } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

export function ScanlineToggle({
  starFilterEnabled,
  onStarFilterChange
}: {
  starFilterEnabled: boolean;
  onStarFilterChange: (enabled: boolean) => void;
}) {
  const { scanlinesEnabled, setScanlinesEnabled, favoritePlayerIds } = useFavorites();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        title="球星雷达筛选"
        onClick={() => onStarFilterChange(!starFilterEnabled)}
        className={`flex min-h-12 items-center justify-center gap-2 border px-4 text-xs font-black uppercase tracking-[0.16em] transition ${
          starFilterEnabled
            ? "border-acid bg-acid text-black shadow-[0_0_20px_rgba(248,255,0,0.45)]"
            : "border-acid/35 bg-black/40 text-acid hover:border-acid hover:bg-acid/10"
        }`}
      >
        <Radar className="h-4 w-4" />
        STAR FILTER
        <span className="inline-flex h-6 min-w-6 items-center justify-center border border-current px-1">
          {favoritePlayerIds.length}
        </span>
      </button>

      <button
        type="button"
        title="CRT scanline overlay"
        onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
        className={`flex min-h-12 items-center justify-center gap-2 border px-4 text-xs font-black uppercase tracking-[0.16em] transition ${
          scanlinesEnabled
            ? "border-purplepunk bg-purplepunk text-white shadow-purple"
            : "border-purplepunk/35 bg-black/40 text-purplepunk hover:border-purplepunk hover:bg-purplepunk/10"
        }`}
      >
        {scanlinesEnabled ? <Monitor className="h-4 w-4" /> : <Star className="h-4 w-4" />}
        CRT GRID
      </button>
    </div>
  );
}
