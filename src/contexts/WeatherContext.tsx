import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { ConcreteRegionKey, useLocationSelection } from "./LocationContext";
import { fetchCurrentWeather, WeatherGrid } from "../services/weatherApi";
import { fetchHeatAlertStatus, HeatAlertStatus } from "../services/weatherAlertApi";
import { calculateHeatIllnessRisk } from "../utils/heatIllnessRisk";

export type HeatRiskLevel = "낮음" | "보통" | "높음" | "매우 높음";

export type WeatherState = {
  temperature: number;
  feelsLikeTemperature: number;
  humidity: number;
  condition: string;
  heatRiskLevel: HeatRiskLevel;
  heatAlertStatus: HeatAlertStatus;
  source: "default" | "api";
};

type RegionalWeatherConfig = WeatherState & {
  grid: WeatherGrid;
  alertStationId: string;
};

const regionalWeatherDefaults: Record<ConcreteRegionKey, RegionalWeatherConfig> = {
  seoul: {
    temperature: 34.2,
    feelsLikeTemperature: 37.6,
    humidity: 68,
    condition: "맑음",
    heatRiskLevel: "높음",
    heatAlertStatus: "none",
    source: "default",
    grid: { nx: 61, ny: 127 },
    alertStationId: "108"
  },
  daejeon: {
    temperature: 34.8,
    feelsLikeTemperature: 38.1,
    humidity: 66,
    condition: "맑음",
    heatRiskLevel: "높음",
    heatAlertStatus: "none",
    source: "default",
    grid: { nx: 67, ny: 100 },
    alertStationId: "133"
  },
  daegu: {
    temperature: 36.4,
    feelsLikeTemperature: 40.2,
    humidity: 62,
    condition: "맑음",
    heatRiskLevel: "매우 높음",
    heatAlertStatus: "none",
    source: "default",
    grid: { nx: 89, ny: 90 },
    alertStationId: "143"
  },
  busan: {
    temperature: 32.1,
    feelsLikeTemperature: 35.0,
    humidity: 74,
    condition: "구름 조금",
    heatRiskLevel: "보통",
    heatAlertStatus: "none",
    source: "default",
    grid: { nx: 98, ny: 76 },
    alertStationId: "159"
  },
  gwangju: {
    temperature: 35.1,
    feelsLikeTemperature: 38.7,
    humidity: 69,
    condition: "맑음",
    heatRiskLevel: "높음",
    heatAlertStatus: "none",
    source: "default",
    grid: { nx: 58, ny: 74 },
    alertStationId: "156"
  }
};

const WeatherContext = createContext<WeatherState | undefined>(undefined);

function getHeatRiskLevel(feelsLikeTemperature: number, heatAlertStatus: HeatAlertStatus): HeatRiskLevel {
  if (feelsLikeTemperature >= 40 || heatAlertStatus === "warning") return "매우 높음";
  if (feelsLikeTemperature >= 37 || heatAlertStatus === "advisory") return "높음";
  if (feelsLikeTemperature >= 33) return "보통";
  return "낮음";
}

function toWeatherState(config: RegionalWeatherConfig): WeatherState {
  return {
    temperature: config.temperature,
    feelsLikeTemperature: config.feelsLikeTemperature,
    humidity: config.humidity,
    condition: config.condition,
    heatRiskLevel: config.heatRiskLevel,
    heatAlertStatus: config.heatAlertStatus,
    source: config.source
  };
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { concreteRegion, effectiveRegionOption } = useLocationSelection();
  const [weather, setWeather] = useState<WeatherState>(() => toWeatherState(regionalWeatherDefaults.seoul));

  useEffect(() => {
    let mounted = true;
    const regionalDefault = regionalWeatherDefaults[concreteRegion];

    Promise.all([
      fetchCurrentWeather(regionalDefault.grid),
      fetchHeatAlertStatus(regionalDefault.alertStationId)
    ]).then(([currentWeather, alertStatus]) => {
      if (!mounted) return;

      const heatAlertStatus = alertStatus?.heatAlertStatus ?? regionalDefault.heatAlertStatus;

      if (!currentWeather) {
        const fallbackWeather = toWeatherState(regionalDefault);
        setWeather({
          ...fallbackWeather,
          heatAlertStatus,
          heatRiskLevel:
            alertStatus?.heatRiskLevel ??
            calculateHeatIllnessRisk({
              feelsLikeTemperature: fallbackWeather.feelsLikeTemperature,
              humidity: fallbackWeather.humidity,
              heatAlertStatus,
              vulnerabilityScore: effectiveRegionOption.analysisScore
            }).level,
          source: alertStatus ? "api" : "default"
        });
        return;
      }

      setWeather({
        temperature: currentWeather.temperature,
        feelsLikeTemperature: currentWeather.feelsLikeTemperature,
        humidity: currentWeather.humidity,
        condition: currentWeather.condition,
        heatAlertStatus,
        heatRiskLevel:
          alertStatus?.heatRiskLevel ??
          calculateHeatIllnessRisk({
            feelsLikeTemperature: currentWeather.feelsLikeTemperature,
            humidity: currentWeather.humidity,
            heatAlertStatus,
            vulnerabilityScore: effectiveRegionOption.analysisScore
          }).level ??
          getHeatRiskLevel(currentWeather.feelsLikeTemperature, heatAlertStatus),
        source: "api"
      });
    });

    return () => {
      mounted = false;
    };
  }, [concreteRegion, effectiveRegionOption.analysisScore]);

  const value = useMemo(() => weather, [weather]);

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  const context = useContext(WeatherContext);

  if (!context) {
    throw new Error("useWeather must be used within WeatherProvider");
  }

  return context;
}
