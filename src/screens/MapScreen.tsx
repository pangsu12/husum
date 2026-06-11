import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { NaverMapWeb } from "../components/NaverMapWeb";
import { AppRegionKey, Coordinates, regionOptions, useLocationSelection } from "../contexts/LocationContext";
import { usePreferenceSettings } from "../contexts/PreferenceContext";
import { useShelterData } from "../contexts/ShelterDataContext";
import { shelterTypeLabels } from "../data/mockShelters";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import { Shelter } from "../types/shelter";
import {
  calculateShelterScore,
  getRecommendedShelters,
  getShelterRecommendationReasons,
  getShelterWithOriginDistance
} from "../utils/recommendShelters";
import {
  comfortLabel,
  crowdLabel,
  formatDistance,
  formatRecommendationScore,
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

type DepartureOption = {
  id: string;
  label: string;
  location: Coordinates;
};

const MAX_MAP_MARKERS = 30;
const MAX_LIST_ITEMS = 10;

function matchesSearch(shelter: Shelter, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    shelter.name,
    shelter.address,
    shelter.region ?? "",
    shelterTypeLabels[shelter.type]
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function RegionSelector({
  selectedRegion,
  onSelectRegion
}: {
  selectedRegion: AppRegionKey;
  onSelectRegion: (region: AppRegionKey) => void;
}) {
  return (
    <View style={styles.regionWrap}>
      {regionOptions.map((region) => {
        const active = selectedRegion === region.key;
        return (
          <Pressable
            key={region.key}
            style={[styles.regionChip, active && styles.regionChipActive]}
            onPress={() => onSelectRegion(region.key)}
          >
            <Text style={[styles.regionChipText, active && styles.regionChipTextActive]}>{region.shortLabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MapScreen({ navigation, route }: Props) {
  const { shelters, filteredShelterCount } = useShelterData();
  const { preferences } = usePreferenceSettings();
  const {
    selectedRegion,
    setSelectedRegion,
    regionLabel,
    surroundingLabel,
    currentLocation,
    moveToCurrentLocation
  } = useLocationSelection();
  const [selectedShelterId, setSelectedShelterId] = useState(route.params?.selectedShelterId ?? shelters[0]?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDepartureOptions, setShowDepartureOptions] = useState(false);
  const [departure, setDeparture] = useState<DepartureOption | null>(null);

  const departureOptions = useMemo<DepartureOption[]>(() => {
    const baseOptions: DepartureOption[] = [
      { id: "current", label: "현재 위치", location: currentLocation },
      { id: "seoul", label: "서울 성북구", location: { latitude: 37.5894, longitude: 127.0167 } },
      { id: "daejeon", label: "대전 시청", location: { latitude: 36.3504, longitude: 127.3845 } },
      { id: "daegu", label: "대구 중구", location: { latitude: 35.8714, longitude: 128.6014 } },
      { id: "busan", label: "부산 시청", location: { latitude: 35.1796, longitude: 129.0756 } },
      { id: "gwangju", label: "광주 시청", location: { latitude: 35.1595, longitude: 126.8526 } }
    ];

    const selectedShelter = shelters.find((shelter) => shelter.id === selectedShelterId);
    if (!selectedShelter) return baseOptions;

    return [
      ...baseOptions,
      {
        id: "selected-shelter",
        label: "선택한 쉼터 주변",
        location: { latitude: selectedShelter.latitude, longitude: selectedShelter.longitude }
      }
    ];
  }, [currentLocation, selectedShelterId, shelters]);

  const origin = departure?.location ?? currentLocation;
  const searchedShelters = useMemo(
    () => shelters.filter((shelter) => matchesSearch(shelter, searchQuery)),
    [searchQuery, shelters]
  );
  const recommendedShelters = useMemo(
    () => getRecommendedShelters(searchedShelters, preferences, origin),
    [origin, preferences, searchedShelters]
  );
  const listShelters = recommendedShelters.slice(0, MAX_LIST_ITEMS);
  const mapShelters = recommendedShelters.slice(0, MAX_MAP_MARKERS);

  const selectedShelter = useMemo(
    () =>
      recommendedShelters.find((shelter) => shelter.id === selectedShelterId) ??
      recommendedShelters[0] ??
      shelters.find((shelter) => shelter.id === selectedShelterId) ??
      shelters[0],
    [recommendedShelters, selectedShelterId, shelters]
  );
  const selectedShelterForDisplay = selectedShelter ? getShelterWithOriginDistance(selectedShelter, origin) : undefined;
  const selectedRankOffset = selectedShelterForDisplay
    ? Math.max(0, recommendedShelters.findIndex((shelter) => shelter.id === selectedShelterForDisplay.id))
    : 0;
  const selectedScore = selectedShelterForDisplay
    ? calculateShelterScore(selectedShelterForDisplay, preferences, origin)
    : 0;
  const selectedDisplayScore = getDisplayScore(selectedScore, selectedRankOffset);
  const selectedReasons = selectedShelterForDisplay
    ? getShelterRecommendationReasons(selectedShelterForDisplay, preferences, origin)
    : [];

  useEffect(() => {
    if (route.params?.selectedShelterId && shelters.some((shelter) => shelter.id === route.params?.selectedShelterId)) {
      setSelectedShelterId(route.params.selectedShelterId);
    }
  }, [route.params?.selectedShelterId, shelters]);

  useEffect(() => {
    if (!recommendedShelters.some((shelter) => shelter.id === selectedShelterId) && recommendedShelters[0]) {
      setSelectedShelterId(recommendedShelters[0].id);
    }
  }, [recommendedShelters, selectedShelterId]);

  const openDetail = (shelterId: string) => {
    navigation.navigate("ShelterDetail", { shelterId });
  };

  const selectBestShelter = () => {
    if (recommendedShelters[0]) setSelectedShelterId(recommendedShelters[0].id);
  };

  const handleMoveToCurrentLocation = () => {
    setDeparture(null);
    moveToCurrentLocation();
  };

  const setDepartureFromSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    const matchedOption = departureOptions.find((option) => option.label.toLowerCase().includes(query));
    const next = matchedOption ?? departureOptions.find((option) => option.id === selectedRegion) ?? departureOptions[0];
    setDeparture(next);
    setShowDepartureOptions(false);
  };

  if (!selectedShelterForDisplay) {
    return (
      <View style={[sharedStyles.screen, styles.center]}>
        <Text style={sharedStyles.sectionTitle}>주변 쉼터 정보를 불러오는 중입니다.</Text>
      </View>
    );
  }

  const countLabel = searchQuery.trim()
    ? `검색 결과 ${searchedShelters.length}곳`
    : `${surroundingLabel} 쉼터 ${filteredShelterCount}곳`;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>주변 쉼터 탐색</Text>
        <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
          선택한 지역과 사용자 조건을 기준으로 추천합니다.
        </Text>
        <RegionSelector selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />

        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="쉼터명, 주소, 역 근처 검색"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <Pressable style={styles.smallActionButton} onPress={setDepartureFromSearch}>
            <Text style={styles.smallActionText}>출발지</Text>
          </Pressable>
        </View>

        <View style={styles.controlRow}>
          <Pressable style={styles.controlButton} onPress={handleMoveToCurrentLocation}>
            <Text style={styles.controlButtonText}>현재 위치로 이동</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setShowDepartureOptions((value) => !value)}>
            <Text style={styles.controlButtonText}>출발지 설정</Text>
          </Pressable>
        </View>

        <Text style={styles.departureText}>출발지: {departure?.label ?? "현재 위치"}</Text>

        {showDepartureOptions ? (
          <View style={styles.departureWrap}>
            {departureOptions.map((option) => {
              const active = departure?.id === option.id || (!departure && option.id === "current");
              return (
                <Pressable
                  key={option.id}
                  style={[styles.departureChip, active && styles.departureChipActive]}
                  onPress={() => {
                    setDeparture(option.id === "current" ? null : option);
                    setShowDepartureOptions(false);
                  }}
                >
                  <Text style={[styles.departureChipText, active && styles.departureChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Pressable style={[sharedStyles.primaryButton, styles.findButton]} onPress={selectBestShelter}>
          <Text style={sharedStyles.primaryButtonText}>
            {departure ? "출발지 기준 최적 쉼터 찾기" : "내 위치 기준 최적 쉼터 찾기"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.countCard}>
        <Text style={styles.countText}>{countLabel}</Text>
        <Text style={sharedStyles.muted}>
          {searchQuery.trim()
            ? searchedShelters.length > 0
              ? "선택 지역의 쉼터 목록 안에서 검색했습니다."
              : "검색 결과가 없습니다. 다른 키워드로 검색해 보세요."
            : "현재 위치 주변 쉼터를 표시하고 있습니다."}
        </Text>
      </View>

      <NaverMapWeb
        shelters={mapShelters}
        selectedShelterId={selectedShelterForDisplay.id}
        currentLocation={currentLocation}
        departureLocation={departure?.location}
        mapCenter={departure?.location ?? currentLocation}
        regionLabel={regionLabel}
        onSelectShelter={setSelectedShelterId}
        onOpenShelter={openDetail}
      />

      <View style={sharedStyles.elevatedCard}>
        <View style={sharedStyles.row}>
          <Text style={styles.selectedLabel}>{departure ? "출발지 기준 추천 쉼터" : `${regionLabel} 기준 추천 쉼터`}</Text>
          <Text style={styles.scoreBadge}>{formatRecommendationScore(selectedScore, selectedRankOffset)}</Text>
        </View>
        <Text style={styles.selectedName}>{selectedShelterForDisplay.name}</Text>
        <Text style={sharedStyles.muted}>{selectedShelterForDisplay.address}</Text>

        <View style={styles.scoreArea}>
          <ScoreBar score={selectedDisplayScore} />
        </View>

        <View style={styles.statusRow}>
          <StatusPill label={openLabel(selectedShelterForDisplay.isOpen)} />
          <StatusPill label={comfortLabel(selectedShelterForDisplay.coolingStatus)} tone="blue" />
          <StatusPill label={`혼잡도 ${crowdLabel(selectedShelterForDisplay.crowdLevel)}`} tone="gray" />
        </View>

        <Text style={[sharedStyles.body, styles.address]}>
          {formatDistance(selectedShelterForDisplay.distanceMeters)} · 도보 {selectedShelterForDisplay.walkMinutes}분
        </Text>

        <View style={styles.tagWrap}>
          {selectedReasons.map((reason) => (
            <Tag key={reason} label={reason} tone={reason.includes("운영") ? "green" : "blue"} />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[sharedStyles.primaryButton, styles.flexButton]}
            onPress={() => openDetail(selectedShelterForDisplay.id)}
          >
            <Text style={sharedStyles.primaryButtonText}>상세 보기</Text>
          </Pressable>
          <Pressable
            style={[sharedStyles.secondaryButton, styles.flexButton]}
            onPress={() => setSelectedShelterId(selectedShelterForDisplay.id)}
          >
            <Text style={sharedStyles.secondaryButtonText}>경로 보기</Text>
          </Pressable>
          <Pressable
            style={[styles.outlineButton, styles.flexButton]}
            onPress={() => navigation.navigate("Report", { shelterId: selectedShelterForDisplay.id })}
          >
            <Text style={styles.outlineButtonText}>상태 제보</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={sharedStyles.sectionTitle}>추천순 Top 10</Text>
        <Text style={sharedStyles.muted}>선택 지역의 쉼터 중 현재 기준에 맞는 순서입니다.</Text>
      </View>

      {listShelters.map((shelter, index) => {
        const selected = shelter.id === selectedShelterForDisplay.id;
        const score = calculateShelterScore(shelter, preferences, origin);
        const displayScore = getDisplayScore(score, index);

        return (
          <Pressable
            key={shelter.id}
            style={[sharedStyles.card, selected && styles.selectedCard]}
            onPress={() => setSelectedShelterId(shelter.id)}
          >
            <View style={sharedStyles.row}>
              <Text style={styles.shelterName}>{index + 1}. {shelter.name}</Text>
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
  regionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12
  },
  regionChip: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  regionChipActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  regionChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  regionChipTextActive: {
    color: "#ffffff"
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  smallActionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 13
  },
  smallActionText: {
    color: colors.blue,
    fontWeight: "900"
  },
  controlRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  controlButton: {
    flexGrow: 1,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  controlButtonText: {
    color: colors.text,
    fontWeight: "900"
  },
  departureText: {
    marginTop: 10,
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  departureWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10
  },
  departureChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  departureChipActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  departureChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  departureChipTextActive: {
    color: "#ffffff"
  },
  findButton: {
    marginTop: 12
  },
  countCard: {
    borderRadius: 16,
    padding: 13,
    backgroundColor: "#eef6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  countText: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 3
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
