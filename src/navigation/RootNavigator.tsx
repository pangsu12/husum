import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PreferenceScreen } from "../screens/PreferenceScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { ShelterDetailScreen } from "../screens/ShelterDetailScreen";
import { RootStackParamList } from "./navigationTypes";
import { TabNavigator } from "./TabNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f8fafc" },
        headerTintColor: "#0f172a",
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ShelterDetail" component={ShelterDetailScreen} options={{ title: "쉼터 상세" }} />
      <Stack.Screen name="Preference" component={PreferenceScreen} options={{ title: "개인 맞춤 설정" }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: "쉼터 상태 제보" }} />
    </Stack.Navigator>
  );
}
