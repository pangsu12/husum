import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  ShelterDetail: { shelterId: string };
  Preference: undefined;
  Report: { shelterId: string };
};

export type TabParamList = {
  Home: undefined;
  Map: { selectedShelterId?: string } | undefined;
  Analytics: undefined;
  Favorite: undefined;
  MyPage: undefined;
};
