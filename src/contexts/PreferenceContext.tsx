import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { UserPreferences } from "../types/shelter";

export const preferenceTags = {
  senior: "어르신",
  infant: "영유아 동반",
  disabled: "장애인",
  outdoorWorker: "야외근로자",
  pregnant: "임산부",
  pet: "반려동물 동반",
  mobility: "보행이 불편함",
  transit: "대중교통 이용"
} as const;

export const routePreferences = {
  shortest: "최단 거리 우선",
  accessible: "계단/경사 최소화",
  shade: "그늘길/실내 경유 우선"
} as const;

export const defaultPreferences: UserPreferences = {
  tags: [preferenceTags.mobility, preferenceTags.senior],
  routePreference: "accessible"
};

type PreferenceContextValue = {
  preferences: UserPreferences;
  setPreferences: (next: UserPreferences) => void;
  selectedTagLabels: string[];
  routeLabel: string;
};

const PreferenceContext = createContext<PreferenceContextValue | undefined>(undefined);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const value = useMemo<PreferenceContextValue>(
    () => ({
      preferences,
      setPreferences,
      selectedTagLabels: preferences.tags,
      routeLabel: preferences.routePreference
        ? routePreferences[preferences.routePreference]
        : routePreferences.shortest
    }),
    [preferences]
  );

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferenceSettings() {
  const context = useContext(PreferenceContext);

  if (!context) {
    throw new Error("usePreferenceSettings must be used within PreferenceProvider");
  }

  return context;
}
