import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { useLocationSelection } from "./LocationContext";
import { mockShelters } from "../data/mockShelters";
import { fetchSheltersFromApi, ShelterDataResult } from "../services/shelterApi";
import { Shelter } from "../types/shelter";

type ShelterDataContextValue = ShelterDataResult & {
  allShelters: Shelter[];
  filteredShelters: Shelter[];
  apiShelterCount: number;
  filteredShelterCount: number;
  loading: boolean;
  findShelter: (shelterId: string) => Shelter | undefined;
};

const ShelterDataContext = createContext<ShelterDataContextValue | undefined>(undefined);

const SHELTER_INFO_MESSAGE = "주변 쉼터 정보를 불러와 현재 위치와 사용자 조건에 맞게 추천합니다.";

function dedupeShelters(shelters: Shelter[]) {
  const seen = new Set<string>();

  return shelters.filter((shelter) => {
    const key = `${shelter.name.trim()}-${shelter.address.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ShelterDataProvider({ children }: { children: ReactNode }) {
  const { concreteRegion } = useLocationSelection();
  const [result, setResult] = useState<ShelterDataResult>({
    shelters: mockShelters,
    source: "mock",
    message: SHELTER_INFO_MESSAGE
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchSheltersFromApi()
      .then((next) => {
        if (mounted) setResult({ ...next, message: SHELTER_INFO_MESSAGE });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<ShelterDataContextValue>(() => {
    const apiShelterCount = result.source === "api" ? result.shelters.length : 0;
    const baseShelters = result.shelters.length > 0 ? result.shelters : mockShelters;
    const regionalApiShelters = baseShelters.filter((shelter) => shelter.region === concreteRegion);
    const regionalDefaultShelters = mockShelters.filter((shelter) => shelter.region === concreteRegion);
    const filteredShelters = dedupeShelters(
      regionalApiShelters.length >= 3 ? regionalApiShelters : [...regionalApiShelters, ...regionalDefaultShelters]
    );
    const allShelters = dedupeShelters([...baseShelters, ...mockShelters]);

    return {
      ...result,
      allShelters,
      shelters: filteredShelters,
      filteredShelters,
      apiShelterCount,
      filteredShelterCount: filteredShelters.length,
      loading,
      message: SHELTER_INFO_MESSAGE,
      findShelter: (shelterId) =>
        allShelters.find((shelter) => shelter.id === shelterId) ??
        mockShelters.find((shelter) => shelter.id === shelterId)
    };
  }, [concreteRegion, loading, result]);

  return <ShelterDataContext.Provider value={value}>{children}</ShelterDataContext.Provider>;
}

export function useShelterData() {
  const context = useContext(ShelterDataContext);

  if (!context) {
    throw new Error("useShelterData must be used within ShelterDataProvider");
  }

  return context;
}
