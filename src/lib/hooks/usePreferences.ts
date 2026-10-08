"use client";

import { useSyncExternalStore } from "react";

const FAVORITES_KEY = "forgekit_favorites";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getFavoritesSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(FAVORITES_KEY) || "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export function usePreferences() {
  const rawFavs = useSyncExternalStore(subscribe, getFavoritesSnapshot, getServerSnapshot);
  let favorites: string[] = [];
  try {
    favorites = JSON.parse(rawFavs);
  } catch {
    favorites = [];
  }

  const toggleFavorite = (slug: string) => {
    const next = favorites.includes(slug)
      ? favorites.filter((id) => id !== slug)
      : [...favorites, slug];
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error(e);
    }
  };

  return {
    favorites,
    isLoaded: true,
    toggleFavorite,
    isFavorite: (slug: string) => favorites.includes(slug),
  };
}
