import { StyleSheet, Text, View } from "react-native";

import { CrowdLevel, FacilityStatus, Shelter } from "../types/shelter";
import { colors } from "./sharedStyles";

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
}

export function openLabel(isOpen: boolean) {
  return isOpen ? "운영 중" : "운영 확인 필요";
}

export function crowdLabel(level: CrowdLevel) {
  if (level === "low") return "낮음";
  if (level === "medium") return "보통";
  return "높음";
}

export function comfortLabel(status: FacilityStatus, type: "cooling" | "heating" = "cooling") {
  const prefix = type === "cooling" ? "냉방" : "난방";
  if (status === "good") return `${prefix} 쾌적`;
  if (status === "weak") return `${prefix} 보통`;
  return `${prefix} 확인 필요`;
}

export function getDisplayScore(score: number, rankOffset = 0) {
  const bounded = Math.max(0, Math.min(100, score));

  if (bounded >= 100) return Math.max(92, 96 - rankOffset * 2);
  if (bounded >= 98) return Math.max(91, 95 - rankOffset);
  return bounded;
}

export function formatRecommendationScore(score: number, rankOffset = 0) {
  const displayScore = getDisplayScore(score, rankOffset);
  if (displayScore >= 94) return `매우 적합 · ${displayScore}점`;
  if (displayScore >= 85) return `적합 · ${displayScore}점`;
  return `${displayScore}점`;
}

export function availabilityTags(shelter: Shelter) {
  return [
    openLabel(shelter.isOpen),
    `${formatDistance(shelter.distanceMeters)} · 도보 ${shelter.walkMinutes}분`,
    comfortLabel(shelter.coolingStatus),
    `혼잡도 ${crowdLabel(shelter.crowdLevel)}`
  ];
}

export function ScoreBar({ score, danger }: { score: number; danger?: boolean }) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.max(0, Math.min(100, score))}%`,
            backgroundColor: danger ? colors.warning : colors.blue
          }
        ]}
      />
    </View>
  );
}

export function Tag({
  label,
  tone = "blue"
}: {
  label: string;
  tone?: "blue" | "green" | "orange" | "gray";
}) {
  return (
    <Text
      style={[
        styles.tag,
        tone === "green" && styles.greenTag,
        tone === "orange" && styles.orangeTag,
        tone === "gray" && styles.grayTag
      ]}
    >
      {label}
    </Text>
  );
}

export function StatusPill({
  label,
  tone = "green"
}: {
  label: string;
  tone?: "green" | "blue" | "orange" | "gray";
}) {
  return (
    <Text
      style={[
        styles.pill,
        tone === "blue" && styles.bluePill,
        tone === "orange" && styles.orangePill,
        tone === "gray" && styles.grayPill
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#e2e8f0"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  },
  tag: {
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900"
  },
  greenTag: {
    color: "#047857",
    backgroundColor: "#d1fae5"
  },
  orangeTag: {
    color: "#c2410c",
    backgroundColor: "#ffedd5"
  },
  grayTag: {
    color: colors.text,
    backgroundColor: "#f1f5f9"
  },
  pill: {
    color: "#047857",
    backgroundColor: "#d1fae5",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "900"
  },
  bluePill: {
    color: colors.blue,
    backgroundColor: colors.blueSoft
  },
  orangePill: {
    color: "#c2410c",
    backgroundColor: "#ffedd5"
  },
  grayPill: {
    color: colors.text,
    backgroundColor: "#f1f5f9"
  }
});
