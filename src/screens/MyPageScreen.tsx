import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePreferenceSettings } from "../contexts/PreferenceContext";
import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import { Tag } from "./ShelterUi";
import { colors, sharedStyles } from "./sharedStyles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "MyPage">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MyPageScreen({ navigation }: Props) {
  const { selectedTagLabels, routeLabel } = usePreferenceSettings();

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={styles.eyebrow}>내 맞춤 조건</Text>
        <Text style={styles.userName}>휴숨 사용자</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          선택한 조건은 쉼터 추천 점수에 반영됩니다.
        </Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>현재 내 조건</Text>
        <View style={styles.tagWrap}>
          {selectedTagLabels.length === 0 ? (
            <Tag label="선택 조건 없음" tone="gray" />
          ) : (
            selectedTagLabels.map((tag) => <Tag key={tag} label={tag} tone="blue" />)
          )}
        </View>
        <View style={styles.routeBox}>
          <Text style={sharedStyles.metricLabel}>이동 선호</Text>
          <Text style={styles.routeText}>{routeLabel}</Text>
        </View>
      </View>

      <Pressable style={sharedStyles.primaryButton} onPress={() => navigation.navigate("Preference")}>
        <Text style={sharedStyles.primaryButtonText}>내 조건 수정하기</Text>
      </Pressable>

      <View style={styles.menuGrid}>
        <MenuItem title="즐겨찾기" description="저장한 쉼터를 확인합니다." onPress={() => navigation.navigate("Favorite")} />
        <MenuItem title="알림 설정" description="위험 알림을 준비 중입니다." />
        <MenuItem title="앱 소개" description="현재 위치와 조건에 맞는 쉼터를 추천합니다." />
      </View>
    </ScrollView>
  );
}

function MenuItem({ title, description, onPress }: { title: string; description: string; onPress?: () => void }) {
  return (
    <Pressable style={sharedStyles.card} onPress={onPress}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={[sharedStyles.muted, { marginTop: 5 }]}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  userName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  routeBox: {
    marginTop: 12,
    borderRadius: 12,
    padding: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  routeText: {
    color: colors.text,
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900"
  },
  menuGrid: {
    gap: 10
  },
  menuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  }
});
