import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { NaverMapWeb } from "../components/NaverMapWeb";
import { mockShelters, shelterTypeLabels } from "../data/mockShelters";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import { calculateShelterScore } from "../utils/recommendShelters";
import { colors, sharedStyles } from "./sharedStyles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Map">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MapScreen({ navigation, route }: Props) {
  const initialSelectedId = route.params?.selectedShelterId ?? "shelter-1";
  const [selectedShelterId, setSelectedShelterId] = useState(initialSelectedId);
  const selectedShelter = useMemo(
    () => mockShelters.find((shelter) => shelter.id === selectedShelterId) ?? mockShelters[0],
    [selectedShelterId]
  );
  const selectedScore = calculateShelterScore(selectedShelter);

  useEffect(() => {
    if (route.params?.selectedShelterId) {
      setSelectedShelterId(route.params.selectedShelterId);
    }
  }, [route.params?.selectedShelterId]);

  const openDetail = (shelterId: string) => {
    navigation.navigate("ShelterDetail", { shelterId });
  };

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchText}>쉼터명, 주소, 지역 검색</Text>
      </View>

      <NaverMapWeb
        selectedShelterId={selectedShelter.id}
        onSelectShelter={setSelectedShelterId}
        onOpenShelter={openDetail}
      />

      <View style={sharedStyles.elevatedCard}>
        <View style={sharedStyles.row}>
          <Text style={styles.selectedLabel}>선택된 쉼터</Text>
          <Text style={styles.scoreBadge}>{selectedScore}점</Text>
        </View>
        <Text style={styles.selectedName}>{selectedShelter.name}</Text>
        <Text style={sharedStyles.muted}>{shelterTypeLabels[selectedShelter.type]}</Text>
        <Text style={[sharedStyles.body, styles.address]}>{selectedShelter.address}</Text>
        <Text style={sharedStyles.muted}>
          {selectedShelter.distanceMeters}m · 도보 {selectedShelter.walkMinutes}분 ·{" "}
          {selectedShelter.isOpen ? "운영 중" : "운영 종료"}
        </Text>
        <Text style={[sharedStyles.muted, styles.hours]}>
          운영 시간 {selectedShelter.operatingHours} · 추천 점수 {selectedScore}점
        </Text>
        <Pressable
          style={[sharedStyles.primaryButton, { marginTop: 12 }]}
          onPress={() => openDetail(selectedShelter.id)}
        >
          <Text style={sharedStyles.primaryButtonText}>상세 보기</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <Text style={sharedStyles.sectionTitle}>주변 쉼터</Text>
        <Text style={sharedStyles.muted}>추천 쉼터는 지도에서 노란 테두리로 강조됩니다.</Text>
      </View>

      {mockShelters.map((shelter) => {
        const selected = shelter.id === selectedShelter.id;

        return (
          <Pressable
            key={shelter.id}
            style={[sharedStyles.card, selected && styles.selectedCard]}
            onPress={() => setSelectedShelterId(shelter.id)}
          >
            <View style={sharedStyles.row}>
              <Text style={styles.shelterName}>{shelter.name}</Text>
              <Text style={styles.scoreBadge}>{calculateShelterScore(shelter)}점</Text>
            </View>
            <Text style={sharedStyles.muted}>
              {shelterTypeLabels[shelter.type]} · {shelter.distanceMeters}m · 도보{" "}
              {shelter.walkMinutes}분 · {shelter.isOpen ? "운영 중" : "운영 종료"}
            </Text>
            <Pressable style={styles.inlineButton} onPress={() => openDetail(shelter.id)}>
              <Text style={styles.inlineButtonText}>상세 보기</Text>
            </Pressable>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  searchIcon: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: "900"
  },
  searchText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  selectedLabel: {
    color: colors.blue,
    fontWeight: "900"
  },
  selectedName: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 26,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "900"
  },
  address: {
    marginTop: 8,
    marginBottom: 5
  },
  hours: {
    marginTop: 5
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
  inlineButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  inlineButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900"
  }
});
