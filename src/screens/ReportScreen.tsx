import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ShelterReport, useReports } from "../contexts/ReportContext";
import { mockShelters } from "../data/mockShelters";
import { RootStackParamList } from "../navigation/navigationTypes";
import { colors, sharedStyles } from "./sharedStyles";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

const groups = [
  { key: "isOpen", title: "운영 상태", trueText: "운영 중", falseText: "문 닫힘" },
  { key: "coolingGood", title: "냉방 상태", trueText: "냉방 잘 됨", falseText: "냉방 약함" },
  { key: "heatingGood", title: "난방 상태", trueText: "난방 잘 됨", falseText: "난방 약함" },
  { key: "crowded", title: "혼잡도", trueText: "혼잡함", falseText: "여유 있음" },
  { key: "hasWater", title: "물 제공", trueText: "물 제공", falseText: "미제공" },
  { key: "wheelchairAccessible", title: "휠체어 접근", trueText: "접근 가능", falseText: "접근 불가능" },
  { key: "hasRiskyRoute", title: "위험 경로", trueText: "있음", falseText: "없음" }
] as const;

type ReportState = Omit<ShelterReport, "shelterId">;

export function ReportScreen({ navigation, route }: Props) {
  const requestedShelterId = route.params.shelterId;
  const shelter = mockShelters.find((item) => item.id === requestedShelterId);
  const { addReport } = useReports();
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<ReportState>({
    isOpen: true,
    coolingGood: true,
    heatingGood: true,
    crowded: false,
    hasWater: true,
    wheelchairAccessible: true,
    hasRiskyRoute: false
  });

  if (!shelter) {
    return (
      <View style={[sharedStyles.screen, styles.centerContent]}>
        <View style={sharedStyles.elevatedCard}>
          <Text style={styles.completeTitle}>쉼터 정보를 찾을 수 없습니다.</Text>
          <Text style={[sharedStyles.muted, { marginTop: 8 }]}>지도 화면에서 쉼터를 다시 선택해 주세요.</Text>
        </View>
        <Pressable style={sharedStyles.primaryButton} onPress={() => navigation.navigate("MainTabs", { screen: "Map" })}>
          <Text style={sharedStyles.primaryButtonText}>지도 화면으로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const reportData: ShelterReport = { shelterId: shelter.id, ...answers };

  const submit = () => {
    addReport(reportData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[sharedStyles.screen, styles.centerContent]}>
        <View style={sharedStyles.elevatedCard}>
          <Text style={styles.completeTitle}>제보가 접수되었습니다.</Text>
          <Text style={[sharedStyles.body, { marginTop: 10 }]}>
            알려주신 쉼터 상태는 다른 사용자의 추천 정확도를 높이는 데 반영됩니다.
          </Text>
          <Text style={[sharedStyles.muted, { marginTop: 8 }]}>{shelter.name}</Text>
        </View>

        <Pressable
          style={sharedStyles.primaryButton}
          onPress={() => navigation.replace("ShelterDetail", { shelterId: shelter.id })}
        >
          <Text style={sharedStyles.primaryButtonText}>쉼터 상세로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={sharedStyles.sectionTitle}>쉼터 상태 제보</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>{shelter.name}</Text>
        <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
          쉼터 상태를 알려주시면 다른 사용자의 추천 정확도를 높이는 데 도움이 됩니다.
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group.key} style={[sharedStyles.card, { gap: 10 }]}>
          <Text style={sharedStyles.sectionTitle}>{group.title}</Text>
          <View style={styles.segment}>
            <Option
              label={group.trueText}
              active={answers[group.key]}
              onPress={() => setAnswers((current) => ({ ...current, [group.key]: true }))}
            />
            <Option
              label={group.falseText}
              active={!answers[group.key]}
              onPress={() => setAnswers((current) => ({ ...current, [group.key]: false }))}
            />
          </View>
        </View>
      ))}

      <Pressable style={[sharedStyles.primaryButton, styles.submitButton]} onPress={submit}>
        <Text style={sharedStyles.primaryButtonText}>제보 제출</Text>
      </Pressable>
    </ScrollView>
  );
}

function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segmentItem, active && styles.segmentActive]} onPress={onPress}>
      <Text numberOfLines={1} style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: "center",
    padding: 18,
    gap: 12
  },
  completeTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "900"
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    padding: 4
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    minWidth: 0
  },
  segmentActive: {
    backgroundColor: colors.blue
  },
  segmentText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900"
  },
  segmentTextActive: {
    color: "#ffffff"
  },
  submitButton: {
    marginTop: 4
  }
});
