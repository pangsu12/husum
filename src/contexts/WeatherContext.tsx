import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { fetchCurrentWeather } from "../services/weatherApi";
import { fetchHeatAlertStatus, HeatAlertStatus } from "../services/weatherAlertApi";

export type WeatherState = {
  temperature: number;
  feelsLikeTemperature: number;
  humidity: number;
  condition: string;
  heatRiskLevel: "낮음" | "보통" | "높음" | "매우 높음";
  heatAlertStatus: HeatAlertStatus;
  source: "default" | "api";
};

const defaultWeatherState: WeatherState = {
  temperature: 34.2,
  feelsLikeTemperature: 37.6,
  humidity: 68,
  condition: "맑음",
  heatRiskLevel: "높음",
  heatAlertStatus: "none",
  source: "default"
};

const WeatherContext = createContext<WeatherState | undefined>(undefined);

function getHeatRiskLevel(feelsLikeTemperature: number): WeatherState["heatRiskLevel"] {
  if (feelsLikeTemperature >= 38) return "매우 높음";
  if (feelsLikeTemperature >= 35) return "높음";
  if (feelsLikeTemperature >= 31) return "보통";
  return "낮음";
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherState>(defaultWeatherState);

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchCurrentWeather(), fetchHeatAlertStatus()]).then(([currentWeather, alertStatus]) => {
      if (!mounted) return;

      setWeather((current) => {
        const next: WeatherState = {
          ...current,
          ...(currentWeather
            ? {
                temperature: currentWeather.temperature,
                feelsLikeTemperature: currentWeather.feelsLikeTemperature,
                humidity: currentWeather.humidity,
                condition: currentWeather.condition,
                heatRiskLevel: getHeatRiskLevel(currentWeather.feelsLikeTemperature),
                source: "api" as const
              }
            : {}),
          ...(alertStatus
            ? {
                heatAlertStatus: alertStatus.heatAlertStatus,
                heatRiskLevel: alertStatus.heatRiskLevel ?? current.heatRiskLevel,
                source: "api" as const
              }
            : {})
        };

        return next;
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

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
