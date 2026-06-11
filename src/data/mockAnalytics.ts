export type HourlyWeatherPoint = {
  hour: string;
  temperature: number;
  humidity: number;
  feelsLike: number;
};

export type AirQualityData = {
  pm25: number;
  ozone: "좋음" | "보통" | "나쁨";
  airQualityIndex: "좋음" | "보통" | "나쁨";
};

export const hourlyWeatherData: HourlyWeatherPoint[] = [
  { hour: "09시", temperature: 29.8, humidity: 64, feelsLike: 32.1 },
  { hour: "12시", temperature: 32.7, humidity: 68, feelsLike: 35.9 },
  { hour: "15시", temperature: 34.2, humidity: 72, feelsLike: 37.6 },
  { hour: "18시", temperature: 31.6, humidity: 70, feelsLike: 34.1 },
  { hour: "21시", temperature: 28.4, humidity: 66, feelsLike: 30.2 }
];

export const airQualityData: AirQualityData = {
  pm25: 23,
  ozone: "보통",
  airQualityIndex: "보통"
};

export const citizenReportStats = {
  totalReports: 18,
  openReports: 14,
  crowdedReports: 5,
  goodCoolingReports: 12,
  accessibilityIssueReports: 2,
  riskyRouteReports: 3
};

export const userRiskWeights = [
  { userType: "보행이 불편한 사용자", weight: 10, reason: "접근성과 이동 거리 가중치 증가" },
  { userType: "어르신", weight: 8, reason: "운영 여부와 가까운 거리 가중치 증가" },
  { userType: "영유아 동반", weight: 7, reason: "냉방 상태와 물 제공 여부 가중치 증가" },
  { userType: "야외근로자", weight: 9, reason: "현재 위치와 가까운 쉼터 우선" }
];

export const districtRiskComparison = [
  { district: "성북구", score: 87 },
  { district: "강북구", score: 81 },
  { district: "동대문구", score: 76 },
  { district: "종로구", score: 72 }
];
