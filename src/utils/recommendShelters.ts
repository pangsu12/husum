import { preferenceTags } from "../contexts/PreferenceContext";
import { crowdLevelLabels, facilityStatusLabels } from "../data/mockShelters";
import { Shelter, UserPreferences } from "../types/shelter";

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

export function calculateShelterScore(shelter: Shelter, preferences: UserPreferences = { tags: [] }) {
  let distanceScore = Math.max(0, Math.round(28 - shelter.distanceMeters / 35));
  let openScore = shelter.isOpen ? 20 : 0;
  let coolingScore = facilityScore[shelter.coolingStatus];
  let crowdLevelScore = crowdScore[shelter.crowdLevel];
  let accessibilityScore = shelter.wheelchairAccessible ? 10 : 3;
  let waterScore = shelter.hasWater ? 6 : 0;
  let petScore = shelter.petAllowed ? 4 : 0;
  const reportScore = Math.round(shelter.positiveReportRate * 10);

  if (preferences.routePreference === "shortest") distanceScore += shelter.distanceMeters <= 500 ? 5 : 0;
  if (preferences.routePreference === "accessible") accessibilityScore += shelter.wheelchairAccessible ? 5 : 0;
  if (preferences.routePreference === "shade") coolingScore += shelter.coolingStatus === "good" ? 3 : 0;

  if (hasPreference(preferences, preferenceTags.mobility) || hasPreference(preferences, preferenceTags.disabled)) {
    distanceScore += shelter.distanceMeters <= 500 ? 7 : 0;
    accessibilityScore += shelter.wheelchairAccessible ? 10 : -4;
  }

  if (hasPreference(preferences, preferenceTags.infant)) {
    waterScore += shelter.hasWater ? 5 : 0;
    coolingScore += shelter.coolingStatus === "good" ? 5 : 0;
    crowdLevelScore += shelter.crowdLevel === "low" ? 5 : 0;
  }

  if (hasPreference(preferences, preferenceTags.senior) || hasPreference(preferences, preferenceTags.pregnant)) {
    distanceScore += shelter.distanceMeters <= 400 ? 7 : 0;
    openScore += shelter.isOpen ? 5 : 0;
    accessibilityScore += shelter.wheelchairAccessible ? 5 : 0;
  }

  if (hasPreference(preferences, preferenceTags.outdoorWorker)) {
    distanceScore += shelter.distanceMeters <= 600 ? 6 : 0;
    coolingScore += shelter.coolingStatus === "good" ? 7 : 0;
  }

  if (hasPreference(preferences, preferenceTags.pet)) {
    petScore += shelter.petAllowed ? 14 : -8;
  }

  if (hasPreference(preferences, preferenceTags.transit)) {
    distanceScore += shelter.distanceMeters <= 700 ? 4 : 0;
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
  preferences: UserPreferences = { tags: [] }
) {
  const reasons: string[] = [];

  if (shelter.distanceMeters <= 300) reasons.push("가까움");
  if (shelter.isOpen) reasons.push("운영 중");
  if (shelter.coolingStatus === "good") reasons.push("냉방 쾌적");
  if (shelter.crowdLevel === "low") reasons.push("혼잡도 낮음");
  if (shelter.hasWater) reasons.push("물 제공");
  if (shelter.wheelchairAccessible) reasons.push("휠체어 접근 가능");
  if (shelter.petAllowed) reasons.push("반려동물 동반 가능");

  if (
    (hasPreference(preferences, preferenceTags.mobility) || hasPreference(preferences, preferenceTags.disabled)) &&
    shelter.wheelchairAccessible
  ) {
    reasons.unshift("이동 조건 반영");
  }
  if (hasPreference(preferences, preferenceTags.infant) && shelter.hasWater && shelter.crowdLevel === "low") {
    reasons.unshift("영유아 동반 적합");
  }
  if (hasPreference(preferences, preferenceTags.senior) && shelter.distanceMeters <= 400) {
    reasons.unshift("어르신 이동 부담 낮음");
  }
  if (hasPreference(preferences, preferenceTags.pregnant) && shelter.distanceMeters <= 400) {
    reasons.unshift("임산부 이동 부담 낮음");
  }
  if (hasPreference(preferences, preferenceTags.outdoorWorker) && shelter.coolingStatus === "good") {
    reasons.unshift("야외근로자 휴식 적합");
  }
  if (hasPreference(preferences, preferenceTags.pet) && shelter.petAllowed) {
    reasons.unshift("반려동물 동반 조건 반영");
  }

  return Array.from(new Set(reasons)).slice(0, 6);
}

export function getRecommendedShelters(shelters: Shelter[], preferences: UserPreferences = { tags: [] }) {
  return [...shelters].sort(
    (a, b) => calculateShelterScore(b, preferences) - calculateShelterScore(a, preferences)
  );
}

export function getReadableShelterStatus(shelter: Shelter) {
  return {
    crowd: crowdLevelLabels[shelter.crowdLevel],
    cooling: facilityStatusLabels[shelter.coolingStatus]
  };
}
