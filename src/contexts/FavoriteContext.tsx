import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type FavoriteContextValue = {
  favoriteIds: string[];
  isFavorite: (shelterId: string) => boolean;
  toggleFavorite: (shelterId: string) => void;
};

const FavoriteContext = createContext<FavoriteContextValue | undefined>(undefined);

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(["shelter-1"]);

  const value = useMemo<FavoriteContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (shelterId) => favoriteIds.includes(shelterId),
      toggleFavorite: (shelterId) => {
        setFavoriteIds((current) =>
          current.includes(shelterId)
            ? current.filter((id) => id !== shelterId)
            : [...current, shelterId]
        );
      }
    }),
    [favoriteIds]
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoriteContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoriteProvider");
  }

  return context;
}
