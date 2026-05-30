import React, { createContext, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { readStore, writeStore } from "./localStore";

export type ThemeMode = "day" | "dark";

export const palettes = {
  day: {
    background: "#f6faf4",
    surface: "#ffffff",
    surfaceSoft: "#f8fafc",
    text: "#111827",
    muted: "#64748b",
    border: "#e2e8f0",
    header: "#0b1726",
    accent: "#35a853",
    accentBright: "#76FF03",
    danger: "#dc2626",
  },
  dark: {
    background: "#0F1419",
    surface: "#1a1f26",
    surfaceSoft: "#111827",
    text: "#ffffff",
    muted: "#9aa6b2",
    border: "#263241",
    header: "#07111f",
    accent: "#76FF03",
    accentBright: "#76FF03",
    danger: "#ef4444",
  },
};

type ThemeModeContextValue = {
  mode: ThemeMode;
  palette: typeof palettes.day;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStore("themeMode", "day"));

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    writeStore("themeMode", nextMode);
  };

  const value = useMemo(
    () => ({
      mode,
      palette: palettes[mode],
      setMode,
      toggleMode: () => setMode(mode === "day" ? "dark" : "day"),
    }),
    [mode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const value = useContext(ThemeModeContext);
  if (!value) {
    throw new Error("useThemeMode must be used inside ThemeModeProvider");
  }

  return value;
}

export function ThemeToggle() {
  const { mode, toggleMode, palette } = useThemeMode();

  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        {
          backgroundColor: mode === "day" ? "#ffffff" : "#111827",
          borderColor: mode === "day" ? "#d1d5db" : "#334155",
        },
      ]}
      onPress={toggleMode}
    >
      <Text style={[styles.toggleText, { color: palette.text }]}>
        {mode === "day" ? "Dark" : "Day"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
