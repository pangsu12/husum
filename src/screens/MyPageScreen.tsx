import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";

import { RootStackParamList, TabParamList } from "../navigation/navigationTypes";
import { colors, sharedStyles } from "./sharedStyles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "MyPage">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MyPageScreen({ navigation }: Props) {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={sharedStyles.muted}>사용자</Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 }}>
          게스트 사용자
        </Text>
        <Text style={[sharedStyles.muted, { marginTop: 8 }]}>현재는 시연용 MVP 버전입니다.</Text>
      </View>

      <Pressable style={sharedStyles.primaryButton} onPress={() => navigation.navigate("Preference")}>
        <Text style={sharedStyles.primaryButtonText}>내 상황에 맞게 추천 설정하기</Text>
      </Pressable>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>시민 제보 내역</Text>
        <Text style={[sharedStyles.muted, { marginTop: 8 }]}>
          내가 제출한 제보와 반영 상태를 확인하는 기능으로 확장할 예정입니다.
        </Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>알림 설정</Text>
        <Text style={[sharedStyles.muted, { marginTop: 8 }]}>
          폭염·한파 위험 알림과 쉼터 운영 변경 알림을 추후 제공합니다.
        </Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>휴숨 소개</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          휴숨은 공공데이터와 AI 추천 로직을 사용해 폭염·한파 상황에서 사용자에게 가장 적합한
          기후쉼터를 안내하는 모바일 앱입니다.
        </Text>
      </View>
    </ScrollView>
  );
}
