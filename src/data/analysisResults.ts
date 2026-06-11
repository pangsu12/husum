export type TrendPoint = {
  label: string;
  value: number;
};

export type RegionRiskScore = {
  region: string;
  weatherRiskScore: number;
  heatwaveScore: number;
  heatIllnessScore: number;
  elderlyScore: number;
  integratedHeatRiskScore: number;
};

export type RecommendationBreakdownItem = {
  label: string;
  score: number;
  maxScore: number;
  description: string;
};

export const analysisResults = {
  provenanceLabel: "공공 데이터 분석 결과",
  provenanceDescription:
    "2020~2025년 여름철 CSV/XLSX 데이터를 분석해 지역별 폭염 위험도와 추천 기준에 반영했습니다.",
  analysisPeriod: "2020~2025년 여름철",
  analysisRegions: ["서울", "대전", "대구", "부산", "광주"],
  averageMaxTemperature: 29.54,
  averageHumidity: 76.47,
  daysMaxTemp33OrMore: 706,
  totalHeatIllnessCases: 2516,
  heatIllnessPeakDate: "2025-07-08",
  heatIllnessPeakDateCases: 39,
  temperatureHeatIllnessCorrelation: 0.4057,
  heatwaveTopRegion: "대구",
  heatwaveTopRegionDays: 233,
  elderlyRateTopRegion: "부산",
  elderlyRateTopValue: 25.3,
  integratedHeatRiskTopRegion: "대구",
  integratedHeatRiskTopScore: 71.1,
  regionRiskScores: [
    {
      region: "대구",
      weatherRiskScore: 100,
      heatwaveScore: 100,
      heatIllnessScore: 13.93,
      elderlyScore: 50.77,
      integratedHeatRiskScore: 71.1
    },
    {
      region: "서울",
      weatherRiskScore: 34.09,
      heatwaveScore: 32.02,
      heatIllnessScore: 100,
      elderlyScore: 24.62,
      integratedHeatRiskScore: 48.63
    },
    {
      region: "대전",
      weatherRiskScore: 66.2,
      heatwaveScore: 63.48,
      heatIllnessScore: 0,
      elderlyScore: 4.62,
      integratedHeatRiskScore: 39.73
    },
    {
      region: "광주",
      weatherRiskScore: 53.28,
      heatwaveScore: 50,
      heatIllnessScore: 7.56,
      elderlyScore: 0,
      integratedHeatRiskScore: 33.04
    },
    {
      region: "부산",
      weatherRiskScore: 0,
      heatwaveScore: 0,
      heatIllnessScore: 36.84,
      elderlyScore: 100,
      integratedHeatRiskScore: 24.21
    }
  ] satisfies RegionRiskScore[],
  shelterReferenceSummary: {
    totalShelters: 100,
    totalCapacity: 2773,
    totalAirConditioners: 211,
    totalFans: 209
  },
  limitations: [
    "어린이 1인 가구 데이터는 현재 전국 단위라 지역별 점수에는 직접 반영하지 않았습니다.",
    "2026년 데이터는 진행 중인 기간이라 메인 분석에서는 제외했습니다.",
    "실제 서비스에서는 최신 기상 정보와 현장 제보를 함께 반영해 추천 정확도를 높입니다."
  ],
  recommendationBreakdown: [
    {
      label: "기상 위험",
      score: 35,
      maxScore: 35,
      description: "최고기온과 고온 노출 일수를 반영합니다."
    },
    {
      label: "폭염일수",
      score: 25,
      maxScore: 25,
      description: "지역별 폭염 노출 정도를 반영합니다."
    },
    {
      label: "온열질환",
      score: 25,
      maxScore: 25,
      description: "지역별 온열질환 발생 규모를 반영합니다."
    },
    {
      label: "취약계층",
      score: 15,
      maxScore: 15,
      description: "지역별 고령인구 비율을 대표 지표로 사용합니다."
    }
  ] satisfies RecommendationBreakdownItem[],
  appConnections: [
    { from: "위험도 분석", to: "홈 화면 위험도 안내" },
    { from: "지역별 취약도", to: "추천 근거의 지역 순위" },
    { from: "주변 쉼터 정보", to: "지도 마커와 쉼터 카드" },
    { from: "쉼터 상태 제보", to: "추천 점수 보정" },
    { from: "맞춤 설정", to: "사용자 조건별 가중치 변경" }
  ]
};
