"use client";

import type { LeagueFilter } from "@/lib/types";

const FILTERS: { label: string; value: LeagueFilter }[] = [
  { label: "LOL", value: "LOL" },
  { label: "NBA", value: "NBA" },
  { label: "CBA", value: "CBA" },
  { label: "国家队", value: "TEAM_CHINA" }
];

export function LeagueTabs({
  selected,
  onSelect
}: {
  selected: LeagueFilter;
  onSelect: (filter: LeagueFilter) => void;
}) {
  return (
    <div className="flex w-full flex-wrap gap-1.5 rounded-none border border-white/10 bg-black/40 p-1.5 backdrop-blur">
      {FILTERS.map((filter) => {
        const active = selected === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onSelect(filter.value)}
            className={`min-h-10 flex-1 border px-3 text-sm font-bold tracking-wide transition-all ${
              active
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
