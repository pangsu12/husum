import { ScrollView, Text, View } from "react-native";

import { colors, sharedStyles } from "./sharedStyles";

const notifications = [
  "폭염 위험 매우 높음: 가까운 냉방쉼터를 확인하세요.",
  "성북종합사회복지관 무더위쉼터 운영 시간이 변경되었습니다.",
  "오늘 오후 오존 농도가 높아질 수 있습니다.",
  "한파 주의보 발령 시 가까운 한파쉼터를 확인하세요."
];

export function NotificationScreen() {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <Text style={sharedStyles.sectionTitle}>알림</Text>
      {notifications.map((item, index) => (
        <View key={item} style={sharedStyles.card}>
          <Text style={{ color: colors.blue, fontWeight: "900", marginBottom: 6 }}>
            알림 {index + 1}
          </Text>
          <Text style={sharedStyles.body}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
