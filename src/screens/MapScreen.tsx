import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { NaverMapWeb } from "../components/NaverMapWeb";
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
  BottomTabScreenProps<TabParamList, "Map">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MapScreen({ navigation, route }: Props) {
  const { shelters } = useShelterData();
  const { preferences } = usePreferenceSettings();
  const recommendedShelters = useMemo(() => getRecommendedShelters(shelters, preferences), [shelters, preferences]);
  const initialSelectedId = route.params?.selectedShelterId ?? recommendedShelters[0]?.id ?? shelters[0]?.id;
  const [selectedShelterId, setSelectedShelterId] = useState(initialSelectedId);
  const selectedShelter = useMemo(
    () => shelters.find((shelter) => shelter.id === selectedShelterId) ?? recommendedShelters[0] ?? shelters[0],
    [selectedShelterId, shelters, recommendedShelters]
  );
  const selectedScore = selectedShelter ? calculateShelterScore(selectedShelter, preferences) : 0;
  const selectedRankOffset = selectedShelter
    ? Math.max(0, recommendedShelters.findIndex((shelter) => shelter.id === selectedShelter.id))
    : 0;
  const selectedDisplayScore = getDisplayScore(selectedScore, selectedRankOffset);
  const selectedReasons = selectedShelter ? getShelterRecommendationReasons(selectedShelter, preferences) : [];

  useEffect(() => {
    if (route.params?.selectedShelterId) {
      setSelectedShelterId(route.params.selectedShelterId);
    }
  }, [route.params?.selectedShelterId]);

  useEffect(() => {
    if (!shelters.some((shelter) => shelter.id === selectedShelterId) && recommendedShelters[0]) {
      setSelectedShelterId(recommendedShelters[0].id);
    }
  }, [selectedShelterId, shelters, recommendedShelters]);

  const openDetail = (shelterId: string) => {
    navigation.navigate("ShelterDetail", { shelterId });
  };

  const selectBestShelter = () => {
    if (recommendedShelters[0]) setSelectedShelterId(recommendedShelters[0].id);
  };

  if (!selectedShelter) {
    return (
      <View style={[sharedStyles.screen, styles.center]}>
        <Text style={sharedStyles.sectionTitle}>주변 쉼터 정보를 불러오는 중입니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>주변 쉼터 탐색</Text>
        <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
          현재 위치 주변 쉼터를 표시하고 있습니다. 사용자 조건에 맞게 추천 순서를 계산합니다.
        </Text>
        <Pressable style={[sharedStyles.primaryButton, styles.findButton]} onPress={selectBestShelter}>
          <Text style={sharedStyles.primaryButtonText}>내 위치 기준 최적 쉼터 찾기</Text>
        </Pressable>
      </View>

      <NaverMapWeb
        shelters={shelters}
        selectedShelterId={selectedShelter.id}
        onSelectShelter={setSelectedShelterId}
        onOpenShelter={openDetail}
      />

      <View style={sharedStyles.elevatedCard}>
        <View style={sharedStyles.row}>
          <Text style={styles.selectedLabel}>내 위치 기준 추천 쉼터</Text>
          <Text style={styles.scoreBadge}>{formatRecommendationScore(selectedScore, selectedRankOffset)}</Text>
        </View>
        <Text style={styles.selectedName}>{selectedShelter.name}</Text>
        <Text style={sharedStyles.muted}>{selectedShelter.address}</Text>

        <View style={styles.scoreArea}>
          <ScoreBar score={selectedDisplayScore} />
        </View>

        <View style={styles.statusRow}>
          <StatusPill label={openLabel(selectedShelter.isOpen)} />
          <StatusPill label={comfortLabel(selectedShelter.coolingStatus)} tone="blue" />
          <StatusPill label={`혼잡도 ${crowdLabel(selectedShelter.crowdLevel)}`} tone="gray" />
        </View>

        <Text style={[sharedStyles.body, styles.address]}>
          {formatDistance(selectedShelter.distanceMeters)} · 도보 {selectedShelter.walkMinutes}분
        </Text>

        <View style={styles.tagWrap}>
          {selectedReasons.map((reason) => (
            <Tag key={reason} label={reason} tone={reason.includes("운영") ? "green" : "blue"} />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[sharedStyles.primaryButton, styles.flexButton]} onPress={() => openDetail(selectedShelter.id)}>
            <Text style={sharedStyles.primaryButtonText}>상세 보기</Text>
          </Pressable>
          <Pressable
            style={[sharedStyles.secondaryButton, styles.flexButton]}
            onPress={() => setSelectedShelterId(selectedShelter.id)}
          >
            <Text style={sharedStyles.secondaryButtonText}>경로 보기</Text>
          </Pressable>
          <Pressable
            style={[styles.outlineButton, styles.flexButton]}
            onPress={() => navigation.navigate("Report", { shelterId: selectedShelter.id })}
          >
            <Text style={styles.outlineButtonText}>상태 제보</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={sharedStyles.sectionTitle}>추천 순서</Text>
        <Text style={sharedStyles.muted}>주변 쉼터 정보를 불러와 현재 위치와 사용자 조건에 맞게 추천합니다.</Text>
      </View>

      {recommendedShelters.map((shelter, index) => {
        const selected = shelter.id === selectedShelter.id;
        const score = calculateShelterScore(shelter, preferences);
        const displayScore = getDisplayScore(score, index);

        return (
          <Pressable
            key={shelter.id}
            style={[sharedStyles.card, selected && styles.selectedCard]}
            onPress={() => setSelectedShelterId(shelter.id)}
          >
            <View style={sharedStyles.row}>
              <Text style={styles.shelterName}>{shelter.name}</Text>
              <Text style={styles.scoreBadge}>{formatRecommendationScore(score, index)}</Text>
            </View>
            <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
              {formatDistance(shelter.distanceMeters)} · 도보 {shelter.walkMinutes}분 · {openLabel(shelter.isOpen)}
            </Text>
            <View style={styles.smallScore}>
              <ScoreBar score={displayScore} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  findButton: {
    marginTop: 12
  },
  selectedLabel: {
    color: colors.blue,
    fontWeight: "900"
  },
  selectedName: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 27,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "900"
  },
  address: {
    marginTop: 10
  },
  scoreArea: {
    marginTop: 12
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12
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
    minWidth: 105
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
  listHeader: {
    gap: 4,
    marginTop: 2
  },
  selectedCard: {
    borderColor: colors.blue,
    backgroundColor: "#eff6ff"
  },
  shelterName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900"
  },
  scoreBadge: {
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: "900"
  },
  smallScore: {
    marginTop: 10
  }
});
