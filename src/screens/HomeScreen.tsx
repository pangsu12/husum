import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { mockShelters, shelterTypeLabels } from "../data/mockShelters";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import {
  calculateShelterScore,
  getRecommendedShelters,
  getShelterRecommendationReasons
} from "../utils/recommendShelters";
import { colors, sharedStyles } from "./sharedStyles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

const demoPreferences = {
  tags: ["어르신", "보행이 불편함"],
  routePreference: "accessible" as const
};

export function HomeScreen({ navigation }: Props) {
  const recommendedShelter = getRecommendedShelters(mockShelters, demoPreferences)[0];
  const score = calculateShelterScore(recommendedShelter, demoPreferences);
  const reasons = getShelterRecommendationReasons(recommendedShelter, demoPreferences);

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={styles.headerCard}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>휴숨</Text>
          <Text style={styles.logoBadge}>MVP</Text>
        </View>
        <Text style={styles.tagline}>공공데이터·시민 제보 기반 기후쉼터 추천</Text>
        <Text style={styles.location}>현재 위치 예시: 서울 성북구</Text>
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerEyebrow}>현재 위험도</Text>
        <Text style={styles.dangerLabel}>폭염 위험 매우 높음</Text>
        <Text style={styles.dangerCopy}>
          체감온도와 야외 이동 위험이 높아 가까운 냉방쉼터 이용을 권장합니다.
        </Text>
      </View>

      <Pressable
        style={sharedStyles.elevatedCard}
        onPress={() => navigation.navigate("ShelterDetail", { shelterId: recommendedShelter.id })}
      >
        <View style={sharedStyles.row}>
          <Text style={styles.scoreBadge}>추천 {score}점</Text>
          <Text style={styles.openBadge}>{recommendedShelter.isOpen ? "운영 중" : "운영 종료"}</Text>
        </View>
        <Text style={styles.shelterName}>{recommendedShelter.name}</Text>
        <Text style={sharedStyles.muted}>
          {shelterTypeLabels[recommendedShelter.type]} · 도보 {recommendedShelter.walkMinutes}분 ·{" "}
          {recommendedShelter.operatingHours}
        </Text>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>추천 이유</Text>
          <Text style={styles.reasonText}>{reasons.join(" ")}</Text>
        </View>
      </Pressable>

      <Pressable
        style={sharedStyles.primaryButton}
        onPress={() => navigation.navigate("ShelterDetail", { shelterId: recommendedShelter.id })}
      >
        <Text style={sharedStyles.primaryButtonText}>상세 보기</Text>
      </Pressable>
      <Pressable
        style={sharedStyles.secondaryButton}
        onPress={() =>
          Alert.alert(
            "안전 경로 안내",
            "실제 서비스에서는 공공데이터와 지도 API를 연동해 안전한 이동 경로를 제공합니다."
          )
        }
      >
        <Text style={sharedStyles.secondaryButtonText}>안전 경로 보기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  logo: {
    color: colors.blue,
    fontSize: 32,
    fontWeight: "900"
  },
  logoBadge: {
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: "900"
  },
  tagline: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  location: {
    color: colors.muted,
    fontSize: 13
  },
  dangerCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fb923c",
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    gap: 8
  },
  dangerEyebrow: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "900"
  },
  dangerLabel: {
    color: colors.danger,
    fontSize: 21,
    fontWeight: "900"
  },
  dangerCopy: {
    color: "#7c2d12",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  scoreBadge: {
    color: "#ffffff",
    backgroundColor: colors.blue,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900"
  },
  openBadge: {
    color: "#047857",
    backgroundColor: "#d1fae5",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900"
  },
  shelterName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 11,
    marginBottom: 6
  },
  reasonBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    gap: 5
  },
  reasonTitle: {
    color: colors.text,
    fontWeight: "900"
  },
  reasonText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  }
});
