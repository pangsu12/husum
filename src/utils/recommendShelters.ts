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

export function calculateShelterScore(
  shelter: Shelter,
  preferences: UserPreferences = { tags: [] }
) {
  const distanceScore = Math.max(0, Math.round(28 - shelter.distanceMeters / 35));
  const openScore = shelter.isOpen ? 20 : 0;
  const coolingScore = facilityScore[shelter.coolingStatus];
  const crowdLevelScore = crowdScore[shelter.crowdLevel];
  const accessibilityScore = shelter.wheelchairAccessible ? 10 : 3;
  const waterScore = shelter.hasWater ? 6 : 0;
  const reportScore = Math.round(shelter.positiveReportRate * 12);
  const mobilityBonus =
    preferences.tags.includes("보행이 불편함") && shelter.wheelchairAccessible ? 8 : 0;
  const petBonus = preferences.tags.includes("반려동물 동반") && shelter.petAllowed ? 6 : 0;

  return Math.min(
    100,
    distanceScore +
      openScore +
      coolingScore +
      crowdLevelScore +
      accessibilityScore +
      waterScore +
      reportScore +
      mobilityBonus +
      petBonus
  );
}

export function getShelterRecommendationReasons(
  shelter: Shelter,
  preferences: UserPreferences = { tags: [] }
) {
  const reasons: string[] = [];

  if (shelter.distanceMeters <= 300) reasons.push("현재 위치에서 가까운 거리입니다.");
  if (shelter.isOpen) reasons.push("지금 운영 중입니다.");
  if (shelter.coolingStatus === "good") {
    reasons.push(`냉방 상태가 ${facilityStatusLabels[shelter.coolingStatus]}입니다.`);
  }
  if (shelter.crowdLevel === "low") {
    reasons.push(`혼잡도가 ${crowdLevelLabels[shelter.crowdLevel]}입니다.`);
  }
  if (shelter.wheelchairAccessible) reasons.push("휠체어 접근이 가능합니다.");
  if (shelter.positiveReportRate >= 0.8) reasons.push("최근 시민 제보 평가가 좋습니다.");
  if (preferences.tags.includes("반려동물 동반") && shelter.petAllowed) {
    reasons.push("반려동물과 함께 이용할 수 있습니다.");
  }

  return reasons.slice(0, 4);
}

export function getRecommendedShelters(
  shelters: Shelter[],
  preferences: UserPreferences = { tags: [] }
) {
  return [...shelters].sort(
    (a, b) => calculateShelterScore(b, preferences) - calculateShelterScore(a, preferences)
  );
}
