import type { Team } from "@/lib/types";

export function TeamLogo({ team, size = "md" }: { team: Team; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-12 w-12 text-[0.7rem]",
    md: "h-16 w-16 text-sm",
    lg: "h-20 w-20 text-base"
  }[size];

  return (
    <div
      className={`${sizeClass} relative grid shrink-0 place-items-center overflow-hidden border font-black uppercase text-black shadow-cyan`}
      style={{
        borderColor: team.primaryColor,
        background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`
      }}
      aria-label={`${team.nameZh} logo placeholder`}
    >
      <span className="relative z-10">{team.abbreviation}</span>
      <span className="absolute inset-x-2 top-2 h-px bg-black/55" />
      <span className="absolute inset-y-2 right-2 w-px bg-black/55" />
      <span className="absolute -bottom-5 -left-5 h-12 w-12 rotate-45 bg-white/25" />
    </div>
  );
}
