import { AirQualityData, HourlyWeatherPoint } from "../data/mockAnalytics";
import { Shelter } from "../types/shelter";
import { crowdLevelLabels, facilityStatusLabels } from "../data/mockShelters";

export type ScorePart = {
  label: string;
  score: number;
  description: string;
};

export function calculateAirQualityRisk(airQuality: AirQualityData) {
  const pm25Score = airQuality.pm25 >= 35 ? 14 : airQuality.pm25 >= 20 ? 9 : 4;
  const ozoneScore = airQuality.ozone === "나쁨" ? 12 : airQuality.ozone === "보통" ? 7 : 3;
  const indexScore =
    airQuality.airQualityIndex === "나쁨" ? 10 : airQuality.airQualityIndex === "보통" ? 6 : 2;

  return {
    total: pm25Score + ozoneScore + indexScore,
    parts: [
      { label: "초미세먼지 점수", score: pm25Score, description: `PM2.5 ${airQuality.pm25}` },
      { label: "오존 점수", score: ozoneScore, description: `오존 ${airQuality.ozone}` },
      {
        label: "통합대기 점수",
        score: indexScore,
        description: `통합대기환경 ${airQuality.airQualityIndex}`
      }
    ] satisfies ScorePart[]
  };
}

export function calculateClimateRiskScore(
  weather: HourlyWeatherPoint,
  airQuality: AirQualityData,
  vulnerableUserWeight: number
) {
  const temperatureScore = Math.min(22, Math.max(0, Math.round((weather.temperature - 24) * 2.2)));
  const feelsLikeScore = Math.min(26, Math.max(0, Math.round((weather.feelsLike - 27) * 2.5)));
  const humidityScore = Math.min(12, Math.max(0, Math.round((weather.humidity - 50) * 0.55)));
  const airQualityScore = Math.min(18, calculateAirQualityRisk(airQuality).total);
  const finalScore = Math.min(
    100,
    temperatureScore + feelsLikeScore + humidityScore + airQualityScore + vulnerableUserWeight
  );

  return {
    finalScore,
    parts: [
      { label: "기온 점수", score: temperatureScore, description: `${weather.temperature.toFixed(1)}도` },
      {
        label: "체감온도 점수",
        score: feelsLikeScore,
        description: `${weather.feelsLike.toFixed(1)}도`
      },
      { label: "습도 점수", score: humidityScore, description: `${weather.humidity}%` },
      {
        label: "대기질 점수",
        score: airQualityScore,
        description: `PM2.5 ${airQuality.pm25}, 오존 ${airQuality.ozone}`
      },
      {
        label: "취약 사용자 가중치",
        score: vulnerableUserWeight,
        description: "어르신, 보행 불편 조건 반영"
      }
    ] satisfies ScorePart[]
  };
}

export function calculateReportReliability(shelter: Shelter, sessionReportCount = 0) {
  const reportVolume = shelter.reportCount + sessionReportCount;
  const positiveScore = Math.round(shelter.positiveReportRate * 10);
  const volumeBonus = Math.min(5, reportVolume);

  return positiveScore + volumeBonus;
}

export function calculateShelterRecommendationScore(shelter: Shelter, sessionReportCount = 0) {
  const distanceScore = Math.max(0, Math.round(28 - shelter.distanceMeters / 35));
  const openScore = shelter.isOpen ? 20 : 0;
  const comfortScore = shelter.coolingStatus === "good" ? 20 : shelter.coolingStatus === "weak" ? 10 : 0;
  const crowdScore = shelter.crowdLevel === "low" ? 18 : shelter.crowdLevel === "medium" ? 11 : 4;
  const accessibilityScore = shelter.wheelchairAccessible ? 10 : 3;
  const reportReliabilityScore = calculateReportReliability(shelter, sessionReportCount);
  const finalScore = Math.min(
    100,
    distanceScore + openScore + comfortScore + crowdScore + accessibilityScore + reportReliabilityScore
  );

  return {
    finalScore,
    parts: [
      { label: "거리 점수", score: distanceScore, description: `${shelter.distanceMeters}m` },
      {
        label: "운영 여부 점수",
        score: openScore,
        description: shelter.isOpen ? "현재 운영 중" : "운영 종료"
      },
      {
        label: "냉방 상태 점수",
        score: comfortScore,
        description: `냉방 ${facilityStatusLabels[shelter.coolingStatus]}`
      },
      { label: "혼잡도 점수", score: crowdScore, description: crowdLevelLabels[shelter.crowdLevel] },
      {
        label: "접근성 점수",
        score: accessibilityScore,
        description: shelter.wheelchairAccessible ? "휠체어 접근 가능" : "접근성 제한"
      },
      {
        label: "시민 제보 신뢰도 점수",
        score: reportReliabilityScore,
        description: `기본 ${shelter.reportCount}건 + 세션 ${sessionReportCount}건`
      }
    ] satisfies ScorePart[]
  };
}

export function getRiskLevelLabel(score: number) {
  if (score >= 85) return "매우 높음";
  if (score >= 70) return "높음";
  if (score >= 50) return "보통";
  return "낮음";
}

export function getRiskBarColor(score: number) {
  if (score >= 85) return "#ef4444";
  if (score >= 70) return "#f97316";
  return "#2563eb";
}

export function getRecommendationReason(shelter: Shelter) {
  const reasons: string[] = [];

  if (shelter.distanceMeters <= 300) reasons.push("현재 위치에서 매우 가까운 쉼터입니다.");
  if (shelter.isOpen) reasons.push("운영 중이라 바로 이용할 수 있습니다.");
  if (shelter.coolingStatus === "good") reasons.push("냉방 상태가 좋아 폭염 상황에 적합합니다.");
  if (shelter.wheelchairAccessible) reasons.push("휠체어 접근이 가능해 이동 약자에게 적합합니다.");
  if (shelter.positiveReportRate >= 0.8) reasons.push("최근 시민 제보 평가가 좋습니다.");

  return reasons.slice(0, 3).join(" ");
}
