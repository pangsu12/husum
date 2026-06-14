import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useFavorites } from "../contexts/FavoriteContext";
import { usePreferenceSettings } from "../contexts/PreferenceContext";
import { useReports } from "../contexts/ReportContext";
import { useShelterData } from "../contexts/ShelterDataContext";
import { shelterTypeLabels } from "../data/mockShelters";
import { RootStackParamList } from "../navigation/navigationTypes";
import {
  calculateShelterScore,
  getShelterRecommendationReasons
} from "../utils/recommendShelters";
import { getFacilityCountLabel } from "../utils/shelterStatus";
import {
  comfortLabel,
  crowdLabel,
  formatRecommendationScore,
  formatDistance,
  getDisplayScore,
  openLabel,
  ScoreBar,
  StatusPill,
  Tag
} from "./ShelterUi";
import { colors, sharedStyles } from "./sharedStyles";

type Props = NativeStackScreenProps<RootStackParamList, "ShelterDetail">;

export function ShelterDetailScreen({ navigation, route }: Props) {
  const { findShelter, shelters } = useShelterData();
  const shelter = findShelter(route.params.shelterId) ?? shelters[0];
  const { preferences } = usePreferenceSettings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReportsByShelter } = useReports();
  const reports = getReportsByShelter(shelter.id);
  const crowdedReports = reports.filter((report) => report.crowded).length;
  const score = calculateShelterScore(shelter, preferences);
  const displayScore = getDisplayScore(score);
  const reasons = getShelterRecommendationReasons(shelter, preferences);
  const favorite = isFavorite(shelter.id);
  const facilityCountLabel = getFacilityCountLabel(shelter);

  const toggle = () => {
    toggleFavorite(shelter.id);
    Alert.alert(favorite ? "즐겨찾기 해제" : "즐겨찾기 추가", favorite ? "즐겨찾기에서 해제했습니다." : "즐겨찾기에 추가했습니다.");
  };

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <View style={styles.summaryGrid}>
          <Summary label={openLabel(shelter)} tone="green" />
          <Summary label={`도보 ${shelter.walkMinutes}분`} tone="blue" />
          <Summary label={comfortLabel(shelter.coolingStatus)} tone="blue" />
          <Summary label={`혼잡도 ${crowdLabel(shelter.crowdLevel)}`} tone="gray" />
        </View>
        <Text style={styles.name}>{shelter.name}</Text>
        <Text style={sharedStyles.muted}>{shelter.address}</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>추천 적합도</Text>
          <Text style={styles.scoreValue}>{formatRecommendationScore(score)}</Text>
        </View>
        <ScoreBar score={displayScore} />
        <View style={styles.tagWrap}>
          {reasons.map((reason) => (
            <Tag key={reason} label={reason} tone={reason.includes("운영") ? "green" : "blue"} />
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[sharedStyles.primaryButton, styles.actionButton]}
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "Map",
              params: { selectedShelterId: shelter.id }
            })
          }
        >
          <Text style={sharedStyles.primaryButtonText}>지도에서 확인</Text>
        </Pressable>
        <Pressable
          style={[sharedStyles.secondaryButton, styles.actionButton]}
          onPress={() => navigation.navigate("Report", { shelterId: shelter.id })}
        >
          <Text style={sharedStyles.secondaryButtonText}>상태 제보</Text>
        </Pressable>
        <Pressable style={[styles.neutralButton, styles.actionButton]} onPress={toggle}>
          <Text style={styles.neutralButtonText}>{favorite ? "즐겨찾기 해제" : "즐겨찾기"}</Text>
        </Pressable>
      </View>

      <InfoSection title="기본 정보">
        <Detail label="쉼터명" value={shelter.name} />
        <Detail label="주소" value={shelter.address} />
        <Detail label="운영시간" value={shelter.operatingHours} />
        <Detail label="거리" value={formatDistance(shelter.distanceMeters)} />
        <Detail label="도보 시간" value={`${shelter.walkMinutes}분`} />
      </InfoSection>

      <InfoSection title="상태 정보">
        <View style={styles.statusWrap}>
          <StatusPill label={openLabel(shelter)} />
          <StatusPill label={comfortLabel(shelter.coolingStatus)} tone="blue" />
          <StatusPill label={comfortLabel(shelter.heatingStatus, "heating")} tone="orange" />
          <StatusPill label={`혼잡도 ${crowdLabel(shelter.crowdLevel)}`} tone="gray" />
        </View>
      </InfoSection>

      <InfoSection title="편의 정보">
        <Detail label="물 제공" value={shelter.hasWater ? "가능" : "확인 필요"} />
        <Detail label="휠체어 접근" value={shelter.wheelchairAccessible ? "가능" : "확인 필요"} />
        <Detail label="반려동물 동반" value={shelter.petAllowed ? "가능" : "제한"} />
        <Detail label="냉방기·선풍기" value={facilityCountLabel || "시설 정보 확인 중"} />
        <Detail label="시설 유형" value={shelterTypeLabels[shelter.type]} />
      </InfoSection>

      <InfoSection title="최근 제보">
        <Text style={sharedStyles.body}>
          최근 제보 {shelter.reportCount + reports.length}건 중 긍정 제보 비율은 {Math.round(shelter.positiveReportRate * 100)}%입니다.
        </Text>
        <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
          혼잡 제보 {crowdedReports}건이 반영되었습니다. 현장 상태가 다르면 빠르게 알려주세요.
        </Text>
        <Pressable
          style={[sharedStyles.primaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate("Report", { shelterId: shelter.id })}
        >
          <Text style={sharedStyles.primaryButtonText}>상태 제보</Text>
        </Pressable>
      </InfoSection>
    </ScrollView>
  );
}

function Summary({ label, tone }: { label: string; tone: "green" | "blue" | "gray" }) {
  return (
    <View style={[styles.summaryItem, tone === "green" && styles.summaryGreen, tone === "blue" && styles.summaryBlue]}>
      <Text style={[styles.summaryText, tone === "green" && styles.summaryTextGreen, tone === "blue" && styles.summaryTextBlue]}>
        {label}
      </Text>
    </View>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sharedStyles.card}>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  summaryItem: {
    width: "48%",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: colors.line
  },
  summaryGreen: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0"
  },
  summaryBlue: {
    backgroundColor: colors.blueSoft,
    borderColor: "#bfdbfe"
  },
  summaryText: {
    color: colors.text,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900"
  },
  summaryTextGreen: {
    color: "#047857"
  },
  summaryTextBlue: {
    color: colors.blue
  },
  name: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 6
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 8
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900"
  },
  scoreValue: {
    color: colors.blue,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900"
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 116
  },
  neutralButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14
  },
  neutralButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    borderBottomColor: colors.line,
    borderBottomWidth: 1
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 0
  },
  detailValue: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    textAlign: "right"
  }
});
