import { ReactNode, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, sharedStyles } from "./sharedStyles";

const tags = [
  "어르신",
  "영유아 동반",
  "임산부",
  "야외근로자",
  "반려동물 동반",
  "보행이 불편함",
  "대중교통 이용",
  "보호자 알림 필요"
];

const routes = ["최단 거리 우선", "계단/경사 최소화", "그늘길·실내 경유 우선"];
const alerts = ["폭염·한파 위험 알림", "쉼터 운영 변경 알림", "정기 리마인더"];

export function PreferenceScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>(["어르신", "보행이 불편함"]);
  const [selectedRoute, setSelectedRoute] = useState(routes[1]);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([alerts[0]]);

  const toggle = (value: string, setter: (next: string[]) => void, current: string[]) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={sharedStyles.sectionTitle}>나에게 맞는 쉼터 찾기</Text>
        <Text style={[sharedStyles.muted, { marginTop: 8 }]}>
          선택한 조건에 따라 거리, 접근성, 혼잡도, 편의시설 추천 기준이 달라집니다.
        </Text>
      </View>

      <Section title="사용자 상황">
        <View style={styles.wrap}>
          {tags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.tag, active && styles.tagActive]}
                onPress={() => toggle(tag, setSelectedTags, selectedTags)}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="선호 이동 조건">
        {routes.map((route) => (
          <Pressable
            key={route}
            style={[styles.option, selectedRoute === route && styles.optionActive]}
            onPress={() => setSelectedRoute(route)}
          >
            <Text style={[styles.optionText, selectedRoute === route && styles.optionTextActive]}>
              {route}
            </Text>
          </Pressable>
        ))}
      </Section>

      <Section title="알림 설정">
        {alerts.map((item) => (
          <Pressable
            key={item}
            style={[styles.option, selectedAlerts.includes(item) && styles.optionActive]}
            onPress={() => toggle(item, setSelectedAlerts, selectedAlerts)}
          >
            <Text style={[styles.optionText, selectedAlerts.includes(item) && styles.optionTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </Section>

      <Pressable
        style={sharedStyles.primaryButton}
        onPress={() => Alert.alert("저장 완료", "맞춤 설정이 저장되었습니다. 추천 결과에 반영됩니다.")}
      >
        <Text style={sharedStyles.primaryButtonText}>맞춤 설정 저장</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={[sharedStyles.card, { gap: 10 }]}>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  tagActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  tagText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  tagTextActive: {
    color: "#ffffff"
  },
  option: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    backgroundColor: "#ffffff"
  },
  optionActive: {
    backgroundColor: colors.blueSoft,
    borderColor: "#93c5fd"
  },
  optionText: {
    color: colors.text,
    fontWeight: "800"
  },
  optionTextActive: {
    color: colors.blue
  }
});
