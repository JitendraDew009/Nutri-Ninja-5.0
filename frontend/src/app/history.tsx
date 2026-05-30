import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getHealthScore, getHealthScoreColor } from "../utils/healthScore";
import { productSummary, readStore, writeStore } from "../utils/localStore";
import { useThemeMode } from "../utils/themeMode";

export default function HistoryScreen() {
  const { palette } = useThemeMode();
  const [history, setHistory] = useState<any[]>(() => readStore("scanHistory", []));
  const [basket, setBasket] = useState<any[]>(() => readStore("groceryBasket", []));

  const totalScans = history.length;
  const averageScore = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((sum, item) => sum + getHealthScore(item), 0);
    return Math.round(total / history.length);
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    writeStore("scanHistory", []);
  };

  const handleAddToBasket = (product: any) => {
    const summary = productSummary(product);
    const nextBasket = [summary, ...basket.filter((item) => (item.code || item.product_name) !== summary.code)].slice(0, 30);
    setBasket(nextBasket);
    writeStore("groceryBasket", nextBasket);
    alert("Added to Grocery Basket");
  };

  const removeScan = (id: string) => {
    const nextHistory = history.filter((item) => (item.code || item.product_name) !== id);
    setHistory(nextHistory);
    writeStore("scanHistory", nextHistory);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.heroTitle, { color: palette.text }]}>Welcome, Nutri Ninja!</Text>
          <Text style={[styles.heroGoal, { color: palette.accentBright }]}>Goal: Weight Loss</Text>
          <Text style={[styles.heroQuote, { color: palette.text }]}>"Every scanned nutrient is another step toward absolute dietary agility. Fight fake sugars, eat healthy!"</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.statLabel, { color: palette.muted }]}>Total Scans</Text>
            <Text style={[styles.statValue, { color: palette.text }]}>{totalScans}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.statLabel, { color: palette.muted }]}>Average Score</Text>
            <Text style={[styles.statValue, { color: getHealthScoreColor(averageScore) }]}>{averageScore}%</Text>
          </View>
        </View>

        <View style={[styles.recentCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: palette.text }]}>Recent Food Scans</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={[styles.clearText, { color: palette.danger }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {history.length > 0 ? (
            history.map((product) => (
              <View key={product.code || product.product_name} style={[styles.scanRow, { borderColor: palette.border }]}> 
                <View style={styles.scanThumb}>
                  {product.image_front_url ? (
                    <Image source={{ uri: product.image_front_url }} style={styles.scanImage} />
                  ) : (
                    <View style={[styles.scanPlaceholder, { backgroundColor: palette.surfaceSoft }]}> 
                      <Text style={[styles.scanPlaceholderText, { color: palette.muted }]}>IMG</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scanInfo}>
                  <Text style={[styles.scanName, { color: palette.text }]} numberOfLines={1}>{product.product_name}</Text>
                  <Text style={[styles.scanBrand, { color: palette.muted }]} numberOfLines={1}>{product.brands || "Open Food Facts"}</Text>
                </View>
                <View style={[styles.gradePill, { backgroundColor: getHealthScoreColor(getHealthScore(product)) }]}> 
                  <Text style={styles.gradeText}>{getHealthScore(product)}</Text>
                </View>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: palette.accentBright }]} onPress={() => handleAddToBasket(product)}>
                  <Text style={[styles.addButtonText, { color: palette.text, fontWeight: "900" }]}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeScan(product.code || product.product_name)} style={styles.removeButton}>
                  <Text style={[styles.removeIcon, { color: palette.danger }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: palette.muted }]}>No recent scans yet. Start scanning to fill your Ninja Hub.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  heroCard: { borderRadius: 22, borderWidth: 1, padding: 22, marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: "900", marginBottom: 8 },
  heroGoal: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  heroQuote: { fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 16 },
  statLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: "900" },
  recentCard: { borderRadius: 22, borderWidth: 1, padding: 16 },
  recentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  recentTitle: { fontSize: 16, fontWeight: "900" },
  clearText: { fontSize: 13, fontWeight: "700" },
  scanRow: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingVertical: 14 },
  scanThumb: { width: 48, height: 48, borderRadius: 14, overflow: "hidden" },
  scanImage: { height: "100%", width: "100%" },
  addButton: {
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: { fontSize: 12, fontWeight: "700" },
  scanPlaceholder: { alignItems: "center", justifyContent: "center", height: "100%", width: "100%" },
  scanPlaceholderText: { fontSize: 12, fontWeight: "700" },
  scanInfo: { flex: 1 },
  scanName: { fontSize: 14, fontWeight: "800" },
  scanBrand: { fontSize: 12, marginTop: 4 },
  gradePill: { alignItems: "center", borderRadius: 999, minWidth: 38, paddingHorizontal: 10, paddingVertical: 8 },
  gradeText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  removeButton: { padding: 6 },
  removeIcon: { fontSize: 18, fontWeight: "900" },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 12 }
});
