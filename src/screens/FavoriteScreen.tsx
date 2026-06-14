import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useFavorites } from "../contexts/FavoriteContext";
import { useShelterData } from "../contexts/ShelterDataContext";
import { shelterTypeLabels } from "../data/mockShelters";
import { RootStackParamList } from "../navigation/navigationTypes";
import { formatDistance, openLabel } from "./ShelterUi";
import { colors, sharedStyles } from "./sharedStyles";

type Props = NativeStackScreenProps<RootStackParamList>;

export function FavoriteScreen({ navigation }: Props) {
  const { favoriteIds } = useFavorites();
  const { findShelter } = useShelterData();
  const favoriteShelters = favoriteIds
    .map((shelterId) => findShelter(shelterId))
    .filter((shelter): shelter is NonNullable<typeof shelter> => Boolean(shelter));

  if (favoriteShelters.length === 0) {
    return (
      <View style={[sharedStyles.screen, { justifyContent: "center", padding: 24 }]}>
        <View style={[sharedStyles.elevatedCard, { alignItems: "center", paddingVertical: 36 }]}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", marginBottom: 8 }}>
            아직 즐겨찾기한 쉼터가 없습니다.
          </Text>
          <Text style={[sharedStyles.muted, { textAlign: "center" }]}>
            자주 이용하는 쉼터를 상세 화면에서 즐겨찾기에 추가해 보세요.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <Text style={sharedStyles.sectionTitle}>즐겨찾기 쉼터</Text>
      {favoriteShelters.map((shelter) => (
        <Pressable
          key={shelter.id}
          style={sharedStyles.card}
          onPress={() => navigation.navigate("ShelterDetail", { shelterId: shelter.id })}
        >
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}>{shelter.name}</Text>
          <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
            {shelterTypeLabels[shelter.type]} · {formatDistance(shelter.distanceMeters)} · 도보{" "}
            {shelter.walkMinutes}분 · {openLabel(shelter)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
