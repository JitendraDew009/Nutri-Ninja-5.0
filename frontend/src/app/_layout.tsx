import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
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
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Ninja Hub",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "square.grid.2x2.fill", android: "dashboard", web: "dashboard" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery-basket"
        options={{
          title: "Grocery Basket",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "basket.fill", android: "shopping_basket", web: "shopping_basket" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Diet Profile",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "person.text.rectangle.fill", android: "assignment_ind", web: "assignment_ind" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
