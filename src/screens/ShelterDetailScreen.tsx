import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useFavorites } from "../contexts/FavoriteContext";
import { useReports } from "../contexts/ReportContext";
import {
  crowdLevelLabels,
  facilityStatusLabels,
  mockShelters,
  PUBLIC_DATA_EXAMPLE_NAME,
  RECOMMENDED_SHELTER_NAME,
  shelterTypeLabels
} from "../data/mockShelters";
import { RootStackParamList } from "../navigation/navigationTypes";
import {
  calculateShelterRecommendationScore,
  getRecommendationReason
} from "../utils/analytics";
import { colors, sharedStyles } from "./sharedStyles";

type Props = NativeStackScreenProps<RootStackParamList, "ShelterDetail">;

export function ShelterDetailScreen({ navigation, route }: Props) {
  const shelter =
    mockShelters.find((item) => item.id === route.params.shelterId) ?? mockShelters[0];
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReportsByShelter } = useReports();
  const reports = getReportsByShelter(shelter.id);
  const crowdedReports = reports.filter((report) => report.crowded).length;
  const score = calculateShelterRecommendationScore(shelter, reports.length);
  const favorite = isFavorite(shelter.id);
  const isRecommended = shelter.name === RECOMMENDED_SHELTER_NAME;

  const toggle = () => {
    toggleFavorite(shelter.id);
    Alert.alert(
      favorite ? "즐겨찾기 해제" : "즐겨찾기 추가",
      favorite ? "즐겨찾기 목록에서 제거했습니다." : "즐겨찾기 목록에 저장했습니다."
    );
  };

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageIcon}>休</Text>
          <Text style={styles.imageText}>쉼터 대표 이미지</Text>
        </View>
        <View style={styles.heroBody}>
          <View style={sharedStyles.row}>
            <Text style={styles.type}>{shelterTypeLabels[shelter.type]}</Text>
            <Text style={styles.openBadge}>{shelter.isOpen ? "운영 중" : "운영 종료"}</Text>
          </View>
          <Text style={styles.name}>{shelter.name}</Text>
          <Text style={sharedStyles.muted}>{shelter.address}</Text>
          <View style={styles.heroMetricRow}>
            <HeroMetric label="추천 점수" value={`${score.finalScore}점`} />
            <HeroMetric label="도보" value={`${shelter.distanceMeters}m · ${shelter.walkMinutes}분`} />
          </View>
          <View style={styles.iconButtonRow}>
            <Pressable style={styles.iconButton} onPress={toggle}>
              <Text style={styles.iconButtonText}>{favorite ? "즐겨찾기 해제" : "즐겨찾기"}</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => Alert.alert("공유", "시연용 MVP에서는 공유 버튼 UI만 제공합니다.")}
            >
              <Text style={styles.iconButtonText}>공유</Text>
            </Pressable>
          </View>
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
          <Text style={sharedStyles.primaryButtonText}>지도에서 위치 보기</Text>
        </Pressable>
        <Pressable
          style={[sharedStyles.secondaryButton, styles.actionButton]}
          onPress={() => navigation.navigate("Report", { shelterId: shelter.id })}
        >
          <Text style={sharedStyles.secondaryButtonText}>시민 제보하기</Text>
        </Pressable>
        <Pressable
          style={[favorite ? styles.neutralButton : sharedStyles.secondaryButton, styles.actionButton]}
          onPress={toggle}
        >
          <Text style={favorite ? styles.neutralButtonText : sharedStyles.secondaryButtonText}>
            {favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          </Text>
        </Pressable>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>사례 구분</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          {RECOMMENDED_SHELTER_NAME}은 현재 위치 기준 앱 추천 알고리즘이 선택한 추천 쉼터입니다.
        </Text>
        <Text style={[sharedStyles.muted, { marginTop: 8 }]}>
          {PUBLIC_DATA_EXAMPLE_NAME}은 실제 행정안전부 무더위쉼터 데이터 분석에서 이용가능인원과
          에어컨 수가 가장 높게 나타난 별도 공공데이터 분석 사례입니다.
        </Text>
      </View>

      <SectionTabs />

      <InfoSection title="홈">
        <Detail label="주소" value={shelter.address} />
        <Detail label="현재 위치 기준 거리" value={`${shelter.distanceMeters}m · 도보 ${shelter.walkMinutes}분`} />
        <Detail label="운영시간" value={shelter.operatingHours} />
        <Detail label="냉방 상태" value={facilityStatusLabels[shelter.coolingStatus]} />
        <Detail label="난방 상태" value={facilityStatusLabels[shelter.heatingStatus]} />
        <Detail label="혼잡도" value={crowdLevelLabels[shelter.crowdLevel]} />
        <Detail label="물 제공 여부" value={shelter.hasWater ? "제공" : "미제공"} />
        <Detail label="휠체어 접근 가능" value={shelter.wheelchairAccessible ? "가능" : "제한"} />
        <Detail label="반려동물 동반 가능" value={shelter.petAllowed ? "가능" : "불가"} />
      </InfoSection>

      <InfoSection title="정보">
        <Detail label="시설 유형" value={shelterTypeLabels[shelter.type]} />
        <Detail label="이용 가능 인원" value={isRecommended ? "앱 추천 mock 데이터 기준" : "공공데이터 확인 필요"} />
        <Detail label="에어컨/선풍기" value={shelter.coolingStatus === "good" ? "냉방 설비 양호" : "냉방 설비 보통"} />
        <Text style={[sharedStyles.muted, { marginTop: 10 }]}>
          시설 정보는 공공데이터 기반 항목과 앱 시연용 mock 상태 정보를 함께 표시합니다.
        </Text>
      </InfoSection>

      <InfoSection title="분석">
        <Detail label="추천 점수" value={`${score.finalScore}점`} />
        <Detail label="추천 이유" value={getRecommendationReason(shelter)} />
        {score.parts.map((part) => (
          <Detail key={part.label} label={part.label} value={`${part.score}점 · ${part.description}`} />
        ))}
      </InfoSection>

      <InfoSection title="제보">
        <Detail label="최근 제보 수" value={`${shelter.reportCount + reports.length}건`} />
        <Detail label="혼잡함 제보 수" value={`${crowdedReports}건`} />
        <Detail label="긍정 제보 비율" value={`${Math.round(shelter.positiveReportRate * 100)}%`} />
        <Pressable
          style={[sharedStyles.primaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate("Report", { shelterId: shelter.id })}
        >
          <Text style={sharedStyles.primaryButtonText}>시민 제보하기</Text>
        </Pressable>
      </InfoSection>
    </ScrollView>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroMetricLabel}>{label}</Text>
      <Text style={styles.heroMetricValue}>{value}</Text>
    </View>
  );
}

function SectionTabs() {
  return (
    <View style={styles.tabs}>
      {["홈", "정보", "분석", "제보"].map((label, index) => (
        <Text key={label} style={[styles.tab, index === 0 && styles.tabActive]}>
          {label}
        </Text>
      ))}
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
  content: {
    paddingBottom: 22,
    gap: 11
  },
  hero: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderColor: colors.line
  },
  imagePlaceholder: {
    height: 178,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe"
  },
  imageIcon: {
    color: colors.blue,
    fontSize: 42,
    fontWeight: "900"
  },
  imageText: {
    color: colors.blueDark,
    marginTop: 4,
    fontWeight: "900"
  },
  heroBody: {
    padding: 15
  },
  type: {
    color: colors.blue,
    fontWeight: "900"
  },
  openBadge: {
    color: "#047857",
    backgroundColor: "#d1fae5",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "900"
  },
  name: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
    marginTop: 9,
    marginBottom: 6
  },
  heroMetricRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  heroMetric: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  heroMetricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  heroMetricValue: {
    color: colors.text,
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900"
  },
  iconButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  iconButton: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff"
  },
  iconButtonText: {
    color: colors.text,
    fontWeight: "900"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14
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
  tabs: {
    flexDirection: "row",
    marginHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    padding: 4
  },
  tab: {
    flex: 1,
    color: colors.muted,
    textAlign: "center",
    borderRadius: 9,
    paddingVertical: 9,
    fontWeight: "900",
    overflow: "hidden"
  },
  tabActive: {
    color: colors.blue,
    backgroundColor: "#ffffff"
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
