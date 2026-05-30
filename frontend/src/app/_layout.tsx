import { Tabs } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accentBright,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.header,
          borderTopColor: palette.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarIcon: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan/Search",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Ninja Hub",
        }}
      />
      <Tabs.Screen
        name="grocery-basket"
        options={{
          title: "Grocery Basket",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Diet Profile",
        }}
      />
    </Tabs>
  );
}
