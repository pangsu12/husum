import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { mockShelters, RECOMMENDED_SHELTER_NAME } from "../data/mockShelters";
import { FallbackMapView } from "./FallbackMapView";

type Props = {
  selectedShelterId?: string;
  onSelectShelter: (shelterId: string) => void;
  onOpenShelter: (shelterId: string) => void;
};

type MapStatus =
  | "client-id-missing"
  | "sdk-loading"
  | "sdk-loaded"
  | "map-rendered"
  | "sdk-failed";

type NaverLatLng = unknown;
type NaverMap = {
  setCenter?: (latLng: NaverLatLng) => void;
  panTo?: (latLng: NaverLatLng) => void;
};
type NaverMarker = {
  setMap?: (map: NaverMap | null) => void;
};

type NaverMaps = {
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  Map: new (
    element: HTMLElement,
    options: { center: NaverLatLng; zoom: number; minZoom?: number }
  ) => NaverMap;
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
const SDK_URL = clientId
  ? `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
  : "";
const CURRENT_LOCATION = { latitude: 37.6025, longitude: 127.0329 };

function hasValidCoordinates(shelter: (typeof mockShelters)[number]) {
  return (
    Number.isFinite(shelter.latitude) &&
    Number.isFinite(shelter.longitude) &&
    shelter.latitude !== 0 &&
    shelter.longitude !== 0
  );
}

function markerContent(color: string, selected = false) {
  const size = selected ? 34 : 26;
  const border = selected ? "#facc15" : "#ffffff";

  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:4px solid ${border};box-shadow:0 5px 14px rgba(15,23,42,.28);"></div>`;
}

function getFallbackLabel(status: MapStatus) {
  if (status === "client-id-missing") {
    return "fallback 지도 · 네이버 지도 Client ID가 없어 임시 지도를 표시합니다.";
  }

  if (status === "sdk-loading") return "네이버 지도 SDK 로딩 중";
  if (status === "sdk-loaded") return "네이버 지도 SDK 로드 성공 · 지도 생성 중";
  if (status === "sdk-failed") {
    return "임시 지도 · 네이버 지도 API 키가 없거나 로드되지 않아 임시 지도를 표시합니다.";
  }

  return "실제 네이버 지도 렌더링 완료";
}

export function NaverMapWeb({ selectedShelterId, onSelectShelter, onOpenShelter }: Props) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markerRefs = useRef<NaverMarker[]>([]);
  const [status, setStatus] = useState<MapStatus>(
    Platform.OS === "web" && clientId ? "sdk-loading" : "client-id-missing"
  );

  const selectedShelter = useMemo(
    () => mockShelters.find((shelter) => shelter.id === selectedShelterId) ?? mockShelters[0],
    [selectedShelterId]
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
    const validShelters = mockShelters.filter(hasValidCoordinates);

    if (!hasValidCoordinates(selectedShelter) || validShelters.length === 0) {
      setStatus("sdk-failed");
      return;
    }

    try {
      markerRefs.current.forEach((marker) => marker.setMap?.(null));
      markerRefs.current = [];

      const center = new maps.LatLng(selectedShelter.latitude, selectedShelter.longitude);
      const map =
        mapRef.current ??
        new maps.Map(mapElementRef.current, {
          center,
          zoom: 15,
          minZoom: 9
        });

      mapRef.current = map;
      map.panTo?.(center);

      const currentLocationMarker = new maps.Marker({
        position: new maps.LatLng(CURRENT_LOCATION.latitude, CURRENT_LOCATION.longitude),
        map,
        title: "내 위치",
        icon: {
          content: markerContent("#2563eb", true),
          anchor: new maps.LatLng(17, 17)
        }
      });
      markerRefs.current.push(currentLocationMarker);

      validShelters.forEach((shelter) => {
        const selected = shelter.id === selectedShelter.id;
        const recommended = shelter.name === RECOMMENDED_SHELTER_NAME || shelter.id === "shelter-1";
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

      setStatus("map-rendered");
    } catch {
      setStatus("sdk-failed");
    }
  }, [onSelectShelter, selectedShelter, status]);

  if (status === "sdk-failed" || status === "client-id-missing") {
    return (
      <FallbackMapView
        selectedShelterId={selectedShelterId}
        onSelectShelter={onSelectShelter}
        onOpenShelter={onOpenShelter}
        mapStatusLabel={getFallbackLabel(status)}
      />
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.statusPill}>{getFallbackLabel(status)}</div>
      <div ref={mapElementRef} style={styles.mapCanvas} />
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
