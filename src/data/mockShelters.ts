import { CrowdLevel, FacilityStatus, Shelter, ShelterType } from "../types/shelter";

export const RECOMMENDED_SHELTER_NAME = "성북종합사회복지관 무더위쉼터";
export const PUBLIC_DATA_EXAMPLE_NAME = "보문동 주민쉼터";

type ShelterSeed = {
  id: string;
  name: string;
  type?: ShelterType;
  address: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  region: Shelter["region"];
  crowdLevel?: CrowdLevel;
  coolingStatus?: FacilityStatus;
  hasWater?: boolean;
  wheelchairAccessible?: boolean;
  petAllowed?: boolean;
  positiveReportRate?: number;
};

function makeShelter(seed: ShelterSeed): Shelter {
  return {
    id: seed.id,
    name: seed.name,
    type: seed.type ?? "public",
    address: seed.address,
    distanceMeters: seed.distanceMeters,
    walkMinutes: Math.max(3, Math.round(seed.distanceMeters / 75)),
    operatingHours: "09:00~18:00",
    isOpen: true,
    crowdLevel: seed.crowdLevel ?? "medium",
    coolingStatus: seed.coolingStatus ?? "good",
    heatingStatus: "weak",
    hasWater: seed.hasWater ?? true,
    wheelchairAccessible: seed.wheelchairAccessible ?? true,
    petAllowed: seed.petAllowed ?? false,
    latitude: seed.latitude,
    longitude: seed.longitude,
    reportCount: 3,
    positiveReportRate: seed.positiveReportRate ?? 0.78,
    region: seed.region
  };
}

export const mockShelters: Shelter[] = [
  makeShelter({
    id: "seoul-shelter-1",
    name: RECOMMENDED_SHELTER_NAME,
    type: "cooling",
    address: "서울 성북구 종암로 129",
    distanceMeters: 220,
    latitude: 37.6021,
    longitude: 127.0332,
    region: "seoul",
    crowdLevel: "low",
    positiveReportRate: 0.88
  }),
  makeShelter({
    id: "seoul-shelter-2",
    name: "길음1동 주민쉼터",
    address: "서울 성북구 길음로 92",
    distanceMeters: 480,
    latitude: 37.6087,
    longitude: 127.0241,
    region: "seoul"
  }),
  makeShelter({
    id: "seoul-shelter-3",
    name: "정릉 어르신문화센터 쉼터",
    type: "cooling",
    address: "서울 성북구 정릉로 242",
    distanceMeters: 760,
    latitude: 37.6112,
    longitude: 127.0107,
    region: "seoul",
    crowdLevel: "high",
    coolingStatus: "weak"
  }),
  makeShelter({
    id: "seoul-shelter-4",
    name: "보문동 주민센터 쉼터",
    address: "서울 성북구 보문로 168",
    distanceMeters: 940,
    latitude: 37.5829,
    longitude: 127.0196,
    region: "seoul",
    crowdLevel: "low"
  }),
  makeShelter({
    id: "seoul-shelter-5",
    name: "안암동 복지문화쉼터",
    address: "서울 성북구 고려대로 16",
    distanceMeters: 1120,
    latitude: 37.5867,
    longitude: 127.0292,
    region: "seoul",
    petAllowed: true
  }),
  makeShelter({
    id: "seoul-shelter-6",
    name: "월곡문화체육센터 쉼터",
    address: "서울 성북구 화랑로 13길 144",
    distanceMeters: 1380,
    latitude: 37.6046,
    longitude: 127.0418,
    region: "seoul",
    coolingStatus: "weak"
  }),
  makeShelter({
    id: "daejeon-shelter-1",
    name: "대전시청 무더위쉼터",
    type: "cooling",
    address: "대전 서구 둔산로 100",
    distanceMeters: 260,
    latitude: 36.3504,
    longitude: 127.3845,
    region: "daejeon",
    crowdLevel: "low",
    positiveReportRate: 0.84
  }),
  makeShelter({
    id: "daejeon-shelter-2",
    name: "서구 갈마도서관 쉼터",
    address: "대전 서구 신갈마로 127",
    distanceMeters: 540,
    latitude: 36.3482,
    longitude: 127.3688,
    region: "daejeon"
  }),
  makeShelter({
    id: "daejeon-shelter-3",
    name: "대전역 시민쉼터",
    address: "대전 동구 중앙로 215",
    distanceMeters: 690,
    latitude: 36.3327,
    longitude: 127.4346,
    region: "daejeon",
    crowdLevel: "high",
    coolingStatus: "weak"
  }),
  makeShelter({
    id: "daejeon-shelter-4",
    name: "유성온천역 쉼터",
    address: "대전 유성구 대학로 7",
    distanceMeters: 980,
    latitude: 36.3537,
    longitude: 127.3413,
    region: "daejeon"
  }),
  makeShelter({
    id: "daejeon-shelter-5",
    name: "중구 문화복지쉼터",
    address: "대전 중구 중앙로 101",
    distanceMeters: 1180,
    latitude: 36.325,
    longitude: 127.4211,
    region: "daejeon",
    crowdLevel: "low"
  }),
  makeShelter({
    id: "daejeon-shelter-6",
    name: "도안동 주민쉼터",
    address: "대전 서구 도안동로 77",
    distanceMeters: 1450,
    latitude: 36.3335,
    longitude: 127.3425,
    region: "daejeon",
    petAllowed: true
  }),
  makeShelter({
    id: "daegu-shelter-1",
    name: "대구 중구청 무더위쉼터",
    type: "cooling",
    address: "대구 중구 국채보상로 139길 1",
    distanceMeters: 240,
    latitude: 35.8693,
    longitude: 128.6062,
    region: "daegu",
    crowdLevel: "low",
    positiveReportRate: 0.9
  }),
  makeShelter({
    id: "daegu-shelter-2",
    name: "동성로 시민안심쉼터",
    address: "대구 중구 동성로 31",
    distanceMeters: 430,
    latitude: 35.8688,
    longitude: 128.5961,
    region: "daegu"
  }),
  makeShelter({
    id: "daegu-shelter-3",
    name: "수성구 범어공원 쉼터",
    type: "cooling",
    address: "대구 수성구 범어천로 355",
    distanceMeters: 720,
    latitude: 35.8591,
    longitude: 128.6278,
    region: "daegu",
    crowdLevel: "low",
    coolingStatus: "weak",
    hasWater: false,
    wheelchairAccessible: false,
    petAllowed: true
  }),
  makeShelter({
    id: "daegu-shelter-4",
    name: "반월당역 쉼터",
    address: "대구 중구 달구벌대로 2100",
    distanceMeters: 880,
    latitude: 35.8648,
    longitude: 128.5934,
    region: "daegu"
  }),
  makeShelter({
    id: "daegu-shelter-5",
    name: "칠성동 행정복지센터 쉼터",
    address: "대구 북구 칠성남로 206",
    distanceMeters: 1250,
    latitude: 35.8823,
    longitude: 128.5986,
    region: "daegu",
    crowdLevel: "low"
  }),
  makeShelter({
    id: "daegu-shelter-6",
    name: "두류공원 무더위쉼터",
    address: "대구 달서구 공원순환로 36",
    distanceMeters: 1680,
    latitude: 35.8503,
    longitude: 128.5602,
    region: "daegu",
    petAllowed: true
  }),
  makeShelter({
    id: "busan-shelter-1",
    name: "부산시민공원 무더위쉼터",
    type: "cooling",
    address: "부산 부산진구 시민공원로 73",
    distanceMeters: 310,
    latitude: 35.1686,
    longitude: 129.0556,
    region: "busan",
    crowdLevel: "low",
    positiveReportRate: 0.81
  }),
  makeShelter({
    id: "busan-shelter-2",
    name: "부산역 시민쉼터",
    address: "부산 동구 중앙대로 206",
    distanceMeters: 580,
    latitude: 35.1151,
    longitude: 129.0422,
    region: "busan",
    crowdLevel: "high"
  }),
  makeShelter({
    id: "busan-shelter-3",
    name: "연산동 주민쉼터",
    address: "부산 연제구 연제로 2",
    distanceMeters: 620,
    latitude: 35.1765,
    longitude: 129.0792,
    region: "busan",
    coolingStatus: "weak"
  }),
  makeShelter({
    id: "busan-shelter-4",
    name: "서면 문화쉼터",
    address: "부산 부산진구 중앙대로 730",
    distanceMeters: 790,
    latitude: 35.1579,
    longitude: 129.0592,
    region: "busan",
    crowdLevel: "low"
  }),
  makeShelter({
    id: "busan-shelter-5",
    name: "해운대 구민쉼터",
    address: "부산 해운대구 중동2로 11",
    distanceMeters: 1360,
    latitude: 35.163,
    longitude: 129.1635,
    region: "busan"
  }),
  makeShelter({
    id: "busan-shelter-6",
    name: "남포동 안심쉼터",
    address: "부산 중구 구덕로 12",
    distanceMeters: 1580,
    latitude: 35.0985,
    longitude: 129.0342,
    region: "busan",
    petAllowed: true
  }),
  makeShelter({
    id: "gwangju-shelter-1",
    name: "광주시청 무더위쉼터",
    type: "cooling",
    address: "광주 서구 내방로 111",
    distanceMeters: 230,
    latitude: 35.1595,
    longitude: 126.8526,
    region: "gwangju",
    crowdLevel: "low",
    positiveReportRate: 0.86
  }),
  makeShelter({
    id: "gwangju-shelter-2",
    name: "충장로 시민쉼터",
    address: "광주 동구 충장로 94",
    distanceMeters: 510,
    latitude: 35.1484,
    longitude: 126.9144,
    region: "gwangju"
  }),
  makeShelter({
    id: "gwangju-shelter-3",
    name: "광주송정역 쉼터",
    address: "광주 광산구 상무대로 201",
    distanceMeters: 760,
    latitude: 35.1378,
    longitude: 126.7936,
    region: "gwangju",
    crowdLevel: "high",
    coolingStatus: "weak"
  }),
  makeShelter({
    id: "gwangju-shelter-4",
    name: "상무지구 공공쉼터",
    address: "광주 서구 상무중앙로 7",
    distanceMeters: 830,
    latitude: 35.1521,
    longitude: 126.8491,
    region: "gwangju",
    crowdLevel: "low"
  }),
  makeShelter({
    id: "gwangju-shelter-5",
    name: "양림동 복지쉼터",
    address: "광주 남구 양림로 70",
    distanceMeters: 1090,
    latitude: 35.1406,
    longitude: 126.9115,
    region: "gwangju"
  }),
  makeShelter({
    id: "gwangju-shelter-6",
    name: "첨단지구 주민쉼터",
    address: "광주 광산구 첨단중앙로 170",
    distanceMeters: 1510,
    latitude: 35.2141,
    longitude: 126.8436,
    region: "gwangju",
    petAllowed: true
  })
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
  high: "혼잡"
};

export const facilityStatusLabels: Record<FacilityStatus, string> = {
  good: "좋음",
  weak: "보통",
  none: "확인 필요"
};
