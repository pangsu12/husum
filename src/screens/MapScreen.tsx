import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { NaverMapWeb } from "../components/NaverMapWeb";
import { AppRegionKey, Coordinates, regionOptions, useLocationSelection } from "../contexts/LocationContext";
import { usePreferenceSettings } from "../contexts/PreferenceContext";
import { useShelterData } from "../contexts/ShelterDataContext";
import { useWeather } from "../contexts/WeatherContext";
import { shelterTypeLabels } from "../data/mockShelters";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import { Shelter } from "../types/shelter";
import {
  calculateShelterScore,
  getRecommendedShelters,
  getShelterRecommendationReasons,
  getShelterWithOriginDistance
} from "../utils/recommendShelters";
import { calculateHeatIllnessRisk } from "../utils/heatIllnessRisk";
import { getFacilityCountLabel } from "../utils/shelterStatus";
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

type DestinationMode = "manual" | "recommended" | null;

const MAX_MAP_MARKERS = 30;
const MAX_LIST_ITEMS = 10;
const recommendationCriteria = [
  "출발지에서 가까운 거리",
  "현재 운영 여부",
  "냉방 상태",
  "혼잡도",
  "물 제공 여부",
  "보행 접근성",
  "사용자 맞춤 조건",
  "현재 지역 온열질환 위험"
];

const regionSearchLabels: Record<Exclude<AppRegionKey, "current">, string> = {
  seoul: "서울",
  daejeon: "대전",
  daegu: "대구",
  busan: "부산",
  gwangju: "광주"
};

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s/g, "");
}

function getSearchTokens(query: string) {
  return normalizeSearchText(query).split(" ").filter(Boolean);
}

function getShelterSearchText(shelter: Shelter) {
  const regionName = shelter.region ? regionSearchLabels[shelter.region] : "";

  return [
    shelter.name,
    shelter.address,
    regionName,
    shelter.region ?? "",
    shelterTypeLabels[shelter.type]
  ]
    .join(" ");
}

function getShelterSearchScore(shelter: Shelter, query: string, currentRegion?: Shelter["region"]) {
  const tokens = getSearchTokens(query);
  if (tokens.length === 0) return 1;

  const haystack = normalizeSearchText(getShelterSearchText(shelter));
  const compactHaystack = compactSearchText(getShelterSearchText(shelter));
  const compactName = compactSearchText(shelter.name);
  const compactQuery = compactSearchText(query);
  const matchedCount = tokens.filter((token) => haystack.includes(token) || compactHaystack.includes(token)).length;

  if (matchedCount === 0 && !compactHaystack.includes(compactQuery)) return 0;

  let score = matchedCount * 12;
  if (compactName === compactQuery) score += 80;
  else if (compactName.startsWith(compactQuery)) score += 50;
  else if (compactName.includes(compactQuery)) score += 35;
  if (shelter.region && shelter.region === currentRegion) score += 18;

  return score;
}

export function MapScreen({ navigation, route }: Props) {
  const { shelters, allShelters, filteredShelterCount } = useShelterData();
  const { preferences } = usePreferenceSettings();
  const weather = useWeather();
  const {
    setSelectedRegion,
    regionLabel,
    analysisRegionLabel,
    effectiveRegionOption,
    surroundingLabel,
    currentLocation
  } = useLocationSelection();
  const [selectedShelterId, setSelectedShelterId] = useState(route.params?.selectedShelterId ?? shelters[0]?.id);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [destinationMode, setDestinationMode] = useState<DestinationMode>(route.params?.selectedShelterId ? "manual" : null);
  const [showDepartureOptions, setShowDepartureOptions] = useState(false);
  const [departure, setDeparture] = useState<DepartureOption | null>(null);
  const [mapFocusTarget, setMapFocusTarget] = useState<Coordinates | undefined>(undefined);
  const [mapFocusVersion, setMapFocusVersion] = useState(0);

  const departureOptions = useMemo<DepartureOption[]>(() => {
    const baseOptions: DepartureOption[] = [
      { id: "current", label: "현재 위치", location: currentLocation },
      { id: "seoul", label: "서울 성북구", location: { latitude: 37.5894, longitude: 127.0167 } },
      { id: "daejeon", label: "대전 시청", location: { latitude: 36.3504, longitude: 127.3845 } },
      { id: "daegu", label: "대구 중구", location: { latitude: 35.8714, longitude: 128.6014 } },
      { id: "busan", label: "부산 시청", location: { latitude: 35.1796, longitude: 129.0756 } },
      { id: "gwangju", label: "광주 시청", location: { latitude: 35.1595, longitude: 126.8526 } }
    ];

    return baseOptions;
  }, [currentLocation]);

  const origin = departure?.location ?? currentLocation;
  const destinationResults = useMemo(
    () => {
      const query = destinationQuery.trim();
      if (!query) return [];

      return allShelters
        .map((shelter) => ({
          shelter,
          searchScore: getShelterSearchScore(shelter, query, effectiveRegionOption.concreteRegion),
          recommendationScore: calculateShelterScore(shelter, preferences, origin)
        }))
        .filter((item) => item.searchScore > 0)
        .sort((a, b) => {
          if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
          if (a.shelter.region === effectiveRegionOption.concreteRegion && b.shelter.region !== effectiveRegionOption.concreteRegion) return -1;
          if (b.shelter.region === effectiveRegionOption.concreteRegion && a.shelter.region !== effectiveRegionOption.concreteRegion) return 1;
          if (a.shelter.distanceMeters !== b.shelter.distanceMeters) return a.shelter.distanceMeters - b.shelter.distanceMeters;
          return b.recommendationScore - a.recommendationScore;
        })
        .map((item) => item.shelter);
    },
    [allShelters, destinationQuery, effectiveRegionOption.concreteRegion, origin, preferences]
  );
  const recommendedShelters = useMemo(() => getRecommendedShelters(shelters, preferences, origin), [
    origin,
    preferences,
    shelters
  ]);
  const destinationRecommendedShelters = useMemo(
    () => getRecommendedShelters(destinationResults, preferences, origin),
    [destinationResults, origin, preferences]
  );
  const visibleShelters = destinationQuery.trim() ? destinationRecommendedShelters : recommendedShelters;
  const listShelters = visibleShelters.slice(0, MAX_LIST_ITEMS);
  const baseMapShelters = (visibleShelters.length > 0 ? visibleShelters : recommendedShelters).slice(0, MAX_MAP_MARKERS);

  const selectedShelter = useMemo(
    () =>
      allShelters.find((shelter) => shelter.id === selectedShelterId) ??
      shelters.find((shelter) => shelter.id === selectedShelterId) ??
      recommendedShelters[0] ??
      shelters[0],
    [allShelters, recommendedShelters, selectedShelterId, shelters]
  );
  const selectedShelterForDisplay = selectedShelter ? getShelterWithOriginDistance(selectedShelter, origin) : undefined;
  const mapShelters = useMemo(() => {
    if (!selectedShelterForDisplay || baseMapShelters.some((shelter) => shelter.id === selectedShelterForDisplay.id)) {
      return baseMapShelters;
    }

    return [selectedShelterForDisplay, ...baseMapShelters].slice(0, MAX_MAP_MARKERS);
  }, [baseMapShelters, selectedShelterForDisplay]);
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
  const heatIllnessRisk = calculateHeatIllnessRisk({
    feelsLikeTemperature: weather.feelsLikeTemperature,
    humidity: weather.humidity,
    heatAlertStatus: weather.heatAlertStatus,
    vulnerabilityScore: effectiveRegionOption.analysisScore
  });
  const selectedFacilityCountLabel = selectedShelterForDisplay ? getFacilityCountLabel(selectedShelterForDisplay) : "";
  const routeOriginLabel = departure?.label ?? "현재 위치";
  const routeDestinationLabel = selectedShelterForDisplay?.name ?? "선택한 쉼터";
  const mapReasons = [
    ...selectedReasons,
    ...(heatIllnessRisk.level === "높음" || heatIllnessRisk.level === "매우 높음"
      ? [`현재 지역 온열질환 위험 ${heatIllnessRisk.level}`]
      : [])
  ].slice(0, 7);
  const isManualDestination = destinationMode === "manual";
  const isRecommendedDestination = destinationMode === "recommended";
  const cardTitle = isManualDestination
    ? "선택한 도착지"
    : isRecommendedDestination
      ? "최적 추천 쉼터"
      : "현재 기준 추천 후보";
  const cardDescription = isManualDestination
    ? "출발지에서 선택한 쉼터까지의 거리와 도보 시간입니다."
    : isRecommendedDestination
      ? "거리 · 운영 여부 · 냉방 시설 · 혼잡도 · 맞춤 조건을 종합해 추천했습니다."
      : "출발지와 사용자 조건을 기준으로 추천 후보를 보여줍니다.";
  const criteriaTitle = isRecommendedDestination ? "최적 쉼터 산정 기준" : "도착지 정보";
  const selectedMarkerLabel = isRecommendedDestination ? "추천" : "도착지";

  useEffect(() => {
    if (route.params?.selectedShelterId && allShelters.some((shelter) => shelter.id === route.params?.selectedShelterId)) {
      setSelectedShelterId(route.params.selectedShelterId);
      const routeShelter = allShelters.find((shelter) => shelter.id === route.params?.selectedShelterId);
      if (routeShelter) {
        setDestinationMode("manual");
        setMapFocusTarget({ latitude: routeShelter.latitude, longitude: routeShelter.longitude });
        setMapFocusVersion((version) => version + 1);
      }
    }
  }, [allShelters, route.params?.selectedShelterId]);

  useEffect(() => {
    if (!selectedShelterId && recommendedShelters[0]) setSelectedShelterId(recommendedShelters[0].id);
  }, [recommendedShelters, selectedShelterId]);

  const openDetail = (shelterId: string) => {
    navigation.navigate("ShelterDetail", { shelterId });
  };

  const selectShelter = (shelterId: string, mode: DestinationMode = "manual") => {
    const nextShelter =
      allShelters.find((shelter) => shelter.id === shelterId) ??
      shelters.find((shelter) => shelter.id === shelterId) ??
      mapShelters.find((shelter) => shelter.id === shelterId);
    setSelectedShelterId(shelterId);
    if (nextShelter) {
      if (nextShelter.region) setSelectedRegion(nextShelter.region);
      setDestinationQuery(nextShelter.name);
      setShowDestinationResults(false);
      setDestinationMode(mode);
      Keyboard.dismiss();
      setMapFocusTarget({ latitude: nextShelter.latitude, longitude: nextShelter.longitude });
      setMapFocusVersion((version) => version + 1);
    }
  };

  const changeDestinationQuery = (value: string) => {
    setDestinationQuery(value);
    setDestinationMode(null);
    setShowDestinationResults(Boolean(value.trim()));
  };

  const selectDeparture = (option: DepartureOption) => {
    if (option.id === "current") {
      setDeparture(null);
      setShowDepartureOptions(false);
      return;
    }

    setDeparture(option);
    setShowDepartureOptions(false);
  };

  const recommendBestDestination = () => {
    const destination = recommendedShelters[0];
    if (!destination) return;

    setSelectedShelterId(destination.id);
    if (destination.region) setSelectedRegion(destination.region);
    setDestinationQuery(destination.name);
    setShowDestinationResults(false);
    setDestinationMode("recommended");
    Keyboard.dismiss();
    setMapFocusTarget({ latitude: destination.latitude, longitude: destination.longitude });
    setMapFocusVersion((version) => version + 1);
  };

  const resetRouteInputs = () => {
    setDeparture(null);
    setDestinationQuery("");
    setShowDestinationResults(false);
    setDestinationMode(null);
    setShowDepartureOptions(false);
    if (recommendedShelters[0]) setSelectedShelterId(recommendedShelters[0].id);
    setMapFocusTarget(undefined);
  };

  if (!selectedShelterForDisplay) {
    return (
      <View style={[sharedStyles.screen, styles.center]}>
        <Text style={sharedStyles.sectionTitle}>주변 쉼터 정보를 불러오는 중입니다.</Text>
      </View>
    );
  }

  const countLabel = destinationQuery.trim()
    ? `도착지 검색 결과 ${destinationResults.length}곳`
    : `${surroundingLabel} 쉼터 ${filteredShelterCount}곳`;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>출발지 · 도착지</Text>
        <Text style={[sharedStyles.muted, { marginTop: 6 }]}>등록된 쉼터 안에서 도착지를 검색합니다.</Text>
        <Text style={[sharedStyles.muted, { marginTop: 3 }]}>도착지를 선택하면 출발지 기준 거리와 도보 시간이 계산됩니다.</Text>

        <View style={styles.routeInputShell}>
          <View style={styles.routeDots}>
            <View style={styles.startDot} />
            <View style={styles.routeDotLine} />
            <View style={styles.endDot} />
          </View>
          <View style={styles.routeInputs}>
            <Pressable style={styles.routeInputBox} onPress={() => setShowDepartureOptions((value) => !value)}>
              <Text style={styles.routeInputLabel}>출발지</Text>
              <Text style={styles.routeInputValue}>{routeOriginLabel}</Text>
            </Pressable>
            <View style={styles.routeInputBox}>
              <Text style={styles.routeInputLabel}>도착지 쉼터</Text>
              <TextInput
                value={destinationQuery}
                onChangeText={changeDestinationQuery}
                onFocus={() => setShowDestinationResults(Boolean(destinationQuery.trim()))}
                placeholder={destinationMode ? routeDestinationLabel : "도착지를 검색하세요"}
                placeholderTextColor={colors.muted}
                style={styles.routeTextInput}
                returnKeyType="search"
              />
            </View>
          </View>
        </View>

        {showDepartureOptions ? (
          <View style={styles.departureWrap}>
            {departureOptions.map((option) => {
              const active = departure?.id === option.id || (!departure && option.id === "current");
              return (
                <Pressable
                  key={option.id}
                  style={[styles.departureChip, active && styles.departureChipActive]}
                  onPress={() => selectDeparture(option)}
                >
                  <Text style={[styles.departureChipText, active && styles.departureChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.routeButtonRow}>
          <Pressable style={styles.resetButton} onPress={resetRouteInputs}>
            <Text style={styles.resetButtonText}>다시입력</Text>
          </Pressable>
          <Pressable style={styles.routeButton} onPress={recommendBestDestination}>
            <Text style={styles.routeButtonText}>최적 쉼터 추천</Text>
          </Pressable>
        </View>

        <View style={styles.inputBlock}>
          <View style={sharedStyles.row}>
            <Text style={styles.inputTitle}>
              {showDestinationResults ? "도착지 검색 결과" : destinationMode ? "도착지 설정 완료" : "도착지 추천"}
            </Text>
            <Text style={styles.destinationBadge}>{routeDestinationLabel}</Text>
          </View>
          {showDestinationResults ? (
            <>
              <Text style={styles.scopeText}>등록된 쉼터 안에서 도착지를 검색합니다.</Text>
              <Text style={styles.resultText}>{countLabel}</Text>
            </>
          ) : (
            <>
              <Text style={styles.routeCompleteText}>
                {destinationMode
                  ? "도착지를 다시 검색하려면 입력창을 눌러주세요."
                  : "도착지를 검색하거나 최적 쉼터 추천을 눌러 추천 쉼터를 확인하세요."}
              </Text>
              <Text style={styles.resultText}>
                출발지에서 도착지까지 {formatDistance(selectedShelterForDisplay.distanceMeters)} · 도보{" "}
                {selectedShelterForDisplay.walkMinutes}분
              </Text>
            </>
          )}
          {showDestinationResults && destinationQuery.trim() ? (
            <View style={styles.destinationList}>
              {destinationRecommendedShelters.length > 0 ? (
                destinationRecommendedShelters.slice(0, 6).map((shelter) => (
                  <Pressable
                    key={shelter.id}
                    style={[
                      styles.destinationOption,
                      shelter.id === selectedShelterForDisplay.id && styles.destinationOptionActive
                    ]}
                    onPress={() => selectShelter(shelter.id, "manual")}
                  >
                    <Text style={styles.destinationName}>{shelter.name}</Text>
                    <Text style={styles.destinationMeta}>
                      {shelter.region ? regionSearchLabels[shelter.region] : "지역 확인"} · {openLabel(shelter)}
                    </Text>
                    <Text style={styles.destinationAddress}>{shelter.address}</Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyResultBox}>
                  <Text style={styles.emptyResultTitle}>현재 등록된 쉼터에서 검색 결과가 없습니다.</Text>
                  <Text style={sharedStyles.muted}>다른 키워드로 검색해 보세요.</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </View>

      <NaverMapWeb
        shelters={mapShelters}
        selectedShelterId={selectedShelterForDisplay.id}
        currentLocation={currentLocation}
        departureLocation={departure?.location}
        mapCenter={currentLocation}
        focusTarget={mapFocusTarget}
        focusVersion={mapFocusVersion}
        selectedMarkerLabel={selectedMarkerLabel}
        regionLabel={regionLabel}
        onSelectShelter={(shelterId) => selectShelter(shelterId, "manual")}
        onOpenShelter={openDetail}
      />

      <View style={sharedStyles.elevatedCard}>
        <View style={sharedStyles.row}>
          <Text style={styles.selectedLabel}>{cardTitle}</Text>
          <Text style={styles.scoreBadge}>{formatRecommendationScore(selectedScore, selectedRankOffset)}</Text>
        </View>
        <Text style={styles.cardDescription}>{cardDescription}</Text>
        <Text style={styles.selectedName}>{selectedShelterForDisplay.name}</Text>
        <Text style={sharedStyles.muted}>{selectedShelterForDisplay.address}</Text>

        <View style={styles.routeSummary}>
          <RouteLine label="출발지" value={routeOriginLabel} />
          <RouteLine label="도착지" value={routeDestinationLabel} />
          <RouteLine
            label="이동"
            value={`${formatDistance(selectedShelterForDisplay.distanceMeters)} · 도보 ${selectedShelterForDisplay.walkMinutes}분`}
          />
          <RouteLine label="현재 위험" value={`${analysisRegionLabel} 온열질환 위험 ${heatIllnessRisk.level}`} />
        </View>

        <View style={styles.scoreArea}>
          <ScoreBar score={selectedDisplayScore} />
        </View>

        <View style={styles.statusRow}>
          <StatusPill label={openLabel(selectedShelterForDisplay)} />
          <StatusPill label={comfortLabel(selectedShelterForDisplay.coolingStatus)} tone="blue" />
          <StatusPill label={`혼잡도 ${crowdLabel(selectedShelterForDisplay.crowdLevel)}`} tone="gray" />
        </View>

        <Text style={[sharedStyles.body, styles.address]}>출발지에서 도보 {selectedShelterForDisplay.walkMinutes}분</Text>
        {selectedFacilityCountLabel ? (
          <Text style={[sharedStyles.body, styles.address]}>{selectedFacilityCountLabel}</Text>
        ) : (
          <Text style={[sharedStyles.muted, styles.address]}>시설 정보 확인 중</Text>
        )}

        <Text style={styles.reasonTitle}>{isManualDestination ? "선택한 도착지 정보" : "추천 근거"}</Text>
        {isRecommendedDestination ? (
          <Text style={styles.reasonCopy}>
            이 쉼터를 추천한 이유: 출발지에서 가까우며, 냉방 상태와 혼잡도 조건을 함께 고려했습니다.
          </Text>
        ) : null}
        <View style={styles.tagWrap}>
          {mapReasons.map((reason) => (
            <Tag key={reason} label={reason} tone={reason.includes("운영") ? "green" : "blue"} />
          ))}
        </View>

        <View style={styles.criteriaBox}>
          <Text style={styles.criteriaTitle}>{criteriaTitle}</Text>
          {isRecommendedDestination ? (
            <>
              <Text style={styles.criteriaCopy}>{cardDescription}</Text>
              <View style={styles.criteriaGrid}>
                {recommendationCriteria.map((criterion) => (
                  <Text key={criterion} style={styles.criteriaChip}>
                    {criterion}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.criteriaCopy}>
              출발지에서 도착지까지 {formatDistance(selectedShelterForDisplay.distanceMeters)} · 도보{" "}
              {selectedShelterForDisplay.walkMinutes}분
            </Text>
          )}
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
            onPress={() => selectShelter(selectedShelterForDisplay.id, "manual")}
          >
            <Text style={sharedStyles.secondaryButtonText}>도착지로 설정</Text>
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
            onPress={() => selectShelter(shelter.id, "manual")}
          >
            <View style={sharedStyles.row}>
              <Text style={styles.shelterName}>{index + 1}. {shelter.name}</Text>
              <Text style={styles.scoreBadge}>{formatRecommendationScore(score, index)}</Text>
            </View>
            <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
              {formatDistance(shelter.distanceMeters)} · 도보 {shelter.walkMinutes}분 · {openLabel(shelter)}
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

function RouteLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.routeLine}>
      <Text style={styles.routeLabel}>{label}</Text>
      <Text style={styles.routeValue}>{value}</Text>
    </View>
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
  inputBlock: {
    gap: 9,
    marginTop: 14
  },
  inputTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  routeInputShell: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginTop: 14,
    borderRadius: 16,
    padding: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  routeDots: {
    alignItems: "center",
    paddingVertical: 12,
    width: 18
  },
  startDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.blue
  },
  routeDotLine: {
    flex: 1,
    width: 2,
    minHeight: 38,
    marginVertical: 5,
    backgroundColor: "#cbd5e1"
  },
  endDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger
  },
  routeInputs: {
    flex: 1,
    gap: 8
  },
  routeInputBox: {
    minHeight: 54,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center"
  },
  routeInputLabel: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900"
  },
  routeInputValue: {
    color: colors.text,
    marginTop: 3,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900"
  },
  routeTextInput: {
    minHeight: 26,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  routeButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  resetButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  routeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: colors.blue
  },
  routeButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
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
  scopeText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800"
  },
  resultText: {
    color: colors.blue,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900"
  },
  routeCompleteText: {
    color: colors.text,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
  },
  destinationBadge: {
    flexShrink: 1,
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900"
  },
  destinationList: {
    gap: 7,
    marginTop: 2
  },
  destinationOption: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  destinationOptionActive: {
    backgroundColor: "#eff6ff",
    borderColor: colors.blue
  },
  destinationName: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900"
  },
  destinationMeta: {
    color: colors.blue,
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900"
  },
  destinationAddress: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700"
  },
  emptyResultBox: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  emptyResultTitle: {
    color: colors.text,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "900"
  },
  departureWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
    minHeight: 76
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
  riskText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    marginBottom: 4
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
  cardDescription: {
    color: colors.text,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800"
  },
  address: {
    marginTop: 10
  },
  reasonTitle: {
    color: colors.text,
    marginTop: 14,
    fontSize: 15,
    fontWeight: "900"
  },
  reasonCopy: {
    color: colors.text,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800"
  },
  criteriaBox: {
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa"
  },
  criteriaTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900"
  },
  criteriaCopy: {
    color: colors.warning,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900"
  },
  criteriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 11
  },
  criteriaChip: {
    color: colors.text,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900"
  },
  scoreArea: {
    marginTop: 12
  },
  routeSummary: {
    gap: 7,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  routeLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  routeLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  routeValue: {
    flex: 1,
    color: colors.text,
    textAlign: "right",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900"
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
