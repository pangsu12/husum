import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useFavorites } from "../contexts/FavoriteContext";
import { useReports } from "../contexts/ReportContext";
import {
  airQualityData,
  districtRiskComparison,
  hourlyWeatherData,
  userRiskWeights
} from "../data/mockAnalytics";
import {
  mockShelters,
  PUBLIC_DATA_EXAMPLE_NAME,
  RECOMMENDED_SHELTER_NAME
} from "../data/mockShelters";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import {
  calculateAirQualityRisk,
  calculateClimateRiskScore,
  calculateShelterRecommendationScore,
  getRecommendationReason,
  getRiskBarColor,
  getRiskLevelLabel,
  ScorePart
} from "../utils/analytics";
import { colors, sharedStyles } from "./sharedStyles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Analytics">,
  NativeStackScreenProps<RootStackParamList>
>;

const selectedWeather = hourlyWeatherData[2];
const vulnerableUserWeight = 10;
const climateRisk = calculateClimateRiskScore(
  selectedWeather,
  airQualityData,
  vulnerableUserWeight
);
const airRisk = calculateAirQualityRisk(airQualityData);

const realPublicDataStats = [
  { label: "전체 쉼터 수", value: "100개" },
  { label: "평균 이용가능인원", value: "27.7명" },
  { label: "총 이용가능인원", value: "2,773명" },
  { label: "총 에어컨 수", value: "211대" },
  { label: "총 선풍기 수", value: "209대" },
  { label: "지역 상위", value: "경상남도 하동군 6개" },
  { label: "이용가능인원 1위", value: "봉담도서관 139명" },
  { label: "에어컨 수 1위", value: "봉담도서관 82대" }
];

const realClimateAirStats = [
  { label: "기상 데이터 포인트", value: "7개" },
  { label: "대기질 데이터 포인트", value: "15개" },
  { label: "평균 기온", value: "24.1도" },
  { label: "평균 습도", value: "43.6%" },
  { label: "평균 PM10", value: "13.1" },
  { label: "평균 PM2.5", value: "7.5" },
  { label: "평균 오존", value: "0.0657" },
  { label: "폭염 위험 최대", value: "18시" },
  { label: "대기질 위험 최대", value: "성남시" }
];

export function AnalyticsScreen({ navigation }: Props) {
  const { reports } = useReports();
  const { favoriteIds } = useFavorites();
  const recommendedShelter =
    mockShelters.find((shelter) => shelter.name === RECOMMENDED_SHELTER_NAME) ?? mockShelters[0];
  const sessionReportCount = reports.filter((report) => report.shelterId === recommendedShelter.id).length;
  const shelterScore = calculateShelterRecommendationScore(recommendedShelter, sessionReportCount);
  const totalMockReports = mockShelters.reduce((sum, shelter) => sum + shelter.reportCount, 0);
  const crowdedReports = reports.filter((report) => report.crowded).length;
  const shelterReportSummaries = mockShelters.map((shelter) => {
    const sessionCount = reports.filter((report) => report.shelterId === shelter.id).length;

    return {
      shelter,
      sessionCount,
      totalCount: shelter.reportCount + sessionCount,
      score: calculateShelterRecommendationScore(shelter, sessionCount).finalScore
    };
  });
  const mostReportedShelter = [...shelterReportSummaries].sort(
    (a, b) => b.totalCount - a.totalCount
  )[0];
  const hourlyRisk = hourlyWeatherData.map((item) => ({
    hour: item.hour,
    score: calculateClimateRiskScore(item, airQualityData, vulnerableUserWeight).finalScore
  }));

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={styles.eyebrow}>내 위치 기준 추천 결과</Text>
        <Text style={styles.heroName}>{recommendedShelter.name}</Text>
        <Text style={sharedStyles.body}>
          현재 위치 기준 앱 추천 알고리즘이 선택한 추천 쉼터입니다.
        </Text>
        <View style={styles.summaryGrid}>
          <Metric label="최종 추천 점수" value={`${shelterScore.finalScore}점`} strong />
          <Metric label="예상 거리" value={`${recommendedShelter.distanceMeters}m`} />
          <Metric label="도보 시간" value={`${recommendedShelter.walkMinutes}분`} />
          <Metric label="현재 위험도" value={`${climateRisk.finalScore}점 · ${getRiskLevelLabel(climateRisk.finalScore)}`} />
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={[sharedStyles.primaryButton, styles.flexButton]}
            onPress={() => navigation.navigate("ShelterDetail", { shelterId: recommendedShelter.id })}
          >
            <Text style={sharedStyles.primaryButtonText}>추천 쉼터 상세 보기</Text>
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
            <Text style={sharedStyles.secondaryButtonText}>지도에서 위치 확인</Text>
          </Pressable>
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>왜 이 쉼터를 추천했나요?</Text>
        <Reason text="현재 위치에서 220m, 도보 3분 거리로 가장 빠르게 이동할 수 있습니다." />
        <Reason text="운영 중이고 냉방 상태가 좋아 폭염 위험도가 높은 시간대에 적합합니다." />
        <Reason text="혼잡도가 낮고 시민 제보 신뢰도도 높아 실제 이용 가능성이 높습니다." />
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>위험도는 어떻게 계산했나요?</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          기온, 체감온도, 습도, 대기질, 취약 사용자 가중치를 합산해 현재 이동 위험도를 계산했습니다.
        </Text>
        <ScoreBreakdown parts={climateRisk.parts} maxScore={100} />
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>어떤 데이터를 사용했나요?</Text>
        <InfoRow label="쉼터 데이터" value="행정안전부 무더위쉼터 공공데이터 분석 결과 + 앱 mock 쉼터" />
        <InfoRow label="기상 데이터" value="기상청 단기예보 API 분석 결과" />
        <InfoRow label="대기질 데이터" value="에어코리아 대기오염정보 API 분석 결과" />
        <InfoRow label="시민 제보" value={`기본 ${totalMockReports}건 + 현재 세션 ${reports.length}건`} />
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>실제 공공데이터 분석 결과</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          {PUBLIC_DATA_EXAMPLE_NAME}은 실제 행정안전부 무더위쉼터 데이터 분석에서 이용가능인원과
          에어컨 수가 가장 높게 나타난 사례입니다. 현재 위치 기반 추천 결과와는 별개의 공공데이터 분석 사례입니다.
        </Text>
        <View style={styles.publicDataGrid}>
          {realPublicDataStats.slice(0, 4).map((item) => (
            <Metric key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>실제 기상·대기질 분석 결과</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          API 호출 시점 기준 분석 결과이며, 실시간 예보나 장기 통계가 아닌 시연용 분석 스냅샷입니다.
        </Text>
        <View style={styles.publicDataGrid}>
          {realClimateAirStats.slice(0, 4).map((item) => (
            <Metric key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>상세 분석 보기</Text>
        <Text style={[sharedStyles.muted, { marginTop: 8 }]}>
          아래 영역은 시연자가 근거를 자세히 설명할 때 사용하는 상세 카드입니다.
        </Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>전체 공공데이터 수치</Text>
        <View style={styles.publicDataGrid}>
          {realPublicDataStats.map((item) => (
            <Metric key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>전체 기상·대기질 수치</Text>
        <View style={styles.publicDataGrid}>
          {realClimateAirStats.map((item) => (
            <Metric key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>시간대별 위험도 변화</Text>
        <View style={styles.barChart}>
          {hourlyRisk.map((item) => (
            <View key={item.hour} style={styles.barItem}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${item.score}%`,
                      backgroundColor: getRiskBarColor(item.score)
                    }
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{item.score}</Text>
              <Text style={styles.barLabel}>{item.hour}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>대기질 위험도 분석</Text>
        <InfoRow label="초미세먼지" value={`${airQualityData.pm25}`} />
        <InfoRow label="오존" value={airQualityData.ozone} />
        <InfoRow label="통합대기환경" value={airQualityData.airQualityIndex} />
        <InfoRow label="대기질 위험 점수" value={`${airRisk.total}점`} />
        <ScoreBreakdown parts={airRisk.parts} maxScore={36} />
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>추천 점수 상세</Text>
        <Text style={styles.subTitle}>{recommendedShelter.name}</Text>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>최종 추천 점수</Text>
          <Text style={styles.totalScore}>{shelterScore.finalScore}점</Text>
        </View>
        <ScoreBreakdown parts={shelterScore.parts} maxScore={100} />
        <Text style={styles.analysisText}>{getRecommendationReason(recommendedShelter)}</Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>시민 제보 반영 분석</Text>
        <InfoRow label="기본 mock 제보" value={`${totalMockReports}건`} />
        <InfoRow label="현재 세션 제보" value={`${reports.length}건`} />
        <InfoRow label="혼잡함 제보" value={`${crowdedReports}건`} />
        <InfoRow label="즐겨찾기 저장" value={`${favoriteIds.length}개`} />
        <InfoRow label="제보가 많은 쉼터" value={`${mostReportedShelter.shelter.name} ${mostReportedShelter.totalCount}건`} />
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>쉼터별 세션 반영</Text>
        {shelterReportSummaries.map((item) => (
          <View key={item.shelter.id} style={styles.shelterReportRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shelterReportName}>{item.shelter.name}</Text>
              <Text style={sharedStyles.muted}>
                기본 {item.shelter.reportCount}건 · 세션 {item.sessionCount}건
              </Text>
            </View>
            <Text style={styles.shelterReportBadge}>{item.score}점</Text>
          </View>
        ))}
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>취약 사용자 맞춤 분석</Text>
        {userRiskWeights.map((item) => (
          <View key={item.userType} style={styles.weightRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.weightTitle}>{item.userType}</Text>
              <Text style={sharedStyles.muted}>{item.reason}</Text>
            </View>
            <Text style={styles.weightBadge}>+{item.weight}</Text>
          </View>
        ))}
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>지역별 위험도 비교</Text>
        {districtRiskComparison.map((item) => (
          <HorizontalBar key={item.district} label={item.district} score={item.score} />
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={[styles.metric, strong && styles.metricStrong]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, strong && styles.metricValueStrong]}>{value}</Text>
    </View>
  );
}

function Reason({ text }: { text: string }) {
  return (
    <View style={styles.reasonRow}>
      <View style={styles.reasonDot} />
      <Text style={styles.reasonText}>{text}</Text>
    </View>
  );
}

function ScoreBreakdown({ parts, maxScore }: { parts: ScorePart[]; maxScore: number }) {
  return (
    <View style={styles.breakdown}>
      {parts.map((part) => (
        <View key={part.label} style={styles.scoreRow}>
          <View style={styles.scoreMeta}>
            <Text style={styles.infoLabel}>{part.label}</Text>
            <Text style={styles.description}>{part.description}</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View
              style={[
                styles.scoreFill,
                { width: `${Math.min((part.score / maxScore) * 100, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.scoreText}>{part.score}점</Text>
        </View>
      ))}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function HorizontalBar({ label, score }: { label: string; score: number }) {
  return (
    <View style={styles.horizontalBarRow}>
      <Text style={styles.horizontalLabel}>{label}</Text>
      <View style={styles.horizontalTrack}>
        <View style={[styles.horizontalFill, { width: `${score}%`, backgroundColor: getRiskBarColor(score) }]} />
      </View>
      <Text style={styles.horizontalScore}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  heroName: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 29,
    marginTop: 7,
    marginBottom: 7,
    fontWeight: "900"
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13
  },
  metric: {
    width: "48%",
    minHeight: 72,
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  metricStrong: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800"
  },
  metricValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: "900"
  },
  metricValueStrong: {
    color: "#ffffff",
    fontSize: 18
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  flexButton: {
    flexGrow: 1,
    minWidth: 150
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10
  },
  reasonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: colors.blue
  },
  reasonText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
  },
  publicDataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  breakdown: {
    marginTop: 10,
    gap: 8
  },
  scoreRow: {
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  scoreMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  scoreTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#e2e8f0"
  },
  scoreFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.blue
  },
  scoreText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right"
  },
  description: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 0
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    textAlign: "right",
    flex: 1
  },
  barChart: {
    height: 168,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 8
  },
  barItem: {
    width: "18%",
    alignItems: "center",
    gap: 5
  },
  barTrack: {
    width: 24,
    height: 112,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#e2e8f0"
  },
  barFill: {
    width: "100%",
    borderRadius: 999
  },
  barValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  barLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  subTitle: {
    color: colors.blue,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: "900"
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.blueSoft
  },
  totalLabel: {
    color: colors.blue,
    fontWeight: "900"
  },
  totalScore: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: "900"
  },
  analysisText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    fontWeight: "700"
  },
  shelterReportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  shelterReportName: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900"
  },
  shelterReportBadge: {
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: "900"
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  weightTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  weightBadge: {
    color: "#ffffff",
    backgroundColor: colors.blue,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: "900"
  },
  horizontalBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },
  horizontalLabel: {
    width: 64,
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  horizontalTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#e2e8f0"
  },
  horizontalFill: {
    height: "100%",
    borderRadius: 999
  },
  horizontalScore: {
    width: 28,
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right"
  }
});
