"use client";

import { useEffect, useState } from "react";
import type { Player, Position } from "@/lib/types";

const POSITION_COLORS: Record<Position, string> = {
  PG: "text-cyan-400",
  SG: "text-fuchsia-400",
  SF: "text-emerald-400",
  PF: "text-amber-400",
  C: "text-rose-400",
  G: "text-purple-400",
  F: "text-lime-400",
};

export function DataTable({ players }: { players: Player[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (players.length === 0) {
    return (
      <p className="py-4 text-center text-xs uppercase tracking-[0.14em] text-white/40">
        NO ROSTER DATA
      </p>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded border border-white/5 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="px-3 py-3 font-mono text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/50">
              #
            </th>
            <th className="px-3 py-3 font-mono text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/50">
              NAME
            </th>
            <th className="px-3 py-3 font-mono text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/50">
              POS
            </th>
            <th className="px-3 py-3 font-mono text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/50">
              ROLE
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.id}
              className="border-b border-white/[0.04] transition-colors duration-200 hover:bg-purple-900/20"
            >
              <td className="px-3 py-3 font-mono text-white/70">{player.number}</td>
              <td className="px-3 py-3 font-semibold text-white">
                <span>{player.nameZh || player.name}</span>
                {player.nameZh && player.nameZh !== player.name && (
                  <span className="ml-2 text-white/40">{player.name}</span>
                )}
              </td>
              <td className={`px-3 py-3 font-mono font-bold ${POSITION_COLORS[player.position] || "text-white/60"}`}>
                {player.position}
              </td>
              <td className="px-3 py-3 text-white/50">{player.role || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
