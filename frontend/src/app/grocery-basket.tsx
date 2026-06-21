import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getHealthScore, getHealthScoreColor, getHealthScoreLabel } from "../utils/healthScore";
import { getActiveProfile, profileStoreKey, readStore, writeStore } from "../utils/localStore";
import { ThemeToggle, useThemeMode } from "../utils/themeMode";

export default function GroceryBasketScreen() {
  const { palette } = useThemeMode();
  const activeProfile = getActiveProfile();
  const basketKey = profileStoreKey("groceryBasket", activeProfile.id);
  const [basket, setBasket] = useState<any[]>(() => readStore(basketKey, []));

  const basketScore = useMemo(() => {
    if (!basket.length) return 0;
    const total = basket.reduce((sum, item) => sum + getHealthScore(item), 0);
    return Math.round(total / basket.length);
  }, [basket]);

  const clearBasket = () => {
    setBasket([]);
    writeStore(basketKey, []);
  };

  useEffect(() => {
    setBasket(readStore(basketKey, []));
  }, [basketKey]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: palette.text }]}>Grocery Basket</Text>
              <Text style={[styles.subtitle, { color: palette.muted }]}>
                {activeProfile.name}'s personalized grocery selections and basket health.
              </Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {basket.length ? (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: palette.surfaceSoft }]}> 
                <Text style={[styles.statLabel, { color: palette.muted }]}>Items</Text>
                <Text style={[styles.statValue, { color: palette.text }]}>{basket.length}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: palette.surfaceSoft }]}> 
                <Text style={[styles.statLabel, { color: palette.muted }]}>Avg score</Text>
                <Text style={[styles.statValue, { color: getHealthScoreColor(basketScore) }]}>{basketScore}</Text>
              </View>
            </View>

            <Text style={[styles.subTitle, { color: palette.text }]}>Health rating: {getHealthScoreLabel(basketScore)}</Text>
            <View style={styles.list}>
              {basket.map((item) => (
                <View key={item.code || item.product_name} style={[styles.itemRow, { borderColor: palette.border }]}> 
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, { color: palette.text }]} numberOfLines={2}>{item.product_name}</Text>
                    <Text style={[styles.itemBrand, { color: palette.muted }]} numberOfLines={1}>{item.brands || "Unknown brand"}</Text>
                  </View>
                  <View style={[styles.itemScore, { backgroundColor: getHealthScoreColor(getHealthScore(item)) }]}> 
                    <Text style={styles.itemScoreText}>{getHealthScore(item)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.clearButton} onPress={clearBasket}>
              <Text style={styles.clearButtonText}>Clear basket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Your basket is empty</Text>
            <Text style={[styles.emptyText, { color: palette.muted }]}>Scan products or add items from the product details screen to build your Grocery Basket.</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  header: { marginBottom: 18 },
  headerRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: { flex: 1, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  statValue: { fontSize: 22, fontWeight: "900", marginTop: 6 },
  subTitle: { fontSize: 13, marginBottom: 14 },
  list: { gap: 10 },
  itemRow: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingVertical: 12 },
  itemText: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "800" },
  itemBrand: { fontSize: 12, marginTop: 4 },
  itemScore: { alignItems: "center", borderRadius: 999, minWidth: 42, paddingVertical: 8, paddingHorizontal: 12 },
  itemScoreText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  clearButton: { alignItems: "center", backgroundColor: "#0f172a", borderRadius: 10, marginTop: 18, paddingVertical: 14 },
  clearButtonText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  emptyText: { fontSize: 13, lineHeight: 19 },
});
