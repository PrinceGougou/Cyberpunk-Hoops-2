"use client";

import type { LeagueFilter } from "@/lib/types";

const FILTERS: { label: string; value: LeagueFilter }[] = [
  { label: "ALL", value: "ALL" },
  { label: "NBA", value: "NBA" },
  { label: "CBA", value: "CBA" },
  { label: "TEAM CHINA", value: "TEAM_CHINA" }
];

export function LeagueTabs({
  selected,
  onSelect
}: {
  selected: LeagueFilter;
  onSelect: (filter: LeagueFilter) => void;
}) {
  return (
    <div className="flex w-full flex-wrap gap-2 rounded-none border border-cyanpunk/25 bg-black/35 p-1 shadow-cyan backdrop-blur">
      {FILTERS.map((filter) => {
        const active = selected === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            title={`League filter: ${filter.label}`}
            onClick={() => onSelect(filter.value)}
            className={`min-h-11 flex-1 border px-4 text-xs font-black uppercase tracking-[0.18em] transition sm:min-w-28 ${
              active
                ? "border-cyanpunk bg-cyanpunk text-black shadow-cyan"
                : "border-white/10 bg-white/[0.03] text-cyanpunk hover:border-magpunk hover:text-white hover:shadow-magenta"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
