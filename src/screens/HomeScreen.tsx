import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePreferenceSettings } from "../contexts/PreferenceContext";
import { useShelterData } from "../contexts/ShelterDataContext";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import {
  calculateShelterScore,
  getRecommendedShelters,
  getShelterRecommendationReasons
} from "../utils/recommendShelters";
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

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

type ClimateMode = "heat" | "cold";

const currentWeather = {
  location: "서울 성북구",
  condition: "맑음",
  temperature: 34.2,
  feelsLike: 37.6,
  humidity: 68,
  riskLevel: "높음"
};

export function HomeScreen({ navigation }: Props) {
  const [mode, setMode] = useState<ClimateMode>("heat");
  const { preferences, selectedTagLabels } = usePreferenceSettings();
  const { shelters } = useShelterData();
  const recommendedShelter = getRecommendedShelters(shelters, preferences)[0];
  const score = calculateShelterScore(recommendedShelter, preferences);
  const displayScore = getDisplayScore(score);
  const reasons = getShelterRecommendationReasons(recommendedShelter, preferences);

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={styles.header}>
        <View style={sharedStyles.row}>
          <View>
            <Text style={styles.appName}>휴숨</Text>
            <Text style={styles.headerSub}>현재 위치 기준 쉼터 추천</Text>
          </View>
          <Text style={styles.weatherBadge}>{currentWeather.condition}</Text>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.location}>{currentWeather.location}</Text>
          <Text style={styles.riskBadge}>폭염 위험도 {currentWeather.riskLevel}</Text>
        </View>

        <View style={styles.weatherGrid}>
          <WeatherMetric label="현재 기온" value={`${currentWeather.temperature}℃`} />
          <WeatherMetric label="체감온도" value={`${currentWeather.feelsLike}℃`} danger />
          <WeatherMetric label="습도" value={`${currentWeather.humidity}%`} />
        </View>
      </View>

      <View style={styles.segment}>
        <ModeButton label="폭염" active={mode === "heat"} onPress={() => setMode("heat")} />
        <ModeButton label="한파" active={mode === "cold"} onPress={() => setMode("cold")} />
      </View>

      {mode === "cold" ? (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.sectionTitle}>한파 정보</Text>
          <Text style={[sharedStyles.body, { marginTop: 8 }]}>
            현재 계절에는 폭염 위험 정보를 우선 제공합니다. 한파 쉼터 정보는 겨울철 운영 조건에 맞춰 안내됩니다.
          </Text>
        </View>
      ) : (
        <View style={styles.recommendCard}>
          <Text style={styles.eyebrow}>현재 내 위치 기준 최적 쉼터</Text>
          <Text style={styles.shelterName}>{recommendedShelter.name}</Text>
          <Text style={sharedStyles.muted}>{recommendedShelter.address}</Text>

          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreLabel}>추천 적합도</Text>
              <Text style={styles.scoreValue}>{formatRecommendationScore(score)}</Text>
            </View>
            <View style={styles.statusStack}>
              <StatusPill label={openLabel(recommendedShelter.isOpen)} />
              <StatusPill label={comfortLabel(recommendedShelter.coolingStatus)} tone="blue" />
            </View>
          </View>
          <ScoreBar score={displayScore} />

          <View style={styles.infoGrid}>
            <Info label="거리" value={formatDistance(recommendedShelter.distanceMeters)} />
            <Info label="도보 시간" value={`${recommendedShelter.walkMinutes}분`} />
            <Info label="혼잡도" value={crowdLabel(recommendedShelter.crowdLevel)} />
            <Info label="물 제공" value={recommendedShelter.hasWater ? "가능" : "확인 필요"} />
          </View>

          <View style={styles.tagWrap}>
            {reasons.map((reason) => (
              <Tag key={reason} label={reason} tone={reason.includes("운영") ? "green" : "blue"} />
            ))}
          </View>

          <Text style={[sharedStyles.muted, { marginTop: 12 }]}>
            현재 위치, 운영 여부, 냉방 상태, 혼잡도와 선택한 맞춤 조건을 함께 반영했습니다.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={[sharedStyles.primaryButton, styles.flexButton]}
              onPress={() => navigation.navigate("ShelterDetail", { shelterId: recommendedShelter.id })}
            >
              <Text style={sharedStyles.primaryButtonText}>상세 보기</Text>
            </Pressable>
            <Pressable
              style={[sharedStyles.secondaryButton, styles.flexButton]}
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "Map",
                  params: { selectedShelterId: recommendedShelter.id }
                })
              }
            >
              <Text style={sharedStyles.secondaryButtonText}>경로 보기</Text>
            </Pressable>
            <Pressable
              style={[styles.outlineButton, styles.flexButton]}
              onPress={() => navigation.navigate("Report", { shelterId: recommendedShelter.id })}
            >
              <Text style={styles.outlineButtonText}>쉼터 상태 제보</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.sectionTitle}>맞춤 조건 반영 중</Text>
          <Text style={styles.subtleLink} onPress={() => navigation.navigate("Preference")}>
            수정
          </Text>
        </View>
        <View style={styles.tagWrap}>
          {selectedTagLabels.map((tag) => (
            <Tag key={tag} label={tag} tone="gray" />
          ))}
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>바로가기</Text>
        <View style={styles.quickGrid}>
          <QuickButton label="주변 쉼터" onPress={() => navigation.navigate("Map")} />
          <QuickButton label="맞춤 설정" onPress={() => navigation.navigate("Preference")} />
          <QuickButton label="즐겨찾기" onPress={() => navigation.navigate("Favorite")} />
          <QuickButton
            label="상태 제보"
            onPress={() => navigation.navigate("Report", { shelterId: recommendedShelter.id })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function WeatherMetric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.weatherMetric}>
      <Text style={styles.weatherLabel}>{label}</Text>
      <Text style={[styles.weatherValue, danger && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segmentItem, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={sharedStyles.metricLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function QuickButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickButton} onPress={onPress}>
      <Text style={styles.quickButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.blue,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  appName: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900"
  },
  headerSub: {
    color: "#dbeafe",
    marginTop: 3,
    fontSize: 13,
    fontWeight: "800"
  },
  weatherBadge: {
    color: colors.blueDark,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900"
  },
  locationRow: {
    marginTop: 15,
    gap: 8
  },
  location: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900"
  },
  riskBadge: {
    alignSelf: "flex-start",
    color: "#ffffff",
    backgroundColor: colors.danger,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900"
  },
  weatherGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14
  },
  weatherMetric: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)"
  },
  weatherLabel: {
    color: "#dbeafe",
    fontSize: 11,
    fontWeight: "800"
  },
  weatherValue: {
    color: "#ffffff",
    marginTop: 5,
    fontSize: 18,
    fontWeight: "900"
  },
  segment: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    padding: 4
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 11,
    paddingVertical: 11
  },
  segmentActive: {
    backgroundColor: colors.blue
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "900"
  },
  segmentTextActive: {
    color: "#ffffff"
  },
  recommendCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    shadowColor: "#0f172a",
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  eyebrow: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  shelterName: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 7,
    marginBottom: 5
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
    marginBottom: 8
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  scoreValue: {
    color: colors.blue,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900"
  },
  statusStack: {
    alignItems: "flex-end",
    gap: 6
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13
  },
  infoBox: {
    width: "48%",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  infoValue: {
    color: colors.text,
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900"
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  flexButton: {
    flexGrow: 1,
    minWidth: 140
  },
  outlineButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14
  },
  outlineButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  subtleLink: {
    color: colors.blue,
    fontWeight: "900"
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  quickButton: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10
  },
  quickButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  }
});
