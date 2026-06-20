import { Tabs } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Text } from "react-native";
import { ThemeModeProvider, useThemeMode } from "../utils/themeMode";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <ThemedTabs />
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}

function ThemedTabs() {
  const { palette } = useThemeMode();
  const insets = useSafeAreaInsets();
  const bottomSafePadding = Platform.OS === "web" ? 20 : Math.max(12, insets.bottom + 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: palette.accentBright,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.header,
          borderTopColor: palette.border,
          height: 62 + bottomSafePadding,
          paddingBottom: bottomSafePadding,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan/Search",
          tabBarIcon: () => (
            <Text style={{ color: "#fff", fontSize: 22 }}>🔎</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Ninja Hub",
          tabBarIcon: () => (
            <Text style={{ color: "#fff", fontSize: 22 }}>🥷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="grocery-basket"
        options={{
          title: "Grocery Basket",
          tabBarIcon: () => (
            <Text style={{ color: "#fff", fontSize: 22 }}>🧺</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Diet Profile",
          tabBarIcon: () => (
            <Text style={{ color: "#fff", fontSize: 22 }}>📋</Text>
          ),
        }}
      />
    </Tabs>
  );
}
