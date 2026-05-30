import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

interface ProductCardProps {
  image: string;
  name: string;
  brand?: string;
  score: number;
  scoreLabel: string;
  onPress: () => void;
}

export function ProductCard({
  image,
  name,
  brand,
  score,
  scoreLabel,
  onPress,
}: ProductCardProps) {
  const getScoreColor = (s: number): string => {
    if (s >= 80) return "#16a34a";
    if (s >= 60) return "#65a30d";
    if (s >= 40) return "#eab308";
    if (s >= 20) return "#f97316";
    return "#dc2626";
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) }]}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {brand}
          </Text>
        )}
        <Text style={[styles.scoreLabel, { color: getScoreColor(score) }]}>
          {scoreLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface NutritionRowProps {
  label: string;
  value: string;
  icon?: string;
}

export function NutritionRow({ label, value, icon }: NutritionRowProps) {
  return (
    <View style={styles.nutriRow}>
      <Text style={styles.nutriLabel}>
        {icon && `${icon} `}
        {label}
      </Text>
      <Text style={styles.nutriValue}>{value}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  icon: string;
}

export function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1f26",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#0a0f14",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0f14",
  },
  placeholderText: {
    color: "#666",
    fontSize: 12,
  },
  scoreBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  scoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  nutriRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
  },
  nutriLabel: {
    fontSize: 14,
    color: "#ccc",
  },
  nutriValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#76FF03",
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
