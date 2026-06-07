"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type FavoritesContextValue = {
  favoritePlayerIds: string[];
  favoriteTeamIds: string[];
  scanlinesEnabled: boolean;
  toggleFavoritePlayer: (playerId: string) => void;
  toggleFavoriteTeam: (teamId: string) => void;
  isFavoritePlayer: (playerId: string) => boolean;
  isFavoriteTeam: (teamId: string) => boolean;
  setScanlinesEnabled: (enabled: boolean) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const FAVORITES_PLAYERS_KEY = "cyber-basketball.favorite-players";
const FAVORITES_TEAMS_KEY = "cyber-basketball.favorite-teams";
const SCANLINES_KEY = "cyber-basketball.scanlines";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [scanlinesEnabled, setScanlinesEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedPlayers = window.localStorage.getItem(FAVORITES_PLAYERS_KEY);
    const storedTeams = window.localStorage.getItem(FAVORITES_TEAMS_KEY);
    const storedScanlines = window.localStorage.getItem(SCANLINES_KEY);

    if (storedPlayers) {
      try { const parsed = JSON.parse(storedPlayers); setFavoritePlayerIds(Array.isArray(parsed) ? parsed : []); } catch { setFavoritePlayerIds([]); }
    }
    if (storedTeams) {
      try { const parsed = JSON.parse(storedTeams); setFavoriteTeamIds(Array.isArray(parsed) ? parsed : []); } catch { setFavoriteTeamIds([]); }
    }
    if (storedScanlines) setScanlinesEnabledState(storedScanlines === "true");

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FAVORITES_PLAYERS_KEY, JSON.stringify(favoritePlayerIds));
  }, [favoritePlayerIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FAVORITES_TEAMS_KEY, JSON.stringify(favoriteTeamIds));
  }, [favoriteTeamIds, hydrated]);

  const toggleFavoritePlayer = useCallback((playerId: string) => {
    setFavoritePlayerIds((c) => c.includes(playerId) ? c.filter((id) => id !== playerId) : [...c, playerId]);
  }, []);

  const toggleFavoriteTeam = useCallback((teamId: string) => {
    setFavoriteTeamIds((c) => c.includes(teamId) ? c.filter((id) => id !== teamId) : [...c, teamId]);
  }, []);

  const isFavoritePlayer = useCallback((playerId: string) => favoritePlayerIds.includes(playerId), [favoritePlayerIds]);
  const isFavoriteTeam = useCallback((teamId: string) => favoriteTeamIds.includes(teamId), [favoriteTeamIds]);

  const setScanlinesEnabled = useCallback((enabled: boolean) => {
    setScanlinesEnabledState(enabled);
    window.localStorage.setItem(SCANLINES_KEY, String(enabled));
  }, []);

  const value = useMemo(() => ({
    favoritePlayerIds, favoriteTeamIds, scanlinesEnabled,
    toggleFavoritePlayer, toggleFavoriteTeam,
    isFavoritePlayer, isFavoriteTeam, setScanlinesEnabled
  }), [favoritePlayerIds, favoriteTeamIds, scanlinesEnabled, toggleFavoritePlayer, toggleFavoriteTeam, isFavoritePlayer, isFavoriteTeam, setScanlinesEnabled]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
