import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeModeProvider, useThemeMode } from "../utils/themeMode";
import { AuthGate } from "../components/auth-gate";
import { hydrateStore } from "../utils/localStore";

export default function Layout() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateStore().finally(() => setHydrated(true));
  }, []);

  // Keep splash screen visible while loading persisted data (expo-router manages this)
  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <AuthGate>
          <ThemedTabs />
        </AuthGate>
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
        tabBarShowLabel: true,
        tabBarActiveTintColor: palette.accentBright,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.header,
          borderTopColor: palette.border,
          height: 62 + bottomSafePadding,
          paddingBottom: bottomSafePadding,
          paddingTop: 8,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          marginTop: 3,
        },
      }}
    >
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
        name="index"
        options={{
          title: "Scan",
          tabBarLabelStyle: styles.scanLabel,
          tabBarButton: ({ onPress, onLongPress, accessibilityState, testID, style }) => (
            <TouchableOpacity
              onPress={onPress}
              onLongPress={onLongPress || undefined}
              accessibilityRole="button"
              accessibilityState={accessibilityState}
              testID={testID}
              activeOpacity={0.85}
              style={[style, styles.scanTabButton]}
            >
              <View style={[styles.scanButtonOuter, { backgroundColor: palette.header }]}>
                <View style={[styles.scanButtonInner, { backgroundColor: palette.accentBright }]}>
                  <SymbolView
                    name={{ ios: "barcode.viewfinder", android: "barcode_scanner", web: "barcode_scanner" }}
                    tintColor="#06120c"
                    size={31}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "waveform.and.mic", android: "voice_chat", web: "voice_chat" }}
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

const styles = StyleSheet.create({
  scanTabButton: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  scanButtonOuter: {
    alignItems: "center",
    borderRadius: 40,
    height: 76,
    justifyContent: "center",
    marginTop: -34,
    width: 76,
  },
  scanButtonInner: {
    alignItems: "center",
    borderRadius: 32,
    elevation: 10,
    height: 62,
    justifyContent: "center",
    shadowColor: "#49df88",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    width: 62,
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginTop: 17,
  },
});
