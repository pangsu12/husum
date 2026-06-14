import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { RegionKey } from "../types/shelter";

export type AppRegionKey = RegionKey;
export type ConcreteRegionKey = Exclude<RegionKey, "current">;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type RegionOption = {
  key: AppRegionKey;
  label: string;
  shortLabel: string;
  latitude: number;
  longitude: number;
  analysisScore?: number;
  concreteRegion: ConcreteRegionKey;
};

export const regionOptions: RegionOption[] = [
  {
    key: "current",
    label: "현재 위치",
    shortLabel: "현재 위치",
    latitude: 37.5894,
    longitude: 127.0167,
    analysisScore: 48.63,
    concreteRegion: "seoul"
  },
  {
    key: "seoul",
    label: "서울",
    shortLabel: "서울",
    latitude: 37.5894,
    longitude: 127.0167,
    analysisScore: 48.63,
    concreteRegion: "seoul"
  },
  {
    key: "daejeon",
    label: "대전",
    shortLabel: "대전",
    latitude: 36.3504,
    longitude: 127.3845,
    analysisScore: 39.73,
    concreteRegion: "daejeon"
  },
  {
    key: "daegu",
    label: "대구",
    shortLabel: "대구",
    latitude: 35.8714,
    longitude: 128.6014,
    analysisScore: 71.1,
    concreteRegion: "daegu"
  },
  {
    key: "busan",
    label: "부산",
    shortLabel: "부산",
    latitude: 35.1796,
    longitude: 129.0756,
    analysisScore: 24.21,
    concreteRegion: "busan"
  },
  {
    key: "gwangju",
    label: "광주",
    shortLabel: "광주",
    latitude: 35.1595,
    longitude: 126.8526,
    analysisScore: 33.04,
    concreteRegion: "gwangju"
  }
];

type LocationContextValue = {
  selectedRegion: AppRegionKey;
  setSelectedRegion: (region: AppRegionKey) => void;
  selectedRegionOption: RegionOption;
  effectiveRegionOption: RegionOption;
  concreteRegion: ConcreteRegionKey;
  regionLabel: string;
  analysisRegionLabel: string;
  surroundingLabel: string;
  currentLocation: Coordinates;
  moveToCurrentLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

function getRegionOption(region: AppRegionKey) {
  return regionOptions.find((option) => option.key === region) ?? regionOptions[0];
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(origin: Coordinates, destination: Coordinates) {
  const earthRadius = 6371000;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const startLatitude = toRadians(origin.latitude);
  const endLatitude = toRadians(destination.latitude);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function getNearestConcreteRegion(location: Coordinates) {
  const concreteOptions = regionOptions.filter((option) => option.key !== "current");

  return concreteOptions.reduce((nearest, option) => {
    const nearestDistance = getDistanceMeters(location, nearest);
    const optionDistance = getDistanceMeters(location, option);

    return optionDistance < nearestDistance ? option : nearest;
  }, concreteOptions[0]);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedRegion, setSelectedRegion] = useState<AppRegionKey>("current");
  const [browserLocation, setBrowserLocation] = useState<Coordinates | null>(null);

  const moveToCurrentLocation = () => {
    setSelectedRegion("current");

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  };

  const value = useMemo<LocationContextValue>(() => {
    const selectedRegionOption = getRegionOption(selectedRegion);
    const regionLabel = selectedRegionOption.label;
    const effectiveRegionOption =
      selectedRegion === "current" && browserLocation
        ? getNearestConcreteRegion(browserLocation)
        : selectedRegionOption;
    const currentLocation =
      selectedRegion === "current" && browserLocation
        ? browserLocation
        : {
            latitude: selectedRegionOption.latitude,
            longitude: selectedRegionOption.longitude
          };

    return {
      selectedRegion,
      setSelectedRegion,
      selectedRegionOption,
      effectiveRegionOption,
      concreteRegion: effectiveRegionOption.concreteRegion,
      regionLabel,
      analysisRegionLabel: effectiveRegionOption.shortLabel,
      surroundingLabel: `${regionLabel} 주변`,
      currentLocation,
      moveToCurrentLocation
    };
  }, [browserLocation, selectedRegion]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationSelection() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocationSelection must be used within LocationProvider");
  }

  return context;
}
