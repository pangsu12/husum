import { Pressable, StyleSheet, Text, View } from "react-native";

import { mockShelters, shelterTypeLabels } from "../data/mockShelters";
import { formatDistance, openLabel } from "../screens/ShelterUi";
import { colors } from "../screens/sharedStyles";
import { Shelter } from "../types/shelter";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  shelters?: Shelter[];
  selectedShelterId?: string;
  currentLocation?: Coordinates;
  departureLocation?: Coordinates;
  onSelectShelter: (shelterId: string) => void;
  onOpenShelter: (shelterId: string) => void;
  mapStatusLabel?: string;
  regionLabel?: string;
};

const markerColors: Record<Shelter["type"], string> = {
  cooling: colors.blue,
  heating: colors.warning,
  public: colors.green,
  private: colors.purple
};

function markerPosition(index: number) {
  const positions = [
    { top: "24%", left: "25%" },
    { top: "42%", left: "65%" },
    { top: "64%", left: "39%" },
    { top: "28%", left: "78%" },
    { top: "70%", left: "72%" },
    { top: "18%", left: "48%" },
    { top: "54%", left: "18%" },
    { top: "36%", left: "38%" },
    { top: "78%", left: "52%" },
    { top: "16%", left: "68%" }
  ] as const;

  return positions[index % positions.length];
}

export function FallbackMapView({
  shelters = mockShelters,
  selectedShelterId,
  departureLocation,
  onSelectShelter,
  onOpenShelter,
  mapStatusLabel,
  regionLabel = "현재 위치"
}: Props) {
  const selectedShelter =
    shelters.find((shelter) => shelter.id === selectedShelterId) ?? shelters[0] ?? mockShelters[0];

  return (
    <View style={styles.shell}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapStatus}>{mapStatusLabel ?? `${regionLabel} 주변 쉼터를 표시하고 있습니다.`}</Text>
        <Text style={styles.mapScale}>{regionLabel} 주변</Text>
      </View>
      <View style={styles.mapCanvas}>
        <View style={[styles.road, styles.roadOne]} />
        <View style={[styles.road, styles.roadTwo]} />
        <View style={[styles.road, styles.roadThree]} />
        <View style={[styles.park, styles.parkOne]} />
        <View style={[styles.park, styles.parkTwo]} />
        <View style={[styles.building, styles.buildingOne]} />
        <View style={[styles.building, styles.buildingTwo]} />
        <View style={[styles.building, styles.buildingThree]} />
        <View style={styles.currentMarker}>
          <Text style={styles.locationMarkerText}>현</Text>
        </View>
        {departureLocation ? (
          <View style={styles.departureMarker}>
            <Text style={styles.locationMarkerText}>출</Text>
          </View>
        ) : null}
        {shelters.slice(0, 10).map((shelter, index) => {
          const selected = shelter.id === selectedShelter.id;
          const recommended = index === 0;

          return (
            <Pressable
              key={shelter.id}
              style={[
                styles.marker,
                markerPosition(index),
                { backgroundColor: markerColors[shelter.type] },
                recommended && styles.recommendedMarker,
                selected && styles.selectedMarker
              ]}
              onPress={() => onSelectShelter(shelter.id)}
            >
              <Text style={styles.markerText}>{index + 1}</Text>
            </Pressable>
          );
        })}
        <View style={styles.zoomBox}>
          <Text style={styles.zoomText}>+</Text>
          <View style={styles.zoomDivider} />
          <Text style={styles.zoomText}>-</Text>
        </View>
      </View>
      <Pressable style={styles.placeCard} onPress={() => onOpenShelter(selectedShelter.id)}>
        <View style={styles.placeTitleRow}>
          <Text style={styles.placeName}>{selectedShelter.name}</Text>
          <Text style={styles.recommendBadge}>
            {selectedShelter.id === shelters[0]?.id ? "추천" : shelterTypeLabels[selectedShelter.type]}
          </Text>
        </View>
        <Text style={styles.placeMeta}>
          {selectedShelter.address} · {formatDistance(selectedShelter.distanceMeters)} · 도보{" "}
          {selectedShelter.walkMinutes}분 · {openLabel(selectedShelter.isOpen)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  mapHeader: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  mapStatus: {
    flex: 1,
    color: colors.blue,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "900"
  },
  mapScale: {
    color: colors.text,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800"
  },
  mapCanvas: {
    height: 390,
    backgroundColor: "#dff3e8"
  },
  road: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    borderWidth: 1
  },
  roadOne: {
    width: "120%",
    height: 34,
    top: 150,
    left: -28,
    transform: [{ rotate: "-16deg" }]
  },
  roadTwo: {
    width: 34,
    height: "120%",
    top: -30,
    left: 172,
    transform: [{ rotate: "20deg" }]
  },
  roadThree: {
    width: "92%",
    height: 24,
    bottom: 70,
    left: 18,
    transform: [{ rotate: "9deg" }]
  },
  park: {
    position: "absolute",
    backgroundColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#86efac"
  },
  parkOne: {
    width: 105,
    height: 72,
    bottom: 102,
    left: 28
  },
  parkTwo: {
    width: 78,
    height: 58,
    top: 46,
    right: 38
  },
  building: {
    position: "absolute",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  buildingOne: {
    width: 92,
    height: 72,
    top: 46,
    left: 34
  },
  buildingTwo: {
    width: 118,
    height: 82,
    bottom: 42,
    right: 28
  },
  buildingThree: {
    width: 86,
    height: 62,
    top: 205,
    left: 132
  },
  currentMarker: {
    position: "absolute",
    top: "49%",
    left: "47%",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff"
  },
  departureMarker: {
    position: "absolute",
    top: "57%",
    left: "53%",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff"
  },
  locationMarkerText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  marker: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff"
  },
  recommendedMarker: {
    borderColor: "#facc15"
  },
  selectedMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: "#facc15",
    transform: [{ translateX: -5 }, { translateY: -5 }]
  },
  markerText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  zoomBox: {
    position: "absolute",
    right: 12,
    top: 92,
    width: 38,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  zoomText: {
    color: colors.text,
    textAlign: "center",
    lineHeight: 34,
    fontSize: 19,
    fontWeight: "900"
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.line
  },
  placeCard: {
    margin: 10,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  placeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  placeName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900"
  },
  recommendBadge: {
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "900"
  },
  placeMeta: {
    color: colors.muted,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700"
  }
});
