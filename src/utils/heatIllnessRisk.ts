import { HeatAlertStatus } from "../services/weatherAlertApi";

export type HeatRiskLevel = "낮음" | "보통" | "높음" | "매우 높음";

export type HeatIllnessRiskInput = {
  feelsLikeTemperature: number;
  humidity: number;
  heatAlertStatus: HeatAlertStatus;
  vulnerabilityScore?: number;
};

export type HeatIllnessRisk = {
  level: HeatRiskLevel;
  message: string;
};

export function calculateHeatIllnessRisk(input: HeatIllnessRiskInput): HeatIllnessRisk {
  const vulnerabilityScore = input.vulnerabilityScore ?? 0;

  if (input.feelsLikeTemperature >= 40 || input.heatAlertStatus === "warning") {
    return {
      level: "매우 높음",
      message: "무리한 야외활동을 줄이고 가까운 쉼터 이용을 권장합니다."
    };
  }

  if (input.feelsLikeTemperature >= 37 || input.heatAlertStatus === "advisory") {
    return {
      level: "높음",
      message: "체감온도와 지역 취약도를 함께 반영한 결과입니다."
    };
  }

  if (input.feelsLikeTemperature >= 33 || vulnerabilityScore >= 50 || input.humidity >= 75) {
    return {
      level: "보통",
      message: "체감온도와 지역 취약도를 함께 반영한 결과입니다."
    };
  }

  return {
    level: "낮음",
    message: "현재 기준 위험은 낮지만 장시간 야외활동은 주의가 필요합니다."
  };
}
