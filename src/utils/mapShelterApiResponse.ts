import { Shelter } from "../types/shelter";

type ApiRecord = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function pick(record: ApiRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    const parsed = text(value);
    if (parsed) return parsed;
  }
  return fallback;
}

function pickNumber(record: ApiRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const parsed = number(record[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function inferRegion(address: string, latitude: number, longitude: number): Shelter["region"] {
  if (address.includes("서울")) return "seoul";
  if (address.includes("대전")) return "daejeon";
  if (address.includes("대구")) return "daegu";
  if (address.includes("부산")) return "busan";
  if (address.includes("광주")) return "gwangju";

  if (latitude > 36.9 && latitude < 38 && longitude > 126.5 && longitude < 128) return "seoul";
  if (latitude > 36 && latitude < 36.8 && longitude > 127 && longitude < 128) return "daejeon";
  if (latitude > 35.6 && latitude < 36.1 && longitude > 128.3 && longitude < 129) return "daegu";
  if (latitude > 35 && latitude < 35.4 && longitude > 128.8 && longitude < 129.3) return "busan";
  if (latitude > 35 && latitude < 35.4 && longitude > 126.6 && longitude < 127.1) return "gwangju";

  return undefined;
}

export function mapShelterApiRecord(record: ApiRecord, index: number): Shelter {
  const name = pick(record, ["RSTR_NM", "SHELTER_NM", "FCLTY_NM", "facilNm", "name"], `쉼터 ${index + 1}`);
  const address = pick(record, ["DTL_ADRES", "RN_DTL_ADRES", "ADDR", "address", "roadAddr"], "주소 확인 필요");
  const latitude = pickNumber(record, ["LA", "LAT", "latitude", "lat"], 37.6025 + index * 0.001);
  const longitude = pickNumber(record, ["LO", "LON", "longitude", "lng"], 127.0329 + index * 0.001);
  const capacity = pickNumber(record, ["USE_PSBL_NMPR", "capacity"], 0);

  return {
    id: `api-shelter-${index}-${name}`,
    name,
    type: "public",
    address,
    distanceMeters: 250 + index * 80,
    walkMinutes: Math.max(3, Math.round((250 + index * 80) / 75)),
    operatingHours: pick(record, ["WKDAY_OPER_BEGIN_TIME", "OPER_TIME", "operatingHours"], "확인 필요"),
    isOpen: true,
    crowdLevel: "medium",
    coolingStatus: "weak",
    heatingStatus: "none",
    hasWater: false,
    wheelchairAccessible: false,
    petAllowed: false,
    latitude,
    longitude,
    reportCount: 0,
    positiveReportRate: capacity > 0 ? 0.7 : 0.6,
    region: inferRegion(address, latitude, longitude),
    source: "api"
  };
}

export function mapShelterApiResponse(payload: unknown): Shelter[] {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as ApiRecord)?.body)
      ? ((payload as ApiRecord).body as unknown[])
      : Array.isArray((payload as ApiRecord)?.data)
        ? ((payload as ApiRecord).data as unknown[])
        : Array.isArray((payload as ApiRecord)?.items)
          ? ((payload as ApiRecord).items as unknown[])
          : Array.isArray((((payload as ApiRecord)?.response as ApiRecord | undefined)?.body as ApiRecord | undefined)?.items)
            ? ((((payload as ApiRecord).response as ApiRecord).body as ApiRecord).items as unknown[])
            : Array.isArray(((payload as ApiRecord)?.response as ApiRecord | undefined)?.body)
              ? (((payload as ApiRecord).response as ApiRecord).body as unknown[])
              : [];

  return records
    .filter((item): item is ApiRecord => item !== null && typeof item === "object")
    .map(mapShelterApiRecord)
    .filter((shelter) => shelter.name && shelter.latitude && shelter.longitude);
}
