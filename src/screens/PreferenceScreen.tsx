import { ReactNode, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  preferenceTags,
  routePreferences,
  usePreferenceSettings
} from "../contexts/PreferenceContext";
import { UserPreferences } from "../types/shelter";
import { Tag } from "./ShelterUi";
import { colors, sharedStyles } from "./sharedStyles";

const tagOptions = [
  preferenceTags.senior,
  preferenceTags.infant,
  preferenceTags.disabled,
  preferenceTags.outdoorWorker,
  preferenceTags.pregnant,
  preferenceTags.pet,
  preferenceTags.mobility,
  preferenceTags.transit
];

const routeOptions: Array<{ key: NonNullable<UserPreferences["routePreference"]>; label: string }> = [
  { key: "shortest", label: routePreferences.shortest },
  { key: "accessible", label: routePreferences.accessible },
  { key: "shade", label: routePreferences.shade }
];

export function PreferenceScreen() {
  const { preferences, setPreferences } = usePreferenceSettings();
  const [selectedTags, setSelectedTags] = useState<string[]>(preferences.tags);
  const [selectedRoute, setSelectedRoute] = useState<NonNullable<UserPreferences["routePreference"]>>(
    preferences.routePreference ?? "accessible"
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;

    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);

  const toggleTag = (value: string) => {
    setSelectedTags((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const save = () => {
    setPreferences({ tags: selectedTags, routePreference: selectedRoute });
    setSaved(true);
  };

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={sharedStyles.sectionTitle}>내 상황에 맞는 쉼터 추천</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          내 상황에 맞는 쉼터를 추천받기 위해 해당되는 항목을 선택하세요.
        </Text>
        <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
          선택한 조건은 쉼터 추천 점수에 반영됩니다.
        </Text>
      </View>

      <Section title="선택 항목">
        <View style={styles.wrap}>
          {tagOptions.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.tag, active && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="이동 선호">
        {routeOptions.map((route) => (
          <Pressable
            key={route.key}
            style={[styles.option, selectedRoute === route.key && styles.optionActive]}
            onPress={() => setSelectedRoute(route.key)}
          >
            <Text style={[styles.optionText, selectedRoute === route.key && styles.optionTextActive]}>
              {route.label}
            </Text>
          </Pressable>
        ))}
      </Section>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>현재 선택</Text>
        <View style={styles.wrap}>
          {selectedTags.length === 0 ? <Tag label="선택 조건 없음" tone="gray" /> : selectedTags.map((tag) => <Tag key={tag} label={tag} tone="blue" />)}
          <Tag label={routePreferences[selectedRoute]} tone="green" />
        </View>
      </View>

      <Pressable style={sharedStyles.primaryButton} onPress={save}>
        <Text style={sharedStyles.primaryButtonText}>{saved ? "저장 완료" : "맞춤 설정 저장"}</Text>
      </Pressable>

      {saved ? (
        <View style={styles.savedBox}>
          <Text style={styles.savedTitle}>맞춤 설정이 저장되었습니다.</Text>
          <Text style={styles.savedText}>홈과 지도 추천에 바로 적용됩니다.</Text>
        </View>
      ) : null}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontWeight: "900"
  },
  tagTextActive: {
    color: "#ffffff"
  },
  option: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    backgroundColor: "#ffffff"
  },
  optionActive: {
    backgroundColor: colors.blueSoft,
    borderColor: "#93c5fd"
  },
  optionText: {
    color: colors.text,
    fontWeight: "900"
  },
  optionTextActive: {
    color: colors.blue
  },
  savedBox: {
    borderRadius: 14,
    padding: 13,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac"
  },
  savedTitle: {
    color: "#047857",
    fontSize: 15,
    fontWeight: "900"
  },
  savedText: {
    color: colors.text,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800"
  }
});
