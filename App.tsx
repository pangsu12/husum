import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, StyleSheet, View } from "react-native";

import { FavoriteProvider } from "./src/contexts/FavoriteContext";
import { PreferenceProvider } from "./src/contexts/PreferenceContext";
import { ReportProvider } from "./src/contexts/ReportContext";
import { ShelterDataProvider } from "./src/contexts/ShelterDataContext";
import { WeatherProvider } from "./src/contexts/WeatherContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.webBackground}>
        <View style={styles.appFrame}>
          <FavoriteProvider>
            <PreferenceProvider>
              <ShelterDataProvider>
                <WeatherProvider>
                  <ReportProvider>
                    <NavigationContainer>
                      <RootNavigator />
                    </NavigationContainer>
                  </ReportProvider>
                </WeatherProvider>
              </ShelterDataProvider>
            </PreferenceProvider>
          </FavoriteProvider>
        </View>
      </View>
      <StatusBar barStyle="dark-content" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webBackground: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb"
  },
  appFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 410,
    alignSelf: "center",
    backgroundColor: "#f8fafc",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  }
});
