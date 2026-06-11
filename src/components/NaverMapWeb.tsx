import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { mockShelters, RECOMMENDED_SHELTER_NAME } from "../data/mockShelters";
import { Shelter } from "../types/shelter";
import { FallbackMapView } from "./FallbackMapView";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  shelters?: Shelter[];
  selectedShelterId?: string;
  currentLocation?: Coordinates;
  departureLocation?: Coordinates;
  mapCenter?: Coordinates;
  regionLabel?: string;
  onSelectShelter: (shelterId: string) => void;
  onOpenShelter: (shelterId: string) => void;
};

type MapStatus = "client-id-missing" | "sdk-loading" | "sdk-loaded" | "map-rendered" | "sdk-failed";

type NaverLatLng = unknown;
type NaverMap = {
  panTo?: (latLng: NaverLatLng) => void;
};
type NaverMarker = {
  setMap?: (map: NaverMap | null) => void;
};

type NaverMaps = {
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  Map: new (element: HTMLElement, options: { center: NaverLatLng; zoom: number; minZoom?: number }) => NaverMap;
  Marker: new (options: {
    position: NaverLatLng;
    map: NaverMap;
    title?: string;
    icon?: { content: string; anchor?: NaverLatLng };
  }) => NaverMarker;
  Event: {
    addListener: (target: NaverMarker, eventName: string, handler: () => void) => void;
  };
};

declare const process: {
  env: {
    EXPO_PUBLIC_NAVER_MAP_CLIENT_ID?: string;
  };
};

declare global {
  interface Window {
    naver?: {
      maps?: NaverMaps;
    };
  }
}

const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID?.trim();
const SDK_SCRIPT_ID = "naver-map-sdk";
const SDK_URL = clientId ? `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}` : "";
const DEFAULT_LOCATION = { latitude: 37.5894, longitude: 127.0167 };

function hasValidCoordinates(shelter: Shelter) {
  return (
    Number.isFinite(shelter.latitude) &&
    Number.isFinite(shelter.longitude) &&
    shelter.latitude !== 0 &&
    shelter.longitude !== 0
  );
}

function markerContent(color: string, selected = false, label?: string) {
  const size = selected ? 34 : 26;
  const border = selected ? "#facc15" : "#ffffff";
  const text = label
    ? `<span style="color:#fff;font-size:11px;font-weight:900;line-height:${size - 8}px;">${label}</span>`
    : "";

  return `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:4px solid ${border};box-shadow:0 5px 14px rgba(15,23,42,.28);">${text}</div>`;
}

function hasNaverMapError(element: HTMLElement | null) {
  const message = element?.textContent ?? "";

  return message.includes("Open API") || message.toLowerCase().includes("auth");
}

function getMapStatusLabel(status: MapStatus, regionLabel: string) {
  if (status === "sdk-loading") return `${regionLabel} 주변 쉼터 지도를 불러오는 중입니다.`;
  if (status === "sdk-loaded") return `${regionLabel} 주변 쉼터 정보를 지도에 표시하고 있습니다.`;
  return `${regionLabel} 주변 쉼터를 표시하고 있습니다.`;
}

export function NaverMapWeb({
  shelters = mockShelters,
  selectedShelterId,
  currentLocation = DEFAULT_LOCATION,
  departureLocation,
  mapCenter,
  regionLabel = "현재 위치",
  onSelectShelter,
  onOpenShelter
}: Props) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markerRefs = useRef<NaverMarker[]>([]);
  const [status, setStatus] = useState<MapStatus>(
    Platform.OS === "web" && clientId ? "sdk-loading" : "client-id-missing"
  );

  const selectedShelter = useMemo(
    () => shelters.find((shelter) => shelter.id === selectedShelterId) ?? shelters[0] ?? mockShelters[0],
    [selectedShelterId, shelters]
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") {
      setStatus("sdk-failed");
      return;
    }

    if (!clientId) {
      setStatus("client-id-missing");
      return;
    }

    if (window.naver?.maps) {
      setStatus("sdk-loaded");
      return;
    }

    const existingScript = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      const handleLoad = () => setStatus(window.naver?.maps ? "sdk-loaded" : "sdk-failed");
      const handleError = () => setStatus("sdk-failed");

      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.async = true;
    script.src = SDK_URL;
    script.onload = () => setStatus(window.naver?.maps ? "sdk-loaded" : "sdk-failed");
    script.onerror = () => setStatus("sdk-failed");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (status !== "sdk-loaded" && status !== "map-rendered") return;
    if (!mapElementRef.current || !window.naver?.maps) {
      setStatus("sdk-failed");
      return;
    }

    const maps = window.naver.maps;
    const validShelters = shelters.filter(hasValidCoordinates);

    if (validShelters.length === 0) {
      setStatus("sdk-failed");
      return;
    }

    try {
      markerRefs.current.forEach((marker) => marker.setMap?.(null));
      markerRefs.current = [];

      const centerPoint = mapCenter ?? departureLocation ?? currentLocation;
      const center = new maps.LatLng(centerPoint.latitude, centerPoint.longitude);
      const map =
        mapRef.current ??
        new maps.Map(mapElementRef.current, {
          center,
          zoom: 13,
          minZoom: 9
        });

      mapRef.current = map;
      map.panTo?.(center);

      const currentMarker = new maps.Marker({
        position: new maps.LatLng(currentLocation.latitude, currentLocation.longitude),
        map,
        title: "현재 위치",
        icon: {
          content: markerContent("#2563eb", true, "현"),
          anchor: new maps.LatLng(17, 17)
        }
      });
      markerRefs.current.push(currentMarker);

      if (departureLocation) {
        const departureMarker = new maps.Marker({
          position: new maps.LatLng(departureLocation.latitude, departureLocation.longitude),
          map,
          title: "출발지",
          icon: {
            content: markerContent("#9333ea", true, "출"),
            anchor: new maps.LatLng(17, 17)
          }
        });
        markerRefs.current.push(departureMarker);
      }

      validShelters.forEach((shelter, index) => {
        const selected = shelter.id === selectedShelter.id;
        const recommended = shelter.name === RECOMMENDED_SHELTER_NAME || index === 0;
        const marker = new maps.Marker({
          position: new maps.LatLng(shelter.latitude, shelter.longitude),
          map,
          title: shelter.name,
          icon: {
            content: markerContent(recommended ? "#f59e0b" : "#16a34a", selected || recommended),
            anchor: new maps.LatLng(selected ? 17 : 13, selected ? 17 : 13)
          }
        });

        maps.Event.addListener(marker, "click", () => onSelectShelter(shelter.id));
        markerRefs.current.push(marker);
      });

      window.setTimeout(() => {
        setStatus(hasNaverMapError(mapElementRef.current) ? "sdk-failed" : "map-rendered");
      }, 300);
    } catch {
      setStatus("sdk-failed");
    }
  }, [currentLocation, departureLocation, mapCenter, onSelectShelter, selectedShelter, shelters, status]);

  if (status === "sdk-failed" || status === "client-id-missing") {
    return (
      <FallbackMapView
        shelters={shelters}
        selectedShelterId={selectedShelterId}
        currentLocation={currentLocation}
        departureLocation={departureLocation}
        onSelectShelter={onSelectShelter}
        onOpenShelter={onOpenShelter}
        mapStatusLabel={getMapStatusLabel(status, regionLabel)}
        regionLabel={regionLabel}
      />
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.statusPill}>{getMapStatusLabel(status, regionLabel)}</div>
      <div
        ref={mapElementRef}
        style={{
          ...styles.mapCanvas,
          visibility: status === "map-rendered" ? "visible" : "hidden"
        }}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    position: "relative",
    height: 390,
    overflow: "hidden",
    borderRadius: 18,
    border: "1px solid #dbe3ef",
    backgroundColor: "#eef2f7"
  },
  statusPill: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    maxWidth: "calc(100% - 20px)",
    padding: "7px 10px",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: "0 4px 12px rgba(15,23,42,.12)"
  },
  mapCanvas: {
    width: "100%",
    height: "100%"
  }
};
