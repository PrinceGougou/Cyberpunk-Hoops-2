"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type FavoritesContextValue = {
  favoritePlayerIds: string[];
  scanlinesEnabled: boolean;
  toggleFavorite: (playerId: string) => void;
  isFavorite: (playerId: string) => boolean;
  setScanlinesEnabled: (enabled: boolean) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const FAVORITES_KEY = "cyber-basketball.favorite-stars";
const SCANLINES_KEY = "cyber-basketball.scanlines";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);
  const [scanlinesEnabled, setScanlinesEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // 客户端挂载后再读取 localStorage，避免服务端渲染阶段访问浏览器 API。
  useEffect(() => {
    const storedFavorites = window.localStorage.getItem(FAVORITES_KEY);
    const storedScanlines = window.localStorage.getItem(SCANLINES_KEY);

    if (storedFavorites) {
      try {
        const parsed = JSON.parse(storedFavorites);
        setFavoritePlayerIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        setFavoritePlayerIds([]);
      }
    }

    if (storedScanlines) {
      setScanlinesEnabledState(storedScanlines === "true");
    }

    setHydrated(true);
  }, []);

  // hydration 完成前不写入，防止初始空数组覆盖用户已有关注球星。
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritePlayerIds));
  }, [favoritePlayerIds, hydrated]);

  const toggleFavorite = useCallback((playerId: string) => {
    setFavoritePlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );
  }, []);

  const isFavorite = useCallback(
    (playerId: string) => favoritePlayerIds.includes(playerId),
    [favoritePlayerIds]
  );

  const setScanlinesEnabled = useCallback((enabled: boolean) => {
    setScanlinesEnabledState(enabled);
    window.localStorage.setItem(SCANLINES_KEY, String(enabled));
  }, []);

  const value = useMemo(
    () => ({
      favoritePlayerIds,
      scanlinesEnabled,
      toggleFavorite,
      isFavorite,
      setScanlinesEnabled
    }),
    [favoritePlayerIds, isFavorite, scanlinesEnabled, setScanlinesEnabled, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }

  return context;
}
