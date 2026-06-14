import { preferenceTags } from "../contexts/PreferenceContext";
import { crowdLevelLabels, facilityStatusLabels } from "../data/mockShelters";
import { Shelter, UserPreferences } from "../types/shelter";
import { getShelterOpenStatus } from "./shelterStatus";

export type RecommendationOrigin = {
  latitude: number;
  longitude: number;
};

const crowdScore = {
  low: 18,
  medium: 11,
  high: 4
};

const facilityScore = {
  good: 20,
  weak: 10,
  none: 0
};

function hasPreference(preferences: UserPreferences, tag: string) {
  return preferences.tags.includes(tag);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(origin: RecommendationOrigin, destination: RecommendationOrigin) {
  const earthRadius = 6371000;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const startLatitude = toRadians(origin.latitude);
  const endLatitude = toRadians(destination.latitude);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

export function getShelterWithOriginDistance(shelter: Shelter, origin?: RecommendationOrigin): Shelter {
  if (!origin) return shelter;

  const distanceMeters = getDistanceMeters(origin, {
    latitude: shelter.latitude,
    longitude: shelter.longitude
  });

  return {
    ...shelter,
    distanceMeters,
    walkMinutes: Math.max(3, Math.round(distanceMeters / 75))
  };
}

export function calculateShelterScore(
  shelter: Shelter,
  preferences: UserPreferences = { tags: [] },
  origin?: RecommendationOrigin
) {
  const target = getShelterWithOriginDistance(shelter, origin);
  const openStatus = getShelterOpenStatus(target);
  let distanceScore = Math.max(0, Math.round(28 - target.distanceMeters / 35));
  let openScore = openStatus.isOpen ? 20 : openStatus.phase === "before" ? 5 : 0;
  let coolingScore = facilityScore[target.coolingStatus];
  let crowdLevelScore = crowdScore[target.crowdLevel];
  let accessibilityScore = target.wheelchairAccessible ? 10 : 3;
  let waterScore = target.hasWater ? 6 : 0;
  let petScore = target.petAllowed ? 4 : 0;
  const reportScore = Math.round(target.positiveReportRate * 10);

  if (preferences.routePreference === "shortest") distanceScore += target.distanceMeters <= 500 ? 5 : 0;
  if (preferences.routePreference === "accessible") accessibilityScore += target.wheelchairAccessible ? 5 : 0;
  if (preferences.routePreference === "shade") coolingScore += target.coolingStatus === "good" ? 3 : 0;

  if (hasPreference(preferences, preferenceTags.mobility) || hasPreference(preferences, preferenceTags.disabled)) {
    distanceScore += target.distanceMeters <= 500 ? 7 : 0;
    accessibilityScore += target.wheelchairAccessible ? 10 : -4;
  }

  if (hasPreference(preferences, preferenceTags.infant)) {
    waterScore += target.hasWater ? 5 : 0;
    coolingScore += target.coolingStatus === "good" ? 5 : 0;
    crowdLevelScore += target.crowdLevel === "low" ? 5 : 0;
  }

  if (hasPreference(preferences, preferenceTags.senior) || hasPreference(preferences, preferenceTags.pregnant)) {
    distanceScore += target.distanceMeters <= 400 ? 7 : 0;
    openScore += openStatus.isOpen ? 5 : 0;
    accessibilityScore += target.wheelchairAccessible ? 5 : 0;
  }

  if (hasPreference(preferences, preferenceTags.outdoorWorker)) {
    distanceScore += target.distanceMeters <= 600 ? 6 : 0;
    coolingScore += target.coolingStatus === "good" ? 7 : 0;
  }

  if (hasPreference(preferences, preferenceTags.pet)) {
    petScore += target.petAllowed ? 14 : -8;
  }

  if (hasPreference(preferences, preferenceTags.transit)) {
    distanceScore += target.distanceMeters <= 700 ? 4 : 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      distanceScore +
        openScore +
        coolingScore +
        crowdLevelScore +
        accessibilityScore +
        waterScore +
        petScore +
        reportScore
    )
  );
}

export function getShelterRecommendationReasons(
  shelter: Shelter,
  preferences: UserPreferences = { tags: [] },
  origin?: RecommendationOrigin
) {
  const target = getShelterWithOriginDistance(shelter, origin);
  const openStatus = getShelterOpenStatus(target);
  const reasons: string[] = [];

  if (target.distanceMeters <= 300) reasons.push("출발지에서 가까움");
  reasons.push(openStatus.isOpen ? "운영시간 확인" : openStatus.label);
  if (target.coolingStatus === "good") reasons.push("냉방 상태 양호");
  if (typeof target.airConditionerCount === "number" && target.airConditionerCount > 0) reasons.push("냉방기 보유");
  if (typeof target.fanCount === "number" && target.fanCount > 0) reasons.push("선풍기 보유");
  if (target.crowdLevel === "low") reasons.push("혼잡도 낮음");
  if (target.hasWater) reasons.push("물 제공");
  if (target.wheelchairAccessible) reasons.push("보행 접근성 좋음");
  if (target.petAllowed) reasons.push("반려동물 동반 가능");

  if (
    (hasPreference(preferences, preferenceTags.mobility) || hasPreference(preferences, preferenceTags.disabled)) &&
    target.wheelchairAccessible
  ) {
    reasons.unshift("사용자 맞춤 조건 반영");
  }
  if (hasPreference(preferences, preferenceTags.infant) && target.hasWater && target.crowdLevel === "low") {
    reasons.unshift("영유아 동반 적합");
  }
  if (hasPreference(preferences, preferenceTags.senior) && target.distanceMeters <= 400) {
    reasons.unshift("어르신 이동 부담 낮음");
  }
  if (hasPreference(preferences, preferenceTags.pregnant) && target.distanceMeters <= 400) {
    reasons.unshift("임산부 이동 부담 낮음");
  }
  if (hasPreference(preferences, preferenceTags.outdoorWorker) && target.coolingStatus === "good") {
    reasons.unshift("야외근로자 휴식 적합");
  }
  if (hasPreference(preferences, preferenceTags.pet) && target.petAllowed) {
    reasons.unshift("반려동물 동반 조건 반영");
  }

  return Array.from(new Set(reasons)).slice(0, 6);
}

export function getRecommendedShelters(
  shelters: Shelter[],
  preferences: UserPreferences = { tags: [] },
  origin?: RecommendationOrigin
) {
  return shelters
    .map((shelter) => getShelterWithOriginDistance(shelter, origin))
    .sort((a, b) => calculateShelterScore(b, preferences) - calculateShelterScore(a, preferences));
}

export function getReadableShelterStatus(shelter: Shelter) {
  return {
    crowd: crowdLevelLabels[shelter.crowdLevel],
    cooling: facilityStatusLabels[shelter.coolingStatus]
  };
}
