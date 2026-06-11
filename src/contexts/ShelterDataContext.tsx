import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { mockShelters } from "../data/mockShelters";
import { fetchSheltersFromApi, ShelterDataResult } from "../services/shelterApi";
import { Shelter } from "../types/shelter";

type ShelterDataContextValue = ShelterDataResult & {
  loading: boolean;
  findShelter: (shelterId: string) => Shelter | undefined;
};

const ShelterDataContext = createContext<ShelterDataContextValue | undefined>(undefined);

const SHELTER_INFO_MESSAGE = "주변 쉼터 정보를 불러와 현재 위치와 사용자 조건에 맞게 추천합니다.";

export function ShelterDataProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<ShelterDataContextValue>(
    () => ({
      ...result,
      loading,
      findShelter: (shelterId) =>
        result.shelters.find((shelter) => shelter.id === shelterId) ??
        mockShelters.find((shelter) => shelter.id === shelterId)
    }),
    [loading, result]
  );

  return <ShelterDataContext.Provider value={value}>{children}</ShelterDataContext.Provider>;
}

export function useShelterData() {
  const context = useContext(ShelterDataContext);

  if (!context) {
    throw new Error("useShelterData must be used within ShelterDataProvider");
  }

  return context;
}
