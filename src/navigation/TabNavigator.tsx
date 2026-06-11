import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text } from "react-native";

import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { FavoriteScreen } from "../screens/FavoriteScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { MyPageScreen } from "../screens/MyPageScreen";
import { TabParamList } from "./navigationTypes";

const Tab = createBottomTabNavigator<TabParamList>();

const labels: Record<keyof TabParamList, string> = {
  Home: "홈",
  Map: "지도",
  Analytics: "분석",
  Favorite: "즐겨찾기",
  MyPage: "마이"
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarAllowFontScaling: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: () => null,
        tabBarLabel: ({ color }) => (
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.label, { color }]}>
            {labels[route.name]}
          </Text>
        )
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "홈" }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "지도" }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: "분석" }} />
      <Tab.Screen name="Favorite" component={FavoriteScreen} options={{ title: "즐겨찾기" }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{ title: "마이" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 58,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff"
  },
  tabItem: {
    minWidth: 62,
    paddingHorizontal: 0
  },
  label: {
    width: 68,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    includeFontPadding: false
  }
});
