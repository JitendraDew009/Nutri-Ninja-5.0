import React, { createContext, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { readStore, writeStore } from "./localStore";

export type ThemeMode = "day" | "dark";

export const palettes = {
  day: {
    background: "#f4f7fb",
    surface: "#ffffff",
    surfaceSoft: "#edf2f8",
    text: "#10172f",
    muted: "#64718a",
    border: "#d9e1ec",
    header: "#10172f",
    accent: "#22b86f",
    accentBright: "#49df88",
    danger: "#ef4650",
  },
  dark: {
    background: "#050817",
    surface: "#10172f",
    surfaceSoft: "#202b52",
    text: "#f8fafc",
    muted: "#9ca7be",
    border: "#2c395f",
    header: "#102f38",
    accent: "#22b86f",
    accentBright: "#49df88",
    danger: "#ef4650",
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
  const [mode, setModeState] = useState<ThemeMode>(() => readStore("themeModeV2", "dark"));

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    writeStore("themeMode", nextMode);
    writeStore("themeModeV2", nextMode);
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
