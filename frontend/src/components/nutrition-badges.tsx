import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { getHealthScoreColor, getHealthScoreLabel } from "../utils/healthScore";

interface HealthScoreBadgeProps {
  score: number;
  size?: "small" | "medium" | "large";
}

export function HealthScoreBadge({ score, size = "medium" }: HealthScoreBadgeProps) {
  const color = getHealthScoreColor(score);
  const label = getHealthScoreLabel(score);

  const sizeStyles = {
    small: { width: 60, height: 60, fontSize: 16, labelSize: 10 },
    medium: { width: 80, height: 80, fontSize: 24, labelSize: 12 },
    large: { width: 100, height: 100, fontSize: 32, labelSize: 14 },
  };

  const style = sizeStyles[size];

  return (
    <View style={[styles.badge, { width: style.width, height: style.height, backgroundColor: color }]}>
      <Text style={[styles.scoreNumber, { fontSize: style.fontSize }]}>{score}</Text>
      <Text style={[styles.scoreLabel, { fontSize: style.labelSize }]}>/100</Text>
    </View>
  );
}

interface NutriScoreBadgeProps {
  grade: string;
}

export function NutriScoreBadge({ grade }: NutriScoreBadgeProps) {
  const getNutriColor = (g: string): string => {
    switch (g?.toUpperCase()) {
      case "A":
        return "#16a34a";
      case "B":
        return "#65a30d";
      case "C":
        return "#eab308";
      case "D":
        return "#f97316";
      case "E":
        return "#dc2626";
      default:
        return "#666666";
    }
  };

  const color = getNutriColor(grade);

  return (
    <View style={[styles.nutriBadge, { borderColor: color }]}>
      <Text style={[styles.nutriGrade, { color }]}>{grade?.toUpperCase()}</Text>
      <Text style={styles.nutriLabel}>Nutri</Text>
    </View>
  );
}

interface WarningBadgeProps {
  severity: "low" | "medium" | "high";
  title: string;
  onPress?: () => void;
}

export function WarningBadge({ severity, title, onPress }: WarningBadgeProps) {
  const getColor = (): string => {
    switch (severity) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#f97316";
      case "low":
        return "#eab308";
    }
  };

  const color = getColor();

  return (
    <TouchableOpacity
      style={[styles.warningBadge, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <Text style={[styles.warningText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scoreNumber: {
    fontWeight: "bold",
    color: "#fff",
  },
  scoreLabel: {
    color: "#fff",
    marginTop: 2,
  },
  nutriBadge: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  nutriGrade: {
    fontSize: 20,
    fontWeight: "bold",
  },
  nutriLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  warningBadge: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 12,
    marginVertical: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
