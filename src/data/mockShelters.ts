import { CrowdLevel, FacilityStatus, Shelter, ShelterType } from "../types/shelter";

export const RECOMMENDED_SHELTER_NAME = "성북종합사회복지관 무더위쉼터";
export const PUBLIC_DATA_EXAMPLE_NAME = "봉담도서관";

export const mockShelters: Shelter[] = [
  {
    id: "shelter-1",
    name: RECOMMENDED_SHELTER_NAME,
    type: "cooling",
    address: "서울 성북구 종암로 129",
    distanceMeters: 220,
    walkMinutes: 3,
    operatingHours: "09:00~18:00",
    isOpen: true,
    crowdLevel: "low",
    coolingStatus: "good",
    heatingStatus: "weak",
    hasWater: true,
    wheelchairAccessible: true,
    petAllowed: false,
    latitude: 37.6021,
    longitude: 127.0332,
    reportCount: 8,
    positiveReportRate: 0.88
  },
  {
    id: "shelter-2",
    name: "길음1동 주민센터 기후쉼터",
    type: "public",
    address: "서울 성북구 길음로 92",
    distanceMeters: 480,
    walkMinutes: 7,
    operatingHours: "09:00~18:00",
    isOpen: true,
    crowdLevel: "medium",
    coolingStatus: "good",
    heatingStatus: "good",
    hasWater: true,
    wheelchairAccessible: true,
    petAllowed: false,
    latitude: 37.6087,
    longitude: 127.0241,
    reportCount: 5,
    positiveReportRate: 0.8
  },
  {
    id: "shelter-3",
    name: "정릉 어르신문화센터 한파쉼터",
    type: "heating",
    address: "서울 성북구 정릉로 242",
    distanceMeters: 760,
    walkMinutes: 11,
    operatingHours: "08:30~19:00",
    isOpen: true,
    crowdLevel: "high",
    coolingStatus: "weak",
    heatingStatus: "good",
    hasWater: true,
    wheelchairAccessible: true,
    petAllowed: false,
    latitude: 37.6112,
    longitude: 127.0107,
    reportCount: 3,
    positiveReportRate: 0.67
  },
  {
    id: "shelter-4",
    name: "성북천 반려동물 동행 카페쉼터",
    type: "private",
    address: "서울 성북구 동소문로 45",
    distanceMeters: 620,
    walkMinutes: 9,
    operatingHours: "11:00~20:00",
    isOpen: true,
    crowdLevel: "low",
    coolingStatus: "weak",
    heatingStatus: "weak",
    hasWater: false,
    wheelchairAccessible: false,
    petAllowed: true,
    latitude: 37.5898,
    longitude: 127.0176,
    reportCount: 2,
    positiveReportRate: 0.5
  }
];

export const shelterTypeLabels: Record<ShelterType, string> = {
  cooling: "무더위쉼터",
  heating: "한파쉼터",
  public: "공공시설",
  private: "민간쉼터"
};

export const crowdLevelLabels: Record<CrowdLevel, string> = {
  low: "여유 있음",
  medium: "보통",
  high: "혼잡함"
};

export const facilityStatusLabels: Record<FacilityStatus, string> = {
  good: "좋음",
  weak: "약함",
  none: "없음"
};
