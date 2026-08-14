"use client";

import type { ScheduleScope } from "@/lib/types";

const SCOPES: { label: string; value: ScheduleScope }[] = [
  { label: "近日", value: "NEARBY" },
  { label: "后续赛程", value: "UPCOMING" },
  { label: "最近赛果", value: "RESULTS" }
];

export function ScheduleScopeTabs({
  selected,
  onSelect
}: {
  selected: ScheduleScope;
  onSelect: (scope: ScheduleScope) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="比赛时间范围">
      {SCOPES.map((scope) => {
        const active = selected === scope.value;
        return (
          <button
            key={scope.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(scope.value)}
            className={`min-h-9 border px-4 text-xs font-black tracking-wide transition-all ${
              active
                ? "border-magpunk/60 bg-magpunk/10 text-fuchsia-300"
                : "border-white/[0.06] bg-black/40 text-white/35 hover:border-white/20 hover:text-white/70"
            }`}
          >
            {scope.label}
          </button>
        );
      })}
    </div>
  );
}
